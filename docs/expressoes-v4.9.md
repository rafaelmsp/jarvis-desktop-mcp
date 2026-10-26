# JARVIS V4.9 — Expressões visuais (ChatGPT Classic)

A V4.9 acrescenta um diretor de expressões faciais para o avatar 3D do navegador. Com a sessão visual ativa e o monitor de áudio Windows ligado, o rosto reage automaticamente ao **ritmo e à intensidade do áudio reproduzido no PC**.

A resposta pode apresentar concentração no início e entre frases, sorriso discreto eventual e movimentos breves de alerta/surpresa em variações de volume. Esses sinais **não são análise emocional da conversa**; o monitor não transcreve o áudio nem detecta palavras. O botão **Demonstrar 4 expressões (12 s)** percorre pensando, feliz, alerta e surpreso para avaliar o movimento sem depender de uma fala. Outro botão liga/desliga as reações automáticas; na rede LAN o painel continua apenas para visualização.

Uma emoção explicitamente enviada pelo MCP ou selecionada pelo usuário tem prioridade sobre as reações baseadas no áudio. O áudio original do ChatGPT continua no navegador ou celular; o JARVIS não produz voz independente. No modo Voz Live, o acionamento do MCP a cada resposta ainda não é garantido pela plataforma.

**Teste:** npm run build-v4, npm test. **Início:** iniciar-jarvis-manual.bat. **Não** criar inicialização automática do Windows, expor o MCP na LAN, ou alterar outros projetos.

Copyright © Rafael Passos — Engenharia de Software, IA e Segurança da Informação.

## Acionamento durante teste por voz

Falar as palavras 'feliz', 'pensando', 'alerta' e 'surpreso' no ChatGPT Classic não aciona automaticamente os comandos MCP do JARVIS. Para teste visual real, use o botão do painel, `scripts/demo-expressoes-chat.ps1` ou `scripts/acionar-expressao-chat.ps1 -Expression surprised` no PC. Esses comandos usam o loopback local (3766), não iniciam serviços com o Windows e não alteram o áudio. Se a aba do rosto estiver oculta, a animação WebGL pode ficar pausada; abra o painel em uma janela visível. O recebimento de comando pelo servidor não garante por si só que a renderização tenha sido vista na tela.
