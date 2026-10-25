# JARVIS — Sincronismo labial por loopback de áudio (V4.3)

## V4.3 experimental: intensidade da saída de áudio do Windows

O sincronizador em `scripts/jarvis-lipsync.py` usa **WASAPI loopback** no dispositivo de saída padrão (no teste, `4 - SAMSUNG`). Processa os blocos de PCM somente em memória, calcula uma intensidade RMS, descarta o bloco imediatamente e envia somente o nível de 0 a 1 para a porta local 3766. **Não** armazena, grava, transcreve nem envia o áudio para a nuvem. O monitor só lê áudio durante a sessão visual; o microfone do avatar continua desabilitado.

Quando está ativo, o motor do rosto 3D recebe o nível continuamente pelo canal SSE e move a boca pela amplitude real do áudio; `jarvis_voice_turn` (temporizado) é ignorado nesse modo para não disputar a animação. Não depende de uma chamada MCP a cada turno do ChatGPT. Novidade MCP: `jarvis_audio_sync` habilita ou desabilita a reação ao loopback quando o monitor de áudio está em execução.

Para consultar/reiniciar/parar manualmente o processo local sem tocar no Codex, use:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\\scripts\\start-lipsync.ps1 -Mode status
    powershell -NoProfile -ExecutionPolicy Bypass -File .\\scripts\\start-lipsync.ps1 -Mode start
    powershell -NoProfile -ExecutionPolicy Bypass -File .\\scripts\\start-lipsync.ps1 -Mode stop

Limites: *sincronismo por amplitude*, **não fonemas**; qualquer aplicativo que produza som na mesma saída padrão pode movimentar o rosto. A fala real do ChatGPT continua reproduzida exclusivamente pelo cliente ChatGPT. O modo Live não expõe eventos de PCM à ferramenta MCP, mas o monitor local reage de forma independente ao que sair nos alto-falantes. O processo não é instalado para iniciar com o Windows; precisa ser iniciado novamente após reinicialização do computador.

## Duas origens preservadas: PC + celular

**PC/Chrome:** quando a voz sai pela saída padrão do Windows, o monitor WASAPI envia somente intensidade numérica para a porta 3766 e o rosto move a boca de acordo com o volume. Isso funciona com qualquer fonte de áudio do Windows, não apenas o ChatGPT.

**Celular/ChatGPT:** quando você conversa no aplicativo do telefone e o ChatGPT chama o Protocolo JARVIS via MCP/Desktop Commander, `jarvis_voice_turn` simula pensamento e fala silenciosa por um período estimado. O áudio permanece no telefone e não é enviado ao PC.

**Convivência:** `audioSync=true` não bloqueia mais `voice_turn`. Um comando remoto ativo marca `remoteTurnActive=true`, e o renderer deixa temporariamente de exigir intensidade do Windows; ao terminar, retorna ao controle do PC sem desligar o monitor. Na interface aparece **PC · ÁUDIO WINDOWS ATIVO | CELULAR · MCP DISPONÍVEL** ou **EM USO · CELULAR / MCP**.

**Limitação atual:** o modo Voz Live do ChatGPT não garante uma chamada MCP automática por resposta. Mesmo com o plugin do Chrome, conversas abertas no aplicativo do celular não transmitem eventos de voz diretamente à extensão do PC. O modelo visual usa uma estimativa temporizada quando a fala vem do telefone; para a saída de áudio local, usa intensidade em tempo real, não fonemas.

## Ajuste de latência para o celular (25/10/2026)

O comando `scripts/jarvis-voice.ps1 -Mode turn -Seconds N` agora aciona `animate_reply`: a expressão **Falando** é publicada imediatamente, sem acrescentar a pausa artificial de 450 ms do fluxo `voice_turn`. `-Mode listen` devolve o rosto imediatamente a **Ouvindo** e encerra a animação ativa sem desativar o monitor do Windows. Quando não houver sinal confiável de fim da fala, o temporizador `Seconds` oferece o retorno automático. `-Mode legacy_turn` mantém o fluxo Pensando -> Falando quando necessário. `-Mode instant` é um alias explícito do novo turno direto.

Isso reduz o atraso interno do estado visual, mas **não é sincronização por áudio ou fonemas**: os eventos de início/fim da voz Live do telefone não chegam diretamente ao PC. A latência de chamada MCP e as variações na duração efetiva da resposta permanecem. O JARVIS é um avatar silencioso, sem voz adicional.

A interface móvel na porta 3767 é intencionalmente **somente leitura**: o CSS inibe `.controls` e o proxy aceita apenas `GET`. Estar no mesmo Wi-Fi não autoriza modificar estados; controles móveis completos exigem projeto de autenticação no servidor LAN. Não remover a restrição apenas no CSS.
