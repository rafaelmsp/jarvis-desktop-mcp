# JARVIS Desktop MCP · Protótipo 0.1

Avatar visual para Windows 10 com **dois modos** (núcleo energético e rosto holográfico), expressões, brilho de voz pelo microfone opcional e **controle por ferramentas MCP**, sem API paga de IA.

A inteligência e a conversa permanecem na janela oficial do ChatGPT; a interface gráfica é controlada por ferramentas MCP **quando conectadas e chamadas explicitamente**. O painel não lê o áudio nem as mensagens do ChatGPT automaticamente.

## Executar no Windows 10

Requer Node.js 20+ e Edge/Chrome. Não necessita `npm install`.

1. Clone ou baixe este repositório em uma pasta própria, por exemplo `C:\Jarvis`.
2. Execute `iniciar-jarvis.bat` ou, no terminal, `npm start`.
3. Abra `http://127.0.0.1:3765`.
4. Alterne entre **Núcleo** e **Holograma**, teste expressões e ative o microfone opcional.
5. Consulte `docs/integracao-mcp.md` para conectar um cliente MCP ao comando `node src/mcp-server.mjs`.

## Funcionalidades

- Rosto holográfico e núcleo circular com animações locais.
- Expressões e estado visual controlados pelo painel ou por sete ferramentas MCP.
- Efeito de áudio com permissão do microfone (apenas volume local, sem gravação).
- Servidor HTTP em `127.0.0.1` com atualizações SSE.
- MCP por stdio; sem necessidade de API da OpenAI.

## Limitações

Este é um **protótipo de interface**, não um aplicativo `.exe` nem um assistente independente. Não intercepta a conversa do ChatGPT, não reproduz sua voz automaticamente e não controla o Windows. A configuração do MCP no cliente ainda é necessária.

## Segurança

A interface funciona somente em localhost e utiliza token local para comandos MCP. Evite disponibilizar a porta na rede ou inserir dados confidenciais nas legendas. Nunca publique arquivos com senhas ou tokens.

Os projetos LexJuridicus, Codex e Desktop Commander **não são alterados**.

## Testes

```powershell
npm test
```

Licença MIT.
