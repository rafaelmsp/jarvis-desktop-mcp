# JARVIS Desktop MCP · Protótipo 0.1

Avatar visual para Windows 10 com **dois modos** (núcleo energético e rosto holográfico), expressões, brilho de voz pelo microfone opcional e **controle por ferramentas MCP**, sem API paga de IA.

A inteligência e a conversa permanecem na janela oficial do ChatGPT; a interface gráfica é controlada por ferramentas MCP **quando conectadas e chamadas explicitamente**. O painel não lê o áudio nem as mensagens do ChatGPT automaticamente.

## JARVIS V4.1 — Humanoide 3D em wireframe azul

![Prévia real do JARVIS V4.1](docs/v4-refinement-preview.webp)

A **branch `feature/jarvis-v4-humanoid`** contém a V4.1 experimental, com geometria anatômica MediaPipe (468 vértices, 898 triângulos), malha e partículas WebGL/Three.js, olhos e orelhas detalhados, pescoço e expressões animadas. O visual preserva o conceito futurista dos anos 1980 e o modo núcleo, a voz e os comandos MCP.

[Ver o relatório técnico do refinamento](docs/v4.1-refinamento.md) · [Ver a referência estética original](assets/jarvis_humanoide_grid_conceito.webp)

**Importante:** o modelo V4.1 é um protótipo. Para compilar a partir das fontes, execute `npm ci` e `npm run build-v4`. O bundle WebGL já está incluído, portanto a execução local com `npm start` não exige download de bibliotecas. Esta versão **não foi mesclada na `main`** até sua aprovação final.

## Protocolo JARVIS — sessão visual em conversas por voz

A V4.2 experimental acrescenta **avatar ventríloquo silencioso**: sessão ouvindo, comando MCP de resposta pensando/falando e retorno automático a ouvindo. Não recebe, captura nem produz áudio. O som permanece no ChatGPT.

- Novas ferramentas MCP: `jarvis_voice_session` (ativar/desativar) e `jarvis_voice_turn` (estimativa de 1–60 segundos).
- Controles no painel para iniciar/encerrar sessão; microfone e voz local ficam desabilitados durante a sessão.
- Script local `scripts/jarvis-voice.ps1` para integração com o Desktop Commander já conectado ao ChatGPT, sem túnel adicional.
- **Não há garantia de chamadas automáticas em todos os turnos do modo Voz Live.** O controle é por ferramenta e os movimentos são uma aproximação visual, não lip-sync real.

[Leia a documentação do Protocolo JARVIS](docs/protocolo-jarvis-voz.md).

## Sincronização labial experimental por áudio de saída (V4.3)

O `scripts/jarvis-lipsync.py` captura exclusivamente amostras transitórias do dispositivo **padrão de saída do Windows** via loopback WASAPI, extrai somente a amplitude RMS e descarta imediatamente o áudio. Não há gravação, transcrição, rede externa nem captura de microfone. O daemon manda valores numéricos para `127.0.0.1:3766` com token local. O modelo 3D abre e fecha a boca com base nesses valores, independentemente de chamadas MCP por turno. Se o monitor de áudio parar, a fala não fica presa.

O monitor foi instalado em um ambiente Python isolado em `%LOCALAPPDATA%\\JarvisLipSync\\venv`. Com o painel iniciado na porta 3766, utilize `powershell -NoProfile -ExecutionPolicy Bypass -File .\\scripts\\start-lipsync.ps1 -Mode start`, `-Mode status` ou `-Mode stop`. Ative **Iniciar sessão visual** no painel. Verifique o indicador **PC · ÁUDIO WINDOWS ATIVO | CELULAR · MCP DISPONÍVEL**. Após a primeira instalação, atualize a aba no Chrome (F5) para carregar o novo bundle.

**Para iniciar os dois modos juntos na V4.3, use `iniciar-jarvis-dual.bat`**, na pasta do projeto. Ele inicia o avatar na porta 3766, reutiliza ou inicia o monitor de áudio do Windows e abre o Chrome, mantendo o inicializador antigo da porta 3765 inalterado.

**Dois modos ao mesmo tempo:** o JARVIS aceita a saída de áudio do PC e os comandos visuais MCP da conversa no celular. Durante uma resposta enviada pelo celular, a animação temporizada prevalece sobre o nível do Windows; ao terminar, o sincronizador local retoma automaticamente, sem ser desligado. A interface identifica qual fonte está em uso. **O modo Voz do ChatGPT ainda precisa acionar o MCP em cada resposta; esse disparo não é garantido pelo plugin do Chrome.**

**Limites:** é sincronismo de intensidade, não reconhecimento de fonemas. Como o loopback captura a **saída padrão inteira**, músicas, vídeos e outros aplicativos no mesmo dispositivo também podem mover a boca. Caso a voz do ChatGPT saia por outro dispositivo, ajuste a saída padrão do Windows. A conversa oficial do ChatGPT continua independente; o programa não recebe os eventos internos da voz do ChatGPT. É necessário iniciar o monitor novamente após reiniciar o PC; a inicialização automática não foi configurada.

## Executar no Windows 10

Requer Node.js 20+ e Edge/Chrome. Não necessita `npm install`.

1. Clone ou baixe este repositório em uma pasta própria, por exemplo `C:\Jarvis`.
2. Execute `iniciar-jarvis.bat` ou, no terminal, `npm start`.
3. Abra `http://127.0.0.1:3765`.
4. Alterne entre **Núcleo** e **Holograma**, teste expressões, clique em **Ativar voz local** e depois em **Testar resposta**. O microfone é opcional e independente.
5. Consulte `docs/integracao-mcp.md` para conectar um cliente MCP ao comando `node src/mcp-server.mjs`.

## Funcionalidades

- Rosto holográfico e núcleo circular com animações locais.
- Expressões e estado visual controlados pelo painel e por onze ferramentas MCP (incluindo controle de sessão, resposta visual e sincronismo local).
- Síntese de voz local em português no Chrome/Edge, ativada manualmente; a nova legenda recebida via MCP pode ser lida em voz alta.\n- Efeito de áudio com permissão do microfone (apenas volume local, sem gravação).
- Servidor HTTP em `127.0.0.1` com atualizações SSE.
- MCP por stdio; sem necessidade de API da OpenAI.

## Limitações

Este é um **protótipo de interface**, não um aplicativo `.exe` nem um assistente independente. Não intercepta a conversa do ChatGPT, não reproduz sua voz automaticamente e não controla o Windows. A configuração do MCP no cliente ainda é necessária. Consulte `docs/integracao-mcp.md` para conectar via STDIO no ChatGPT Desktop compatível ou via túnel no ChatGPT web.\n\n**Observação:** a voz do avatar é gerada pelo navegador e não é o áudio da voz do ChatGPT.

## Segurança

A interface funciona somente em localhost e utiliza token local para comandos MCP. Evite disponibilizar a porta na rede ou inserir dados confidenciais nas legendas. Nunca publique arquivos com senhas ou tokens.

Os projetos LexJuridicus, Codex e Desktop Commander **não são alterados**.

## Testes

```powershell
npm test
```

**Autoria e direitos autorais:** Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.

Licença MIT.
