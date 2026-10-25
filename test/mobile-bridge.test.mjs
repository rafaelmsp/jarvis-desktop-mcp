import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('resposta MCP do celular prevalece temporariamente sem desligar audioSync', async () => {
  const port = 40000 + Math.floor(Math.random() * 9000);
  const tokenFile = path.join(os.homedir(), '.jarvis-desktop-mcp-token-' + port);
  const processServer = spawn(process.execPath, ['src/server.mjs'], {
    cwd: new URL('..', import.meta.url), env: {...process.env, JARVIS_PORT: String(port)}, stdio: 'ignore'
  });
  const base = 'http://127.0.0.1:' + port;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(base + '/api/state'); ready = r.ok; if (ready) break; }
      catch {}
      await new Promise(r => setTimeout(r, 80));
    }
    assert.ok(ready, 'servidor de teste online');
    const token = fs.readFileSync(tokenFile, 'utf8').trim();
    const send = async (action, value) => {
      const r = await fetch(base + '/api/control', {method:'POST',
        headers:{'content-type':'application/json','x-jarvis-token':token},
        body:JSON.stringify({action, value})});
      assert.equal(r.status, 200, 'comando ' + action);
      return (await r.json()).state;
    };
    const state = async () => (await (await fetch(base + '/api/state')).json());
    await send('set_voice_session', true);
    await send('set_audio_sync', true);
    let s = await send('voice_turn', 2);
    assert.equal(s.expression, 'thinking');
    assert.equal(s.remoteTurnActive, true, 'fonte celular tem prioridade');
    await new Promise(r => setTimeout(r, 700));
    assert.equal((await state()).expression, 'speaking');
    s = await send('set_audio_sync', true);
    assert.equal(s.remoteTurnActive, true, 'refresh do monitor local nao interrompe resposta do celular');
    s = await send('set_audio_level', 0);
    assert.equal(s.expression, 'speaking', 'silencio do PC nao interrompe voz do celular');
    await new Promise(r => setTimeout(r, 1950));
    s = await state();
    assert.equal(s.expression, 'listening');
    assert.equal(s.remoteTurnActive, false, 'turno celular encerrou');
    assert.equal(s.audioSync, true, 'modo Windows permanece ligado');
    s = await send('set_audio_level', 0.6);
    assert.equal(s.expression, 'speaking', 'loopback volta depois do turno movel');
    s = await send('animate_reply', 1);
    assert.equal(s.remoteTurnActive, true, 'botao teste mudo tambem prevalece');
    s = await send('set_audio_level', 0);
    assert.equal(s.expression, 'speaking', 'silencio do PC nao silencia simulacao');
    await new Promise(r => setTimeout(r, 1150));
    s = await state();
    assert.equal(s.remoteTurnActive, false, 'temporizador manual terminou');
    assert.equal(s.audioSync, true, 'sincronismo PC segue disponivel');
    // Caminho de baixa latencia do celular: sem etapa artificial de pensamento.
    s = await send('animate_reply', 10);
    assert.equal(s.status, 'speaking', 'boca comeca no mesmo comando');
    assert.equal(s.remoteTurnActive, true, 'celular controla o turno visual');
    s = await send('set_voice_session', true);
    assert.equal(s.status, 'listening', 'retorna imediatamente ao modo escutando');
    assert.equal(s.remoteTurnActive, false, 'encerra o turno sem esperar o temporizador');
    assert.equal(s.audioSync, true, 'monitor Windows continua preservado');
  } finally {
    processServer.kill();
    try { fs.rmSync(tokenFile); } catch {}
  }
});
