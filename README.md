# JARVIS Desktop MCP · Protótipo 0.1

Avatar visual para Windows 10 com **dois modos** (núcleo energético e rosto holográfico), expressões, brilho de voz pelo microfone opcional e **controle por ferramentas MCP**, sem API paga de IA.

A inteligência e a conversa permanecem na janela oficial do ChatGPT; a interface gráfica é controlada por ferramentas MCP **quando conectadas e chamadas explicitamente**. O painel não lê o áudio nem as mensagens do ChatGPT automaticamente.

## JARVIS V4.1 — Humanoide 3D em wireframe azul

![Prévia real do JARVIS V4.1](docs/v4-refinement-preview.webp)

A **branch `feature/jarvis-v4-humanoid`** contém a V4.1 experimental, com geometria anatômica MediaPipe (468 vértices, 898 triângulos), malha e partículas WebGL/Three.js, olhos e orelhas detalhados, pescoço e expressões animadas. O visual preserva o conceito futurista dos anos 1980 e o modo núcleo, a voz e os comandos MCP.

[Ver o relatório técnico do refinamento](docs/v4.1-refinamento.md) · [Ver a referência estética original](assets/jarvis_humanoide_grid_conceito.webp)

**Importante:** o modelo V4.1 é um protótipo. Para compilar a partir das fontes, execute `npm ci` e `npm run build-v4`. O bundle WebGL já está incluído, portanto a execução local com `npm start` não exige download de bibliotecas. Esta versão **não foi mesclada na `main`** até sua aprovação final.

## Executar no Windows 10

Requer Node.js 20+ e Edge/Chrome. Não necessita `npm install`.

1. Clone ou baixe este repositório em uma pasta própria, por exemplo `C:\Jarvis`.
2. Execute `iniciar-jarvis.bat` ou, no terminal, `npm start`.
3. Abra `http://127.0.0.1:3765`.
4. Alterne entre **Núcleo** e **Holograma**, teste expressões, clique em **Ativar voz local** e depois em **Testar resposta**. O microfone é opcional e independente.
5. Consulte `docs/integracao-mcp.md` para conectar um cliente MCP ao comando `node src/mcp-server.mjs`.

## Funcionalidades

- Rosto holográfico e núcleo circular com animações locais.
- Expressões e estado visual controlados pelo painel ou por sete ferramentas MCP.
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

Licença MIT.
