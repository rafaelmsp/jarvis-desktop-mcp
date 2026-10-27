# JARVIS — Corte jovem e efeito falso 3D do cabelo

## Objetivo visual
Ajuste no **avatar holográfico 3D real**: topete curto e texturizado, penteado para trás com leve fluxo diagonal, assimétrico, laterais mais baixas e têmporas em degradê. A estética permanece **wireframe azul ciano**, sem fotografias nem texturas de cabelo.

## Duas camadas de implementação
**Geometria do penteado** (`src/client/hair-youth-profile.js`): amostrador puro e rápido, ancorado à testa MediaPipe, que levanta o centro do topete, suaviza as laterais e introduz leve assimetria. A malha base do rosto e o sistema de sobrancelhas não foram modificados.

**Falso 3D** (`src/client/hair-faux-depth.js`): 3 planos translúcidos com pequenos deslocamentos de profundidade, sombras na raiz e 12 pares de linhas iluminadas/sombreadas. Esse recurso aumenta a ilusão de volume sem objetos pesados, imagens, shaders especiais nem APIs externas.

## Integração
`src/client/hair-brows-grid.js` usa o amostrador no cabelo inteiro: superfície, 37 mechas, faixas transversais e 9 pontas texturizadas na franja. O efeito falso 3D é ativado junto com o modelo e reduz sua opacidade no modo Wireframe clássico. Os buffers são criados uma só vez, reaproveitados e liberados no descarte.

## Preservado
Orelhas e pescoço anatômicos, sobrancelhas dinâmicas, expressão facial, lip-sync via áudio Windows, comandos MCP, modo de tela cheia e operação local manual. O efeito não intercepta microfone, câmera ou outros programas.

## Como avaliar
Acesse `http://127.0.0.1:3766/`, atualize com **Ctrl+F5** e use **Maximizar** para comparar a silhueta frontal, levemente de lado e o volume do topo. O código e seus testes validam estrutura e animação, mas a satisfação com o estilo depende da avaliação na tela do PC.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
