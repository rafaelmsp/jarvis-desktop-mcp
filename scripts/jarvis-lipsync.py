"""JARVIS: intensidade do áudio de saída do Windows -> avatar local (sem gravação).
Não armazena, transcreve nem transmite PCM. Apenas envia RMS normalizado
ao servidor JARVIS via loopback e token local, enquanto a sessão visual estiver ativa.
"""
import json
import math
import os
import sys
import time
import urllib.request
import urllib.error
import msvcrt
from pathlib import Path
import numpy as np
import soundcard as sc

PORT = int(os.environ.get("JARVIS_PORT", "3766"))
BASE = f"http://127.0.0.1:{PORT}"
TOKEN_PATH = Path.home() / f".jarvis-desktop-mcp-token-{PORT}"
LOCK_PATH = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / f"jarvis-lipsync-{PORT}.lock"
FRAMES = 2048
RATE = 48000

def request(path, payload=None, timeout=1.4):
    headers = {}
    if payload is None:
        req = urllib.request.Request(BASE + path)
    else:
        headers = {"Content-Type": "application/json", "X-Jarvis-Token": TOKEN_PATH.read_text().strip()}
        req = urllib.request.Request(BASE + path, data=json.dumps(payload).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)

def command(action, value):
    return request("/api/control", {"action": action, "value": value})

def active(state):
    return bool(state.get("voiceSession"))

def run():
    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOCK_PATH.open("a+b") as lock:
        lock.seek(0)
        lock.write(b"0")
        lock.flush()
        lock.seek(0)
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            print("JARVIS: monitor de áudio já está em execução.", flush=True)
            return
        print(f"JARVIS loopback preparado: {BASE}. Nenhum áudio será armazenado.", flush=True)
        while True:
            try:
                state = request("/api/state")
                if not active(state):
                    time.sleep(0.6)
                    continue
                speaker = sc.default_speaker()
                if speaker is None:
                    raise RuntimeError("Nenhum dispositivo de saída padrão")
                microphone = sc.get_microphone(id=speaker.id, include_loopback=True)
                if microphone is None:
                    raise RuntimeError("Loopback WASAPI indisponível")
                print(f"Capturando somente amplitude em {speaker.name}.", flush=True)
                with microphone.recorder(samplerate=RATE, blocksize=FRAMES) as recorder:
                    command("set_audio_sync", True)
                    peak = 0.022
                    smooth = 0.0
                    hold_until = 0.0
                    prev_state_check = time.monotonic()
                    prev_active = False
                    while True:
                        pcm = recorder.record(numframes=FRAMES)
                        now = time.monotonic()
                        # Dados de PCM são descartados após este cálculo; sem arquivos nem rede.
                        rms = float(np.sqrt(np.mean(np.square(pcm, dtype=np.float64))))
                        del pcm
                        peak = max(0.022, peak * 0.994, rms)
                        # Noise gate digital; não confundir silêncio com fala.
                        if rms >= 0.0055:
                            hold_until = now + 0.20
                        sound_active = now < hold_until
                        scaled = min(1.0, max(0.0, (rms - 0.003) / (peak * 0.72 - 0.003)))
                        smooth = smooth * (0.28 if scaled > smooth else 0.72) + scaled * (0.72 if scaled > smooth else 0.28)
                        level = round(max(0.13, smooth), 3) if sound_active else 0.0
                        command("set_audio_level", level)
                        # Não captura nada fora da sessão visual.
                        if now - prev_state_check >= 1.0:
                            state = request("/api/state")
                            if not active(state) or state.get("audioSync") is False:
                                break
                            prev_state_check = now
            except (OSError, ValueError, RuntimeError, urllib.error.URLError) as exc:
                print(f"JARVIS loopback temporariamente indisponível: {exc}", flush=True)
                try:
                    command("set_audio_sync", False)
                except Exception:
                    pass
                time.sleep(2.0)
            except KeyboardInterrupt:
                break

if __name__ == "__main__":
    run()
