# JARVIS — cabelo curto e sobrancelhas expressivas no Grid 3D

## Objetivo
Reproduzir o estilo da imagem de referência **dentro do modelo Three.js**: cabelo masculino curto, com leve topete e mechas penteadas para trás; sobrancelhas anatômicas acima dos olhos. Toda a construção permanece **holográfica azul**, sem fotografia, imagem estática ou texturas de cabelo.

## Implementação
- Arquivo principal: `src/client/hair-brows-grid.js`.
- **Cabelo:** superfície frontal e superior de 23 colunas × 13 faixas, ancorada em pontos da testa do modelo canônico; 29 mechas de fluxo para trás, 6 faixas transversais e 12 fios de transição nas têmporas. Pequenas irregularidades controladas criam volume sem cabelo longo, volumetria de capacete ou aparência de peruca.
- **Sobrancelhas:** duas fitas curvadas, com 125 pontos por lado, bordas afinadas e pequenos triângulos e fios cruzados. A geometria acompanha os landmarks deformados pelo rig facial nas expressões `neutral`, `thinking`, `happy`, `alert`, `surprised`, `listening` e `speaking`.
- **Preservação:** grid do rosto, orelhas, pescoço, lipsync WASAPI, protocolo MCP e botão `Maximizar` continuam funcionais.
- **Desempenho:** sem partículas de cabelo simuladas, texturas externas, fontes de áudio adicionais, GPU readbacks ou tesselação por quadro. Buffers dinâmicos são reutilizados, e todos os recursos são liberados no `dispose()`.
- **Comparação:** o modo `Realismo anatômico` muda a opacidade das superfícies; o wireframe do cabelo e sobrancelhas continua acessível no modo clássico.

## Uso e validação
Execute `npm run build-v4` para atualizar o pacote WebGL e `npm test` para validar a implementação. Acesse **http://127.0.0.1:3766/** e pressione **Ctrl+F5** para recarregar o avatar. Avalie o cabelo em vista frontal e oblíqua; a estética final depende de conferência visual no navegador.

## Limites
O modelo é um avatar holográfico, **não** uma reprodução fotográfica, nem uma tentativa de reconhecimento de uma pessoa da imagem. A aparência final está sujeita à escala, GPU e ângulo de visualização. Não há alteração das condições de segurança ou inicialização manual.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
