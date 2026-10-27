# JARVIS — DOCUMENTAÇÃO MESTRE, HISTÓRICO E DIREÇÃO ARTÍSTICA
**Consolidação técnica do projeto · 27/10/2026 · Windows / MCP / Three.js**
**Responsável e autoria:** © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.
**Repositório privado:** `rafaelmsp/jarvis-desktop-mcp`
**Projeto no PC:** `C:\Users\Rafael\Documents\JarvisAvatar`
**Branch observada:** `feature/jarvis-v6-human-expressions`
**Base versionada observada:** `160624a` — cabelo arrepiado alto, degradê e risca lateral.
**Estado na coleta:** projeto local operacional; motor V6 de expressões humanas com alterações locais **ainda não consolidadas em commit**. A `main` não deve ser alterada sem aprovação.

> **Fonte da verdade:** arquivos e código locais inspecionados, documentos `docs/*.md`, histórico Git e testes executados. Este documento separa rigorosamente o que está concluído, o que está em desenvolvimento e o que é apenas conceitual. Uma API responder não comprova, por si, qualidade visual na tela.

## 1. Visão do produto

O **JARVIS** é uma representação **visual, interativa e silenciosa** da conversa do ChatGPT, não um segundo modelo de IA nem um programa que controla o computador por conta própria. O ChatGPT é a fonte das respostas e da voz; o avatar 3D apresenta postura, olhos, boca, sobrancelhas e movimentos correlacionados com sinais de estado e, no PC, intensidade da saída de áudio.

**Objetivo visual atualizado (referência mais recente do usuário):** chegar à leitura facial e expressividade de um **personagem tridimensional de jogo de luta da geração PlayStation 2**, com a personalidade visual marcante de jogos de luta Neo Geo/arcade, porém **tudo reconstruído em linhas, vértices e triângulos holográficos azuis**. Não criar uma fotografia, pintura 2D sobreposta ou textura fotorrealista. O objetivo é a **anatomia com volume de personagem 3D + superfície wireframe**, não limitar a geometria à contagem de polígonos de um console antigo.

**Direção de rosto:** jovem adulto estilizado e anatomicamente coerente; olhos com volume e reflexos técnicos, bochechas definidas, mandíbula harmoniosa, boca com selamento em repouso, movimentos musculares não simétricos e transições orgânicas.

**Direção de cabelo corrigida pela referência final:** **topete ALTO, arrepiado para CIMA**, mechas pontudas de alturas irregulares e levemente inclinadas para trás; laterais em degradê rente à cabeça; risca curva raspada **sobre a orelha direita**. **Não** usar cabelo baixo/curto no topo. Manter o corte como geometria com relevo, não uma imagem anexada.

## 2. Legenda do estado das funcionalidades

| Marca | Significado |
| --- | --- |
| ✅ Implementado e verificado | Código existente, testes ou API consultados; ainda requer aprovação visual quando aplicável. |
| 🧪 Em desenvolvimento | Implementação local em andamento, sem commit final ou sem validação visual completa. |
| 🧭 Planejado | Arquitetura debatida, **não** implementada no aplicativo. |
| ⚠️ Limitação | Comportamento possível, mas sem garantia de sincronismo, percepção ou segurança avançada. |

## 3. Linha do tempo consolidada

| Marco | Entrega | Estado e referência |
| --- | --- | --- |
| Protótipo 0.1 | Interface HTML/CSS/JS, modo núcleo, rosto 2D inicial, estado SSE e controles MCP. | ✅ `README.md`, `docs/auditoria-fase1-v4.md`. |
| Auditoria V4 | Inventário, segurança, desenho de arquitetura e detecção de renderizadores duplicados. | ✅ Documento histórico; achados continuam úteis para QA. |
| V4 / V4.1 | Rosto 3D MediaPipe: **468 vértices e 898 triângulos**, Three.js/WebGL, crânio, olhos, nariz e boca em wireframe. | ✅ `docs/fase2-v4-prototipo.md`, `docs/v4.1-refinamento.md`. |
| V4.2 | Avatar ventríloquo: ouvindo → pensando/falando → ouvindo; sessão visual por MCP. | ✅ `docs/protocolo-jarvis-voz.md`. |
| V4.3 | Monitor WASAPI loopback da saída Windows; amplitude RMS aplicada à abertura dos lábios. | ✅ `docs/sincronismo-labial-v4.3.md`. |
| V4.4–V4.6 | Contornos faciais, progresso WebGL, repouso da boca, olhos e manutenção da GPU. | ✅ `docs/refinamento-v4.4.md`, `refinamento-v4.5.md`, `refinamento-v4.6.md`. |
| V4.7 | Olhar mais natural, piscadas e acesso LAN com detecção dinâmica de IP. | ✅ `docs/refinamento-v4.7.md`, `acesso-rede-local.md`. |
| V4.8 | Convivência PC/áudio + celular/MCP, operação e diagnóstico manuais. | ✅ `README.md`. |
| V4.9 | Expressões automáticas discretas a partir do ritmo de fala; demonstração de expressões; protocolo de persona MCP. | ✅ `docs/expressoes-v4.9.md`, `JARVIS_PERSONALIDADE_MCP.md`. |
| V5.0 | Superfície facial subdividida, iluminação 3D, olhos mais volumosos e cabeça com movimento sutil. | ✅ `docs/refinamento-v5.md`. |
| V5 — UI | **Maximizar** somente o card do rosto; restaurar/Esc; tamanho responsivo. | ✅ Teste `test/fullscreen-card.test.mjs`. |
| V5 — anatomia | Malha separada para orelhas com cartilagem, lóbulo e concha; pescoço cervical e clavículas. | ✅ `docs/orelhas-pescoco-grid.md`. |
| V5 — cabelo/brows | Cabelo procedural e sobrancelhas com volume que seguem os landmarks deformados. | ✅ `docs/cabelo-sobrancelhas-grid.md`. |
| V5 — falso 3D | Três planos transparentes de profundidade, sombras e reflexos no cabelo. | ✅ `docs/corte-jovem-falso-3d.md`. |
| Atualização do corte | **Topete vertical arrepiado**, 39 feixes, 12 bandas de degradê e risca à direita; câmera readequada. | ✅ `docs/corte-arrepiado-degrade-grid.md`; commit `160624a`. |
| V6 — humanização | Musculatura virtual, assimetria facial, microexpressões, emoções escolhidas e botão para ativar/desativar. | 🧪 `docs/expressoes-humanas-v6.md`; alterações locais em andamento. |
| V7 — música/BPM | Classificar fala/música, medir BPM/onsets, sincronizar gestos e usar JSON comportamental. | 🧭 Apenas brainstorming; nenhum reconhecimento musical confirmado. |

## 4. Estado técnico observado em 27/10/2026

- ✅ **PC via Desktop Commander:** `DESKTOP-PK6DO28` alcançável na consulta.
- ✅ **Servidor local:** `http://127.0.0.1:3766/`; `/api/state` respondeu com `voiceSession=true` e `audioSync=true`. O estado observado era `speaking`.
- ✅ **Testes:** `node --test --test-concurrency=1 test/*.test.mjs` → **78 testes, 78 aprovados, 0 falhas** na última execução durante esta documentação.
- ✅ **Git:** HEAD `160624a`; há vários commits preservados em branches de V4, V5 e V6. A `main` não foi alterada nesta consolidação.
- 🧪 **Arquivos V6 atualmente modificados:** `README.md`, `public/app.js`, `public/index.html`, `public/face-v4.bundle.js`, `src/client/face-v4-finishing.js`, `face-v4-rig.js`, `face-v4.js`, `natural-head-motion.js`; novos `human-expression.js`, `test/human-expressions.test.mjs` e `docs/expressoes-humanas-v6.md`.
- ⚠️ A execução de testes **não** substitui uma inspeção visual frontal, 3/4 e lateral no Chrome/Windows; também não mede FPS de maneira conclusiva.
- ⚠️ O arquivo avulso `scripts/liberar-firewall-rede.ps1` já existia e **não deve ser incorporado automaticamente** em commits ou executado.

## 5. Arquitetura atual por camadas

```tex
ChatGPT (conversa e voz oficial)       Windows (saída de áudio padrão)
          |                                        |
   instruções/prompt/MCP                      WASAPI loopback
          |                                        |
     servidor MCP                            amplitude RMS
          |                                        |
          +---------------+------------------------+
                          |
                   Node local :3766
                 estado e eventos SSE
                          |
               Navegador / Three.js
                 mesh MediaPipe 468
                          |
        +-----------------+-------------------+
        |                 |                   |
    Rig facial       Anatomia extra       Look & FX
    e expressões     orelhas/pescoço       cabelo, sombras,
    olhos/lábios     crânio e clavícula    grid e partículas
        |                 |                   |
        +-----------------+-------------------+
                          |
                    AVATAR JARVIS
                          |
         visualizador LAN somente leitura :3767
```

### 5.1 Backend e controle
- `src/server.mjs`: servidor HTTP local, estado, comandos e SSE.
- `src/state.mjs`: modo, expressão, fala, legenda e sinais de sessão.
- `src/mcp-server.mjs`: protocolo MCP stdio; dispõe do prompt e do recurso de personalidade; **não** reproduz a fala do ChatGPT.
- `src/lan-viewer.mjs`: proxy de visualização na rede local, somente GET/SSE; controle remoto não é autorizado nessa porta.
- As **13 ferramentas MCP** registradas historicamente incluem: `jarvis_set_mode`, `jarvis_set_expression`, `jarvis_set_status`, `jarvis_set_speaking`, `jarvis_set_caption`, `jarvis_get_state`, `jarvis_reset`, `jarvis_voice_session`, `jarvis_voice_turn`, `jarvis_audio_sync`, `jarvis_animate_reply`, `jarvis_expressive_reply` e `jarvis_activate_protocol`.
- Protocolo de persona: `initialize.instructions`; `prompts/list`/ `prompts/get` (`jarvis-rafael`); `resources/list`/`resources/read` (`jarvis://protocol/persona`).
- Um documento de persona no servidor MCP **não obriga automaticamente** toda sessão do ChatGPT a seguir esse modo; é preciso invocação ou leitura explícita pelo cliente.

### 5.2 Renderização 3D e arquivos principais

| Local | Papel |
| --- | --- |
| `public/index.html`, `public/style.css` | Estrutura e estética do HUD, controles, card de rosto e maximização. |
| `public/app.js` | Controles de UI, seleção de expressão, atualizações e preferências locais. |
| `src/client/face-v4.js` | Cena Three.js, malha MediaPipe, luzes, câmera, canvas WebGL e render loop. |
| `src/client/face-v4-rig.js` | Deformação dos 468 vértices na fala, expressão, olhos, lábios e músculos. |
| `src/client/human-expression.js` | 🧪 Canais adicionais para microexpressões humanas e assimetria. |
| `src/client/face-v4-finishing.js` | Contornos finos, olhos e integração de anatomia/cabelo. |
| `src/client/ear-neck-grid.js` | Orelhas tridimensionais, músculos do pescoço e clavículas. |
| `src/client/hair-brows-grid.js` | Sobrancelhas dinâmicas e malha do couro cabeludo. |
| `src/client/hair-youth-profile.js` | Perfil do corte: topo alto, arrepiado e assimétrico. |
| `src/client/upright-hair-fade.js` | Feixes verticais, degradê geométrico e risca lateral. |
| `src/client/hair-faux-depth.js` | Profundidade visual translúcida e reflexos no cabelo. |
| `src/client/facial-surface.js` | Superfície anatômica facial suavizada. |
| `src/client/expression-director.js` | Seleção de estados expressivos a partir dos comandos e sinais de fala. |
| `src/client/natural-head-motion.js` | Pequenas rotações/inclinações naturais da cabeça. |
| `src/client/face-v4-dynamics.js`, `speech-motion.js` | Olhar, piscadas e fala sintética aproximada. |
| `public/assets/models/canonical-face.json` | Malha original de 468 landmarks + 898 triângulos. |
| `public/face-v4.bundle.js` | Bundle WebGL gerado pelo esbuild; **recompilar** após alterações das fontes. |
| `scripts/build-v4.mjs` | Compilação local do bundle. |

### 5.3 Voz, sincronismo e controle por dispositivo
**PC:** `scripts/jarvis-lipsync.py` usa WASAPI loopback, processa PCM somente na memória e envia **nível RMS** ao serviço local. Nenhuma transcrição, gravação, identificação de fonemas ou compreensão de música foi implementada. Outros sons reproduzidos no mesmo dispositivo também podem movimentar a boca.

**Celular:** o ChatGPT pode solicitar movimentos temporizados ao MCP, se a ferramenta realmente for chamada; a voz do celular não é encaminhada como PCM ao PC. O estado remoto tem prioridade temporária sobre o loopback e devolve o controle ao PC após a resposta.

**Voz:** é a voz do ChatGPT ou a voz local opcional do navegador quando ativada manualmente; o projeto visual não deve alegar produzir a voz oficial do ChatGPT nem uma nova IA.

### 5.4 Modos e comandos de UI
- **Núcleo** e **Rosto**; rosto tridimensional em wireframe azul.
- **Realismo anatômico** / **Wireframe clássico**.
- **Maximizar card do rosto** / Restaurar / tecla **Esc**, sem mudar a sessão MCP.
- **Expressões automáticas** e **Demonstração de 4 expressões**.
- 🧪 **Expressões humanas**: liga/desliga o novo motor de microexpressões V6.
- Estados básicos: `neutral`, `happy`, `alert`, `surprised`, `thinking`, `listening`, `speaking`.
- Estados guiados por fontes diferentes têm prioridade definida; ações disparadas apenas por palavra dita ao ChatGPT **não** são provas de que houve comando MCP.

## 6. Direção artística oficial — “personagem 3D de luta em GRID”

### 6.1 Interpretação correta da referência
O usuário quer uma face comparável em **expressividade, silhueta e volume** a um personagem 3D de jogo de luta da geração PS2, com identidade arcade/Neo Geo. A inspiração é **estética**, não reutilização de modelos/texturas ou personagens protegidos. O visual final deve ser uma **escultura digital anatômica recoberta por malha de arestas**, não uma imagem realista nem um rosto composto de linhas aleatórias.

### 6.2 Linguagem de geometria
1. **Silhueta primeiro**: testa, ossos zigomáticos, nariz, mandíbula e queixo com proporções de adulto jovem, sem caricatura infantil.
2. **Planos faciais legíveis**: triângulos orientados de modo a evidenciar órbitas, maçãs do rosto, ponte nasal, sulco labial, mandíbula e pescoço.
3. **Densidade adaptativa da malha**: mais subdivisões em pálpebras, sobrancelhas, canto da boca e narinas; menos no crânio e nas áreas estáticas.
4. **Olhos 3D**: globo e íris posicionados anatomicamente; piscar e direção do olhar com limites naturais.
5. **Sobrancelhas com corpo**: não apenas riscos; expressão independente esquerda/direita e integração com pálpebras/testa.
6. **Boca**: repouso fechado, cantos assimétricos, mandíbula e bochechas reagindo; sem dentes falsos criados pelo cruzamento de linhas.
7. **Cabelo de referência**: topete alto e pontudo, laterais em degradê e risca curva à direita. A silhueta deve continuar reconhecível de frente, em 3/4 e em perfil.
8. **Camadas visuais**: superfícies semitransparentes de baixo brilho atrás de arestas azul-ciano nítidas e pontos leves, criando profundidade sem perder a estética holográfica.
9. **Iluminação**: luz lateral suave + preenchimento, sem saturação uniforme que apague planos faciais.
10. **Movimentos**: transições suaves, duração desigual por região muscular e pausas naturais; evitar bobblehead e movimento constante na batida.

### 6.3 Critérios de aceitação visual (pendentes)
- [ ] Capturas **frente, 3/4 esquerdo, 3/4 direito, perfil** avaliadas no navegador real.
- [ ] Topete parece **alto e arrepiado**, não curto, arredondado ou uma touca de linhas.
- [ ] Degradê não cobre as orelhas; risca raspada é curva e visível à direita.
- [ ] Olhos e sobrancelhas parecem relacionados anatomicamente, não colados no rosto.
- [ ] Expressões **neutra, sorriso, surpresa, alerta e pensamento** são distintas e humanas.
- [ ] Boca retorna ao repouso sem serrilhado/contorno que pareça dente artificial.
- [ ] No modo de tela cheia, topo do cabelo e base do pescoço continuam dentro do quadro.
- [ ] Sem travamentos, uso de memória excessivo ou vazamento de recursos WebGL durante uso prolongado.
- [ ] Preservados a paleta azul e o HUD JARVIS; nenhum asset fotográfico confundido com malha 3D.

## 7. Expressões humanas — V6

**Estado:** 🧪 código presente e testes executados, porém os arquivos locais de V6 ainda aparecem modificados e sem um commit final nessa branch. A assinatura artística definitiva não foi aprovada visualmente.

**Estratégia usada:** deformação dos 468 landmarks originais + canais musculares procedurais: elevação/contração independente das sobrancelhas, sorriso assimétrico, bochechas, contração orbital, pressão labial discreta, micromovimentos e postura de cabeça.

**Principais referências técnicas:** `src/client/human-expression.js`, `face-v4-rig.js`, `natural-head-motion.js`, `face-v4-finishing.js`, `test/human-expressions.test.mjs`, `docs/expressoes-humanas-v6.md`.

**Próximo refinamento desejável:** mapear combinações compatíveis com FACS (unidades de ação), construir curvas por regiões anatômicas, melhorar a persistência temporal de expressões, tratar pálpebras/pescoço e validar assimetrias no navegador. Não inferir “emoções reais” nem atribuir sentimentos ao avatar.

## 8. V7 — Música, BPM e reações audiovisuais (projeto futuro)

**Estado: 🧭 BRAINSTORM.** Nada aqui deve ser relatado como recurso pronto. O monitor atual detecta apenas amplitude RMS; **ainda não** estima BPM, notas, gênero, intérprete ou nome da música.

### 8.1 Objetivo
Permitir que o JARVIS acompanhe características sonoras com movimentos coerentes de olhos, sobrancelhas, cabeça, expressão e iluminação, sem parecer um boneco que oscila mecanicamente. Distinguir **modo fala**, **modo música** e, se tecnicamente viável, **modo misto**.

### 8.2 Pipeline proposto
```tex
Windows WASAPI (somente PCM temporário, com consentimento e controle)
  → janela de DSP / filtros
  → features: RMS + envelope + espectro + onsets + pulso/BPM + confiança
  → classificador leve: música / fala / misto / desconhecido
  → orquestrador temporal: prioritário durante a conversa > ritmo musical
  → JARVIS Human Motion Engine
  → movimentos faciais, cabeça e efeitos visuais
```

**Notas e altura tonal:** detectar pitch (frequência predominante) é diferente de reconhecer notas em música polifônica. Para disparos confiáveis, começar com pulsação/onset/energia; incluir reconhecimento de notas somente se houver validação separada e métricas de confiança.

**Identificação da faixa:** saber BPM e tonalidade **não revela o título** da música. Reconhecimento de obra exige catálogo e fingerprinting ou outro mecanismo consentido; a implementação local pode primeiro reconhecer apenas características gerais de áudio.

**Comportamentos humanos:** uma batida forte pode induzir um movimento de ênfase leve, mas não a cada beat. Usar amostragem por frase/compasso, anticoincidência, suavização, amortecimento, máximos por minuto e prioridades da fala. Pausas musicais devolvem atenção neutra. Um evento musical não obriga o rosto a sorrir.

### 8.3 Modelo preliminar de JSON (não implementado)
```json
{
  "schema": "jarvis.behavior.music.v0.draft",
  "enabled": false,
  "input": {
    "source": "windows-default-output",
    "features": ["rms", "onset", "beat", "bpm", "spectral_centroid"],
    "storeRawAudio": false
  },
  "confidence": {"minBeat": 0.70, "minClassification": 0.78},
  "modes": {
    "speech": {"priority": 100, "lipSync": true, "musicNod": false},
    "music": {"priority": 30, "lipSync": false, "headNod": true},
    "unknown": {"priority": 10, "lipSync": false, "idle": true}
  },
  "motionPresets": {
    "calm": {"bpmRange": [45, 85], "nodEveryBeats": 4, "amplitude": 0.12},
    "moderate": {"bpmRange": [86, 125], "nodEveryBeats": 4, "amplitude": 0.20},
    "energetic": {"bpmRange": [126, 185], "nodEveryBeats": 2, "amplitude": 0.28}
  },
  "limits": {
    "maximumHeadRotationDegrees": 7,
    "minimumRestIntervalMs": 800,
    "respectReducedMotion": true
  }
}
```

**Atenção:** amplitudes são parâmetros relativos de projeto a calibrar, não correspondem a expressões universais ou diagnósticos afetivos. A definição de dados precisa prever versão, limites, validação, sequência, timestamp, expiração, conflitos de comandos MCP, amortecimento e testes offline.

### 8.4 Etapas sugeridas
1. **V7.1 DSP local:** monitoramento opcional, FFT, envelope, onset, estimação de pulso e medição de latência; sem armazenamento de PCM.
2. **V7.2 Classificação leve:** fala × música × desconhecido, com limiar e fallback que mantenha os lábios em repouso quando o áudio não for voz.
3. **V7.3 JSON e sequenciador:** esquema validado, perfis de gestos, regras de precedência, suavização e teste determinístico com áudio sintético.
4. **V7.4 Expressão adaptativa:** cabeça, olhos, sobrancelhas e efeitos leves sincronizados à pulsação detectada; feedback visual de BPM e confiança.
5. **V7.5 Opcional:** análise tonal e identificação de faixas apenas após pesquisa de licença, privacidade, acurácia e fontes de dados.

## 9. Operação local e comandos verificados

**Dependências:** Windows 10+, Node.js >=20 (observado v22.20.0), navegador com WebGL/Three.js e ambiente Python local específico para sincronismo (quando instalado). Pacotes de desenvolvimento: `three@0.180.0`, `esbuild@0.25.12`; `package.json` declara versão de app `0.1.0` (não confundir com versões artísticas V4–V7).

```powershell
# Diretório de trabalho:
cd "C:\Users\Rafael\Documents\JarvisAvatar"

# Abrir manualmente tudo que for necessário no PC:
.\iniciar-jarvis-manual.ba
# ou iniciar painel e sincronismo:
.\iniciar-jarvis-dual.ba

# Quando necessário, visualizador na rede privada (somente leitura):
.\iniciar-jarvis-rede.ba

# Diagnóstico e sinais de sincronismo:
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\diagnostico-jarvis.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-lipsync.ps1 -Mode status
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\jarvis-voice.ps1 -Mode status

# Recompilar após editar src/client/*.js:
npm run build-v4

# Testar com baixo consumo/concorrência:
node --test --test-concurrency=1 test/*.test.mjs
```

**Endereços:** painel e controle `http://127.0.0.1:3766/`; legado `http://127.0.0.1:3765/` se configurado; LAN `http://<IPv4-privado-dinâmico>:3767/` para visualização. O IPv4 muda; **não** fixá-lo em documento ou script.

**Desktop Commander:** pode iniciar o painel e scripts autorizados, e deve confirmar estados por leitura real; não substituir a autorização do usuário. O comando `npx @wonderwhy-er/desktop-commander@latest remote` inicia a conexão remota do Desktop Commander, **não** o JARVIS. Um arquivo BAT para essa conexão pode ser mantido na Área de Trabalho, sem configuração de autostart.

**Atualização visual:** o browser pode manter o bundle em cache. Depois do build, pressionar **Ctrl+F5** no painel aberto. Uma rota HTTP 200 demonstra que o recurso é servido, mas não garante que o cabelo ou expressões estejam visualmente perfeitos.

## 10. Segurança, privacidade, autoria e não regressão

- **NÃO** publicar o MCP/controle ou o token local na internet ou na rede 3767. O serviço de controle permanece em `127.0.0.1`; LAN 3767 é GET/SSE, somente leitura.
- O cabeçalho `X-Jarvis-UI` usado historicamente em ações manuais **não é autenticação robusta**, especialmente contra programas locais; reforçar antes de ampliar acesso.
- Não ativar webcam, gravar áudio, identificar pessoas ou ler mensagens de outros aplicativos sem pedido explícito.
- Loopback atual descarta PCM e transmite apenas números de intensidade para o localhost; qualquer evolução V7 precisa preservar essa privacidade e obter consentimento claro.
- **Não configurar inicialização automática do Windows** sem solicitação expressa. Não modificar firewall automaticamente.
- Não alterar LexJuridicus, Codex, outros túneis MCP ou o runtime do Desktop Commander.
- Preservar o modo núcleo, todas as expressões, sincronização de áudio, a UI e o botão de maximização em refatorações.
- Não fazer merge na `main` sem autorização. Preservar trabalhos locais não commitados e arquivos preexistentes.
- Reconhecer licenças de terceiros: modelo base MediaPipe (Apache-2.0), Three.js (MIT) e esbuild (MIT); consulte `third_party/ATTRIBUTIONS.md`.
- Assinatura autoral visível no projeto: **Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**

## 11. Índice dos Markdown existentes

### Documentos base e protocolo
- `README.md` — apresentação, status, operação e atalhos.
- `docs/auditoria-fase1-v4.md` — auditoria inicial e riscos.
- `docs/fase2-v4-prototipo.md` — primeiro motor facial anatômico.
- `docs/integracao-mcp.md` — configuração de cliente MCP (parcialmente histórico: sete ferramentas e porta antiga).
- `docs/JARVIS_PERSONALIDADE_MCP.md` — protocolo/persona carregável pelo MCP.
- `docs/JARVIS_PROTOCOLO_FALSO_LIPSYNC.md` — estratégia visual temporizada e seus limites.
- `docs/perfil-jarvis-rafael.md`, `docs/personalidade-jarvis.md`, `docs/protocolo-jarvis-voz.md` — estilo e operação em voz.

### Versões visuais e redes
- `docs/v4.1-refinamento.md` — início da estética humanoide.
- `docs/refinamento-v4.4.md`, `docs/refinamento-v4.5.md`, `docs/refinamento-v4.6.md`, `docs/refinamento-v4.7.md` — refinamentos sucessivos.
- `docs/sincronismo-labial-v4.3.md` — arquitetura WASAPI.
- `docs/expressoes-v4.9.md` — diretor de expressões e controles.
- `docs/acesso-rede-local.md` — acesso LAN somente leitura.
- `docs/refinamento-v5.md` — superfície/olhos/luzes V5.
- `docs/orelhas-pescoco-grid.md` — malhas anatômicas complementares.
- `docs/cabelo-sobrancelhas-grid.md` — sobrancelhas animadas e cabelo inicial.
- `docs/corte-jovem-falso-3d.md` — profundidade translúcida e primeira proposta de corte (histórico).
- `docs/corte-arrepiado-degrade-grid.md` — **referência de corte vigente**: alto, pontudo, degradê, risca curva.
- `docs/expressoes-humanas-v6.md` — 🧪 feature V6 ainda em evolução.
- `docs/JARVIS_PROJETO_MESTRE.md` — **este arquivo**, consolidação canônica.

## 12. Próximos passos recomendados, sem executar

1. Validar no Chrome a **identidade estética PS2 arcade em grid**: face jovem, topete alto, expressão e anatomia; registrar capturas frontal/3⁄4/perfil e correções.
2. Concluir V6 com revisão de código, memória, FPS, acessibilidade e validação visual; **commit específico**, sem misturar outros arquivos.
3. Garantir documentação e testes da direção artística (malha de linhas com profundidade de personagem 3D) sem mexer na arquitetura de áudio.
4. Resolver pendências de qualidade: testes HTTP/API, segurança de comandos manuais, remoção de códigos antigos, profiling da GPU e fallback.
5. Se aprovado, elaborar o design detalhado de V7 música/BPM e validar DSP local; **não** declarar recursos de música implementados antecipadamente.
6. Atualizar este documento ao fechar cada feature com data, branch/commit, testes e captura visual verificada.

## 13. Histórico Git recente (inspecionado)
```tex
160624a  upright spiky hair high fade and shaved side par
16a234c  youthful swept quiff and layered faux-3d hair
3d27107  short swept hair and expressive eyebrows
0ace3f0  anatomical wiregrid ears and neck
15e44a8  responsive fullscreen card
9011ffd  natural 3D facial volume and lighting V5
28952db  MCP-loadable persona and protocol activation
2cb38f3  explicit live-expression demo
```
Há outras branches V4/V5/V6; **não interpretar presença de commit local como publicação na `main` ou deploy público**.

---

**Fim da consolidação — atualização documental, sem mudança deliberada na lógica de execução do projeto.**
**© 2026 Rafael Passos.**

## 14. Continuidade integral — COMO RETOMAR EM OUTRA CONVERSA

### 14.1 Declaração pronta para a próxima conversa (copiar e colar)

> **CONTINUAR O PROJETO JARVIS — LEIA PRIMEIRO ESTE MARKDOWN INTEIRO.**
>
> Estou desenvolvendo o JARVIS, um avatar 3D holográfico azul do ChatGPT, no Windows, com Three.js, WebGL, servidor Node e controle MCP. A base local é `C:\Users\Rafael\Documents\JarvisAvatar`; o repositório é `rafaelmsp/jarvis-desktop-mcp`. O avatar é uma representação visual silenciosa da conversa, não uma IA independente. A voz é do ChatGPT, e o WASAPI capta apenas a amplitude do áudio do Windows para movimentar a boca.
>
> A **referência estética principal** é um personagem humanoide de jogo de luta 3D da geração PS2/arcade, mas reconstruído exclusivamente como **malha 3D de linhas e triângulos azul-ciano**, sem fotografia humana nem imagem colocada sobre o rosto. O cabelo deve ficar **ALTO, ARREPIADO PARA CIMA, com mechas irregulares, degradê rente nas laterais e risca curva acima da orelha direita**; nunca substituir por cabelo baixinho. As orelhas, pescoço, olhos, sobrancelhas e musculatura virtual precisam ser anatomicamente plausíveis.
>
> **Versão em andamento:** branch local `feature/jarvis-v6-human-expressions`; base Git `160624a`. **Há alterações V6 NÃO COMMITADAS** em HTML, JS, renderizador, rig, câmera, documentação e testes. **Não executar checkout forçado, reset, clean, stash, pull ou merge, nem sobrescrever arquivos existentes**, antes de inspecionar e preservar esse trabalho. A `main` deve ficar intacta.
>
> O projeto inclui botão Maximizar, modo realismo/wireframe, cabelo com falso 3D e 39 feixes arrepiados, sobrancelhas dinâmicas, orelhas e pescoço 3D, sessão visual, detector RMS WASAPI, expressões por MCP e microexpressões V6 em desenvolvimento. **78/78 testes passaram** com `node --test --test-concurrency=1 test/*.test.mjs` no snapshot desta documentação; os testes não validam a qualidade visual na tela.
>
> **V7 de música/BPM é SOMENTE BRAINSTORM**: ainda não existe classificador fala/música, estimador de BPM, FFT musical, rastreador de notas, identificação de música ou sequenciador JSON integrado. Se eu solicitar V7, primeiro desenhar arquitetura e plano de testes, distinguindo BPM/onsets/tonalidade de identificação de obra.
>
> Conecte o Desktop Commander ao PC autorizado se estiver disponível, leia `docs/JARVIS_PROJETO_MESTRE.md`, `docs/expressoes-humanas-v6.md` e `docs/corte-arrepiado-degrade-grid.md`, confira `git status -sb`, procure os arquivos alterados e execute testes sem concorrência exagerada. Meu computador apresentou estouro de memória anteriormente; priorize consumo baixo. Verifique funcionamento real antes de afirmar que está concluído. **Não modificar segurança, firewall, MCP de outros projetos nem configurar autostart** sem autorização explícita.
>
> Quero continuar os refinamentos do JARVIS com resultados práticos, progresso objetivo e fidelidade à estética descrita. Faça primeiro um diagnóstico breve do que está pronto, do que ainda não foi validado e proponha a próxima alteração específica.

### 14.2 Fotografia técnica do ponto de retomada (snapshot)

Data do snapshot: **27 de outubro de 2026**. A condição do PC, branch, código e conectividade poderá mudar; **consultar novamente na abertura do novo chat**.

| Item | Condição confirmada |
| --- | --- |
| Diretório | `C:\Users\Rafael\Documents\JarvisAvatar` |
| Branch de trabalho | `feature/jarvis-v6-human-expressions` |
| HEAD no momento | `160624a` — topete alto, degradê e risca lateral |
| Teste sequencial | **78 testes executados, 78 aprovados, 0 falhas** |
| Ambiente | Windows, Node v22.20.0, Three.js v0.180.0 |
| Endpoint local | `http://127.0.0.1:3766/` — `voiceSession=true`, `audioSync=true` na inspeção |
| Visualização LAN | porta 3767, GET/SSE sem POST; usar IP privado atual, nunca presumir o antigo |
| Desenho do rosto | MediaPipe 468 pontos / 898 triângulos, com camadas extras 3D |
| Corte | Topete arrepiado para cima, degradê lateral e uma risca curva à direita |
| V6 expressões | Código em arquivos modificados e novos sem commit; **não considerar release final** |
| V7 música | Apenas conceito/planejamento; nenhuma funcionalidade musical concluída |
| Documento canônico | `docs/JARVIS_PROJETO_MESTRE.md` (este arquivo) |

**Alterações locais que não devem ser perdidas:** `README.md`, `docs/corte-arrepiado-degrade-grid.md`, `public/app.js`, `public/index.html`, `public/face-v4.bundle.js`, `src/client/face-v4-finishing.js`, `src/client/face-v4-rig.js`, `src/client/face-v4.js`, `src/client/natural-head-motion.js`; novos `src/client/human-expression.js`, `test/human-expressions.test.mjs`, `docs/expressoes-humanas-v6.md`. O arquivo avulso pré-existente `scripts/liberar-firewall-rede.ps1` deve permanecer intocado. **O Markdown mestre também estava ainda não rastreado na coleta.**

### 14.3 Diagnóstico inicial seguro do próximo cha

```powershell
# SOMENTE LEITURA / DIAGNÓSTICO:
cd "C:\Users\Rafael\Documents\JarvisAvatar"
git status -sb
git log -8 --oneline
git diff --sta
Get-ChildItem .\docs\*.md | Select-Object Name
Invoke-RestMethod "http://127.0.0.1:3766/api/state" -TimeoutSec 3

# Rodar testes com memória limitada (somente quando necessário):
node --test --test-concurrency=1 test/*.test.mjs

# SOMENTE se for necessário recompilar alterações na malha:
npm run build-v4
# Atualizar a página do navegador com Ctrl+F5.
```

**Não mexer nas alterações locais somente para organizar o repositório.** Antes de mudar de branch ou fazer commit, conferir `git diff`, arquivos novos e quais processos/agentes ainda podem estar atuando. Em caso de trabalho simultâneo, combinar exclusividade de arquivos por etapa e nunca editar o mesmo arquivo concorrentemente.

### 14.4 Ordem de prioridade visual aprovada para discussão

1. **Validar o rosto humanoide jovem em grid 3D:** proporções e tridimensionalidade observadas em frente, três quartos e perfil; não substituir por render fotográfico.
2. **Cabelo:** comparar com a última foto — topete alto com pontas VERTICAIS (não corte baixo), degradê e risca curva, sem cobrir as orelhas; conferir câmera para não cortar a parte superior.
3. **Expressões V6:** consolidar e verificar sobrancelhas, sorriso assimétrico, pálpebras, bochechas, respiração visual e transições, sem afirmar emoções reais.
4. **Testar memória/FPS, operação em tela cheia e sincronismo labial** em uso prolongado, com aprovação visual do usuário.
5. **Somente após isso**, se autorizado, evoluir o brainstorming V7 (fala/música, BPM, onsets, JSON de gestos e desenho de ações por compasso).

### 14.5 Como distinguir entrega real de simulação

- **Código salvo** não significa que passou em todos os testes.
- **Testes automatizados aprovados** não provam que a aparência na tela ficou igual à referência.
- **HTTP 200 e bundle servido** não provam que o WebGL desenhou o cabelo corretamente: é necessária captura visual ou confirmação explícita do usuário.
- **Conexão MCP disponível** não garante comandos disparados pelo modelo em cada resposta de voz.
- **Áudio RMS** não é reconhecimento de notas, BPM, gênero ou título de música.
- **Commit local** não significa publicação na internet. Push na branch, abertura de PR, merge e hospedagem pública são operações distintas.

### 14.6 Pontos de entrada e responsabilidade

- **Holograma/rosto:** `src/client/face-v4.js`, `face-v4-finishing.js`, `facial-surface.js`.
- **Cabelo alto:** `hair-youth-profile.js` e `upright-hair-fade.js`; complementos em `hair-brows-grid.js` e `hair-faux-depth.js`.
- **Expressões humanas:** `human-expression.js`, `face-v4-rig.js`, `natural-head-motion.js`.
- **Integração visual:** `public/index.html`, `public/app.js`, `public/style.css`.
- **Gerador do pacote:** `scripts/build-v4.mjs` → `public/face-v4.bundle.js` (arquivo gerado; **não editar manualmente**).
- **Áudio:** `scripts/jarvis-lipsync.py`, `scripts/start-lipsync.ps1`, `scripts/jarvis-voice.ps1`.
- **Servidor, estado e MCP:** `src/server.mjs`, `src/state.mjs`, `src/mcp-server.mjs`.
- **Testes atuais:** `test/*.test.mjs`, especialmente `test/human-expressions.test.mjs`, `test/upright-spiky-hair.test.mjs`, `test/hair-brows-grid.test.mjs` e `test/fullscreen-card.test.mjs`.

### 14.7 Condição de encerramento desta conversa

Este documento registra o **estado de continuidade**, não uma nova entrega gráfica. Nenhum merge na `main`, exposição pública do controle, alteração do firewall, inicialização automática do Windows ou implementação musical V7 foi autorizada pela elaboração deste Markdown. Mantenha o trabalho de expressões humanas pendente até revisão específica.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
