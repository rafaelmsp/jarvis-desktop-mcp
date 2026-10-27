# JARVIS — Corte arrepiado alto com degradê (grid holográfico)

## Referência da foto
O objetivo não é uma fotografia sobreposta: **é uma cabeça 3D de linhas azuis** que reproduz a silhueta do corte apresentado. Topo **alto e arrepiado para cima**, mechas grossas com alturas distintas e leve direcionamento para trás, **degradê rente às laterais** e **risca curva raspada acima da orelha direita**.

## Motor da geometria
- `hair-youth-profile.js`: levanta o volume do topo aproximadamente 4 unidades relativas à linha frontal original; mantém laterais menores e mechas com irregularidades determinísticas, sem repetir um penteado curto arredondado.
- `upright-hair-fade.js`: acrescenta 39 feixes ascendentes com pontas texturizadas; 12 faixas de degradê por lado, com microtraços mais curtos junto à orelha; risca lateral em curva tridimensional somente à direita.
- `hair-brows-grid.js`: combina o penteado com as sobrancelhas que acompanham as expressões.
- `hair-faux-depth.js`: preserva as camadas transparentes de profundidade já existentes.
- `face-v4.js`: enquadramento expandido a **37 graus** para caber o topete sem cortar a base do pescoço.

## Compatibilidade
Nenhuma alteração de acesso remoto, API ou captura de áudio. O cabelo é desenhado uma vez na inicialização e não acrescenta processamento constante de câmera ou rastreio corporal. Preservadas as mudanças **em andamento** do motor de expressões humanas V6, o sincronismo labial, o modo de tela cheia e o controle MCP.

## Conferência
Atualize `http://127.0.0.1:3766/` com **Ctrl+F5**. Compare principalmente a altura dos fios, a transição para o degradê e a risca curva na lateral direita. Testes verificam geometria, reflexos, integração com expressões, enquadramento e descarte da GPU. O refinamento artístico definitivo depende da avaliação visual no navegador.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
