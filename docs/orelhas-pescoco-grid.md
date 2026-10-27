# JARVIS — anatomia aprimorada de orelhas e pescoço no Grid 3D

**Esta implementação altera o modelo 3D do aplicativo**, não produz uma fotografia nem transforma o avatar em pessoa real. A estética permanece holográfica azul, com linhas anatômicas e relevo discreto.

## Orelhas
- Cada orelha tem estrutura 3D própria com 240 vértices e 384 triângulos, gerados apenas uma vez.
- Cinco anéis de cartilagem formam relevo curvo com linhas transversais que dão profundidade à malha.
- Hélice (borda externa), anti-hélice, ramificações superiores, concha, trago, antítrago e lóbulo com nomes identificáveis no código.
- Conexão do pavilhão auricular à têmpora e transição do lóbulo à mandíbula.
- Simetria esquerda/direita, com posição e profundidade consistentes em 3D.

## Pescoço
- Substituição dos anéis rígidos da versão anterior por uma superfície cervical anterior de oito seções de larguras e profundidades progressivas.
- Grade longitudinal e transversal sobre o volume do pescoço, com contornos dos músculos esternocleidomastóideos, trapézios e tendões laterais.
- Clavículas, transição até os ombros e marcas discretas da laringe.
- Movimento cervical mínimo e limitado, sem peso de simulação física por quadro.

## Preservação
- O rosto MediaPipe de 468 pontos continua intocado e com todas as expressões, piscadas e lip-sync anteriores.
- A camada anatômica não tem fotos, texturas de pele, captura de imagem nem chamadas externas.
- Uso do mesmo motor Three.js, com recursos criados uma vez e descartados em `dispose()`.
- O comando **Realismo anatômico** ainda alterna o tratamento superficial e o grid clássico.
- A ampliação do card do rosto continua independente.

## Validação
`npm run build-v4` e `npm test` — 62 testes aprovados. Testes dedicados cobrem simetria, tridimensionalidade, malha cervical, detalhes nomeados, descarte de GPU e preservação dos estados faciais.

**Autoria:** Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.
