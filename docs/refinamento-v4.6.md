# JARVIS V4.6 — Expressividade natural e manutenção do rosto em grid

**Autor:** Rafael Passos — Engenharia de Software, IA e Segurança da Informação

**Desenvolvimento:** 25/10/2026

**Branch:** `feature/jarvis-v4.6-natural-face`
**Base preservada:** `feature/jarvis-v4.5-face-polish`

## Alterações realizadas

- **Fechamento natural da boca:** a separação original entre os marcos MediaPipe 13 e 14 deixava a boca visualmente entreaberta mesmo quando o avatar estava em silêncio. Agora um peso de repouso aproxima os lábios internos suavemente e é retirado progressivamente durante a fala.
- **Sincronismo labial por intensidade:** a resposta de amplitude do Windows e a prioridade do turno MCP do celular continuam intactas. Não há análise de fonemas, captura nova de áudio ou armazenamento de voz.
- **Contornos labiais expressivos:** linhas externas continuam definidas e o contorno interno fica discreto no silêncio; durante a fala, a intensidade do brilho cresce com a abertura para evitar a aparência de um oval permanentemente aberto.
- **Renderização no celular:** limite adaptativo de `devicePixelRatio` (1,4 em telas até 640 px; 1,75 nas demais), sem alterar os 468 vértices do rosto.
- **Robustez WebGL:** tratamento de `webglcontextlost` e recarregamento após `webglcontextrestored`. A barra indica interrupção quando o contexto gráfico falhar.
- **Memória gráfica:** os arcos de pescoço são registrados e suas geometrias/materiais são liberados na desmontagem; antes essas instâncias não eram incluídas no descarte.
- **Interface:** identificação `SYNTH-FACE · V4.6`, mantendo a barra de carregamento com número percentual e o copyright de Rafael Passos.

## Diagnóstico e validação

- Compilação `npm run build-v4` concluída.
- `npm test`: **27/27 testes aprovados**, com cinco testes V4.6 adicionais para boca em repouso, abertura por intensidade, brilho do contorno, robustez do WebGL e preservação da malha.
- Tela do PC recarregada e inspecionada visualmente com a V4.6 em estado **Ouvindo**, carregamento **100%**.
- Visualizador local em `http://127.0.0.1:3766/`.
- Visualizador da rede local em `http://192.168.0.132:3767/`: respondeu com **HTTP 200** e conteúdo V4.6. A renderização física em um aparelho móvel ainda depende de conferência visual do usuário.
- O serviço MCP, o áudio local, o comportamento da rede e as configurações de firewall não foram modificados.

## Limitações conhecidas

O lip-sync é **baseado em amplitude** e nos comandos de turno MCP; ele não reproduz os fonemas reais de cada palavra. O áudio do Windows pode incluir outras aplicações no mesmo dispositivo. Uma imagem parada ou teste automatizado não substitui avaliação estética dinâmica no celular.

## Procedimento seguro de manutenção

```powershell
cd C:\Users\Rafael\Documents\JarvisAvatar
npm run build-v4
npm test
```

Atualizar a tela do PC e do celular para recarregar o arquivo `face-v4.bundle.js`. Como os servidores entregam os ativos diretamente de `public/`, não é preciso abrir a porta nem reiniciar os serviços para alterações gráficas. Em caso de regressão, conferir a V4.5 na branch `feature/jarvis-v4.5-face-polish`. O repositório da nova versão fica numa branch independente; não mesclar na principal sem aprovação.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
