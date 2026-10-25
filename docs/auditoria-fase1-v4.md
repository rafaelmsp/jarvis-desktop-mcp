# Auditoria técnica — JARVIS V4 humanoide (Fase 1)

**Data:** 24/10/2026 (America/Sao_Paulo)  
**Repositório:** `rafaelmsp/jarvis-desktop-mcp`  
**Branch de trabalho:** `feature/jarvis-v4-humanoid`  
**Base da branch:** `main` @ `3e4bffe67eb97b02ec0c5b7178090e7fed5dce9e`  
**Escopo:** inventário, inspeção de código, identificação de dependências/riscos, execução de testes existentes e planejamento das próximas etapas. **Nenhum código de produção foi alterado nesta fase.**

## 1. Situação de referência

- A branch foi criada do mesmo commit de `main`; comparação inicial GitHub: **identical**, 0 commits à frente e 0 atrás.
- Inventário original: **14 arquivos versionados**.
- `package.json`: versão `0.1.0`, projeto ES modules, Node.js **>=20**, sem dependências npm declaradas, scripts `start`, `mcp`, `test`.
- Cópia temporária de auditoria criada no Windows, **sem alterar a instalação em execução**.
- Ambiente verificado: **Node.js v22.20.0**, npm **10.9.3**.
- `npm test`: **2 testes passaram**, 0 falhas; abrangem transição básica de estado e handshake MCP (`initialize` + `tools/list`).
- `node --check` em `public/app.js`, `src/server.mjs`, `src/mcp-server.mjs`: sem erros de sintaxe.
- **Não foram realizados** testes de renderização 3D, desempenho GPU, avaliação facial visual em Windows ou conexão real do túnel MCP do ChatGPT.

## 2. Arquitetura atual

| Camada | Localização | Técnica existente |
|---|---|---|
| Interface | `public/index.html` e `public/style.css` | HTML5/CSS3 com dois modos: núcleo e rosto |
| Face e partículas | `public/app.js` | Canvas 2D procedural; malha/pontos, expressão e animação |
| Voz local | `public/app.js` | Web Speech API (`speechSynthesis`) pt-BR, ativação manual |
| Entrada de áudio | `public/app.js` | `getUserMedia` + `AnalyserNode`; intensidade apenas |
| Estado | `src/state.mjs` | `mode`, `expression`, `status`, `speaking`, `caption`, `audioLevel` |
| Backend local | `src/server.mjs` | Node.js `http` em `127.0.0.1:3765`, SSE e comandos JSON |
| MCP | `src/mcp-server.mjs` | JSON-RPC via stdio, 7 ferramentas |
| Testes | `test/protocol.test.mjs` | `node:test`; cobertura parcial de estado/protocolo |
| Arte de referência | `assets/jarvis_humanoide_grid_conceito.webp` | **320 × 192 px** (arquivo válido, ~6,5 KiB) |

**Ferramentas MCP já declaradas:** `jarvis_set_mode`, `jarvis_set_expression`, `jarvis_set_status`, `jarvis_set_speaking`, `jarvis_set_caption`, `jarvis_get_state`, `jarvis_reset`. A ação `set_audio_level` existe no estado, mas **não** é oferecida como ferramenta MCP.

## 3. Achados priorizados

### A1 — Dois motores de rosto no mesmo JavaScript — ALTA

`public/app.js` mantém `startSynthFace` (começa aprox. na linha 136; canvas `#wireframeFace`) e uma segunda rotina `JARVIS VECTORMESH 1986` (aprox. linha 352) que cria outro `canvas`. O CSS oculta os filhos de `.face-head` que não sejam `.wireframe-face` (aprox. linha 51). O código antigo permanece e continua agendando sua rotina de animação. **Ação:** criar um único `renderer` com ciclo de vida claro, desacoplar geometria de eventos de UI e eliminar o caminho duplicado após validação.

### A2 — Limite de autenticação da API manual — ALTA antes de ampliar integrações

`src/server.mjs` aceita `POST /api/manual` se o pedido contiver o cabeçalho `X-Jarvis-UI`; não exige o segredo usado em `/api/control`. A verificação de `Origin` só é feita **quando esse cabeçalho está presente**. Isso é aceitável apenas como protótipo local com superfície restrita, **não como autenticação robusta**, pois clientes não navegador podem forjar cabeçalhos. **Ação:** introduzir proteção real compatível com controles locais e testar sem abrir portas externas; não expor a API HTTP na Internet.

### A3 — Testes insuficientes — ALTA

Os 2 testes não cobrem `/api/manual`, `/api/control`, SSE, rejeição de entradas, troca entre os dois modos, renderização, falas e regressões na integração. **Ação:** ampliar testes unitários/HTTP/MCP e testes visuais do modelo V4.

### A4 — Referência visual de baixa resolução — MÉDIA

O arquivo WebP presente no GitHub está válido, mas tem **320 × 192 px**. Não é uma malha facial `GLB/glTF`, não contém vértices 3D, esqueleto ou blendshapes. **Ação:** preservar conceito original em maior resolução para design e adquirir/criar uma malha facial 3D adequada. **Não** tratar a imagem como modelo animável.

### A5 — Ausência de pipeline WebGL e asset 3D — MÉDIA

Não há Three.js, WebGL ou modelo GLB/glTF. A renderização atual é `CanvasRenderingContext2D`, portanto a geometria não é uma cabeça 3D facial real com malha deformável. **Ação:** avaliar Three.js com modelo facial humanoide e expressões por `morphTargets`, mantendo tudo hospedado localmente. A política CSP atual limita scripts a `'self'`, exigindo arquivos empacotados no próprio servidor, sem depender de CDN.

### A6 — Orçamento de desempenho e acessibilidade — MÉDIA

Há loops de `requestAnimationFrame` do áudio e dos dois renderizadores; é preciso medir CPU/GPU, pausar desenho quando aba estiver oculta, respeitar `prefers-reduced-motion` e preservar fallback Canvas2D para dispositivos sem WebGL.

### A7 — Sincronização de voz — RESTRIÇÃO FUNCIONAL

A síntese local usa `speechSynthesis`. A interface consegue indicar início/fim da fala, mas **não dispõe de temporização fonética** para sincronismo labial exato. O áudio real do ChatGPT também **não é recebido automaticamente** pelas ferramentas MCP. Planejar mandíbula/boca aproximadas por estado e manter essas limitações explícitas.

## 4. Dependências necessárias para a Fase 2

| Componente | Atual | Proposta |
|---|---|---|
| Node.js | >=20, validado em 22.20.0 | Manter como runtime de servidor |
| Front-end | HTML/CSS/JS sem bundle | Preservar UI; adotar módulo/empacotamento local se necessário |
| Motor 3D | Nenhum | Avaliar `three` (versão fixada em lockfile) |
| Cabeça humanoide | Nenhuma malha 3D | Criar/obter GLB/glTF com licença verificada, topologia facial e blendshapes |
| Gestos e expressões | Canvas 2D | Mapear estado existente para morph targets/animação |
| Brilho/partículas | CSS/Canvas | Renderizar linhas/vértices GPU com custo controlado; fallback 2D |
| Áudio local | Web Speech + Web Audio | Preservar sem APIs pagas |
| MCP | 7 ferramentas stdio | Preservar contratos; validar cliente externo em etapa separada |
| QA | 2 testes | Ampliar unitários, API e validação visual automatizada |

**Nenhuma dependência foi instalada nesta fase.**

## 5. Estratégia de desenvolvimento isolado

1. Criar `src/client/renderer-v4` (ou módulo equivalente) **apenas nesta branch**.
2. Definir contrato mínimo de estado: `mode`, `expression`, `speaking`, `audioLevel`, sem alterar payload MCP.
3. Escolher modelo anatômico base com licença verificável; conferir silhueta frontal, três quartos e perfil antes de integrar expressões.
4. Implementar malha ciano wireframe com triangulação anatômica, sem criar segunda rotina concorrente.
5. Validar expressões, piscadas e boca; medir performance e implementar fallback.
6. Manter o modo núcleo, fala, microfone e a comunicação SSE inalterados até regressões passarem.
7. Abrir revisão de alterações; integrar a `main` **somente após aprovação explícita**.

## 6. Critérios de passagem para a Fase 2

- [x] Branch isolada criada na mesma base de `main`.
- [x] Inventário e dependências atuais identificados.
- [x] Testes existentes executados: 2/2 passaram.
- [x] Verificação de sintaxe de 3 módulos concluída.
- [x] Riscos principais documentados.
- [ ] Malha GLB/glTF facial escolhida e sua licença conferida.
- [ ] Critérios visuais anatômicos aprovados por prévias frontal/3/4/perfil.
- [ ] Testes de interface, performance e segurança ampliados.

## 7. Escopo e limites

A Fase 1 **não** instala Three.js, substitui o rosto, conecta túneis MCP, muda segredos, mexe na pasta do aplicativo em uso nem altera `main`. Este relatório é o único arquivo planejado para a branch nesta etapa. A arquitetura V4 é uma **proposta**, sujeita à avaliação de licenças, WebGL e desempenho em hardware real.
