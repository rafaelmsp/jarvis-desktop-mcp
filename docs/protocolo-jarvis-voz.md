# Protocolo JARVIS — Avatar de Voz V4.2 (experimental)

Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.

## Finalidade

A voz continua sendo exclusivamente a voz oficial do ChatGPT.
O avatar é um **boneco de ventríloquo silencioso**, em wireframe 3D.
Não acessa áudio, não gera resposta própria, não capta fala e não controla aplicativos.

## Máquina de estados

1. **Sessão desativada** → avatar neutro.
2. **Ativar sessão** → avatar ouvindo. Esta é uma postura atenta, não um detector de voz.
3. **Receber chamada de resposta via MCP** → pensando (~450 ms).
4. **Temporizador da resposta** → falando, boca e expressão animadas por tempo estimado (1–60 s).
5. **Temporizador termina** → volta a ouvindo, sem precisar de outra chamada MCP.
6. **Encerrar sessão** → neutro; interrompe animação e temporizadores pendentes.

O ChatGPT não envia eventos de áudio nem marcadores exatos de início/fim de cada sílaba via MCP.
Este modo é expressivo e aproximado, não sincronização labial por fonemas.

## MCP — ferramentas novas

- jarvis_voice_session com parâmetro booleano value (ativar/desativar).
- jarvis_voice_turn com parâmetro numérico value em segundos (1–60 s).

Permanecem as oito ferramentas já existentes de controle visual e estado.

## Sem criar túnel adicional: Desktop Commander

O Desktop Commander conectado ao ChatGPT pode executar o script PowerShell autorizado no PC.
O script lê o token local do Jarvis e envia somente uma ação visual à porta 3766.

Comandos a partir desta pasta do projeto:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\jarvis-voice.ps1 -Mode on
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\jarvis-voice.ps1 -Mode turn -Seconds 12
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\jarvis-voice.ps1 -Mode off
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\jarvis-voice.ps1 -Mode status

## Integração com ChatGPT Voice Live

O modo Live pode usar plugins conectados, mas não há garantia de que acionará um plugin
automaticamente em **todos** os turnos, especialmente durante interrupções e fala simultânea.
Não há acesso programático ao estado interno de reprodução de áudio da conversa.
Para testar o comportamento de melhor esforço, use um plugin pessoal com instruções para
enviar -Mode turn -Seconds N antes de cada resposta, quando o Protocolo JARVIS estiver ativado.
O plugin precisa ter o Desktop Commander conectado/disponível.

## Como avaliar

Abra http://127.0.0.1:3766/ e clique **Iniciar sessão visual**.
O rosto fica ouvindo; a chamada de resposta via MCP iniciará o ciclo de três etapas.
Use **Encerrar sessão visual** para interromper imediatamente.
No modo de sessão visual, a voz local do navegador e o microfone local são desativados.

## Privacidade e integridade

- HTTP permanece em 127.0.0.1. O token não é exposto no chat nem incluído no Git.
- O Desktop Commander já autorizado encaminha os comandos sem criar túnel público.
- O plugin não equivale a acesso contínuo ao microfone, texto ou áudio da conversa.
- Não modificar LexJuridicus, Codex ou Desktop Commander.
- A branch principal permanece preservada até aprovação explícita.
