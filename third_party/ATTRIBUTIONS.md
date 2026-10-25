# Licenças e atribuições de terceiros — JARVIS V4

## Geometria facial canônica (MediaPipe)

- Projeto: Google MediaPipe
- Fonte original: https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj
- Licença: Apache License 2.0
- Cópia da licença: `third_party/mediapipe-APACHE-2.0.txt`
- Arquivo original incluído: `assets/models/mediapipe-canonical-face.obj`
- Derivado gerado: `public/assets/models/canonical-face.json`.
- Modificação declarada: vértices arredondados a quatro casas decimais e faces convertidas para triângulos indexados em JSON. A topologia original foi preservada. O projeto acrescenta separadamente o crânio posterior, orelhas e pescoço, e deformações de expressão de caráter experimental.

O MediaPipe fornece a superfície facial de referência, não um modelo completo de cabeça riggada com olhos, cabelo e pele. O Jarvis usa as coordenadas no WebGL para uma interface de linhas futurista.

## Three.js

- Projeto: https://threejs.org/
- Repositório: https://github.com/mrdoob/three.js
- Licença MIT
- Cópia da licença: `third_party/three-MIT.txt`
- A dependência fixada é incorporada ao bundle `public/face-v4.bundle.js` pelo esbuild para execução local.

## Esbuild

- Utilizado em tempo de desenvolvimento para agrupar o JavaScript, não carregado pelo navegador.
- Projeto: https://esbuild.github.io/
- Licença MIT: https://github.com/evanw/esbuild/blob/master/LICENSE.md

Todas as bibliotecas e malhas desta etapa são de código aberto. Não é necessária API paga para a animação.
