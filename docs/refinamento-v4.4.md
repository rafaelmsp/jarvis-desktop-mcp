# JARVIS V4.4 — Refinamento anatómico e holográfico

**Autor:** Rafael Passos — Engenharia de Software, IA e Segurança da Informação
**Estado:** versão experimental, implementada em `feature/jarvis-v4.4-face-refinement`.

## Objetivo
Preservar a malha facial de 468 vértices MediaPipe, os 898 triângulos, o visual wireframe azul e os dois modos de sincronismo (áudio local Windows e resposta remota MCP), enquanto melhora-se a naturalidade facial.

## Modificações efetivas
1. **Rosto/anatomia:** `src/client/face-v4-rig.js` calcula deslocamentos locais não destrutivos. A topologia e os vértices de origem permanecem intactos.
2. **Boca e mandíbula:** deformação separada dos lábios superior/inferior, abertura proporcional à intensidade do áudio, relaxamento depois do silêncio, leve movimento do maxilar e melhor ancoragem dos cantos.
3. **Olhos e expressões:** transições suavizadas; piscar assimétrico determinístico; movimentos ligeiros da íris, sobrancelhas e região orbital para os estados de escuta, pensamento, felicidade, surpresa e alerta.
4. **Grid refinado:** contornos extras para lábios, face e sobrancelhas no módulo `face-v4-finishing.js`; brilho discreto durante a fala sem superfícies sólidas nem dentes artificiais.
5. **Progresso visual:** abaixo do rosto, barra real de carregamento com percentagem numérica adjacente. Marcos de inicialização 8%, 26%, 52%, 81%, 100%; o último corresponde ao primeiro fotograma 3D renderizado.
6. **Diagnóstico:** `window.__jarvisV4.getPose()` permite inspecionar os pesos faciais, e `getStatus()` informa o estado do motor.
7. **Compatibilidade:** permanecem os modos Núcleo, Rosto, sessão visual, comandos MCP, controlo local, prioridade de turnos remotos, token local e captura WASAPI opcional.

## Execução e testes
No PC de desenvolvimento:

```powershell
cd C:\Users\Rafael\Documents\JarvisAvatar
npm ci
npm run build-v4
npm test
```

O painel já utilizado está em `http://127.0.0.1:3766/`. Atualizar a aba com **Ctrl+F5** recarrega o código. Não é necessário reiniciar o servidor para atualizar apenas HTML, CSS e o bundle. A barra deverá exibir **100%** após a primeira renderização bem-sucedida.

### Critérios de aceitação
- Rosto visível com WebGL, sem fallback ou erros de malha.
- Barra de inicialização finaliza com a indicação «Rosto V4.4 pronto · 100%».
- Expressões controladas pelo sistema continuam a aparecer no rosto.
- Abertura labial proporcional ao nível de áudio; após silêncio, regressa a «Ouvindo».
- Em resposta remota MCP, o turno não perde a prioridade sobre a saída local do Windows.
- Sem modificação de firewall, autenticação, projetos jurídicos ou ficheiros de rede não relacionados.
- Autoria e licença do projeto continuam no rodapé.

## Limites técnicos
Isto é refinamento anatómico e sincronização por **amplitude**, não reconhecimento labial fonético. A saída de áudio utilizada pelo monitor Windows pode incluir sons de aplicações diferentes do ChatGPT. Não foi adicionada gravação, reconhecimento de voz, áudio próprio do avatar, transferência de áudio para nuvem ou controlo de outros programas.

## Recuperação
A branch anterior `feature/jarvis-v4-humanoid` mantém a V4.3. A V4.4 está isolada na sua branch de refinamento. Não misturar alterações nesta branch com os ficheiros não relacionados de configuração de rede; para recuperar a versão base basta voltar à branch anterior após guardar o trabalho em curso.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
