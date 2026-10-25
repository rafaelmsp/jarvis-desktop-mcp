# JARVIS V4.7 — Dinâmica da expressão e servidor LAN resiliente

**Desenvolvedor e titular dos direitos autorais:** Rafael Passos — Engenharia de Software, IA e Segurança da Informação

**Branch:** `feature/jarvis-v4.7-expression-dynamics`
**Base preservada:** `feature/jarvis-v4.6-natural-face`
**Data:** 25/10/2026

## Refinamento facial

- **Olhar com pausas:** módulo `src/client/face-v4-dynamics.js` define alvos discretos de olhar, mantendo a atenção por segundos e suavizando mudanças em aproximadamente 340 ms. Movimentos dentro da órbita ocular, limitados em amplitude.
- **Piscadas menos periódicas:** sequência determinística de piscadas com intervalos variados, incluindo uma breve piscada dupla. Não usa aleatoriedade nem bibliotecas adicionais.
- **Sobrancelhas e bochechas:** microdeformações suaves proporcionais à intensidade de fala e amortecimento ao regressar ao estado Ouvindo.
- **Movimentos de cabeça discretos:** orientação acompanha ligeiramente o olhar e a intensidade, mantendo o estilo holográfico da V4.6.
- **Acessibilidade:** `prefers-reduced-motion` desativa piscadas e movimentos involuntários da íris.
- **Malha original intacta:** 468 pontos e 898 triângulos MediaPipe; as deformações não alteram os landmarks originais.
- **Barra de progresso:** mantida, com percentual numérico visível até 100%.
- **Limite de áudio:** a boca continua movida por intensidade de saída Windows ou comando MCP, não por fonemas. Os movimentos dos olhos não interpretam emoções reais.

## Rede local: resolução da falha da porta 3767

Na manutenção, o endereço Ethernet do PC mudou de `192.168.0.132` para `192.168.1.65`. O visualizador tentava vincular-se a um endereço removido, gerando `EADDRNOTAVAIL`, sem aceitar ligações. O arquivo `iniciar-jarvis-rede.bat` passou a chamar `scripts/start-lan-viewer.ps1`, que:

1. Localiza automaticamente o IPv4 privado com gateway na rede Windows classificada como **Privada** ou de **Domínio**.
2. Confere a integridade do servidor principal em `127.0.0.1:3766`.
3. Reutiliza o visualizador já aberto no IP correto ou inicia o Node na porta 3767.
4. Verifica a resposta HTTP 200 e apresenta o endereço atualizado; guarda logs locais em `%LOCALAPPDATA%\JarvisLANViewer`.
5. **Não altera firewall, não abre portas externas e não disponibiliza comandos MCP na rede**. O `src/lan-viewer.mjs` permanece somente leitura e limitado a IP privado.

### Iniciar

```bat
iniciar-jarvis-dual.bat
iniciar-jarvis-rede.bat
```

**No PC:** `http://127.0.0.1:3766/`.

**No celular, na mesma rede:** use o endereço anunciado pelo inicializador. Durante esta verificação: `http://192.168.1.65:3767/`. Esse endereço pode mudar após reconexão ou reinício do roteador.

O servidor principal foi reiniciado e a **sessão visual reativada**; a sincronização WASAPI voltou a mostrar `Ouvindo` e `audioSync: true`. A exposição é somente local e LAN, **não um serviço público na internet**.

## Recuperação de integridade

A interrupção anterior do Desktop Commander havia deixado `public/index.html` contendo bytes nulos (NUL). O HTML foi recuperado a partir da cópia íntegra do último commit da V4.6 e recebeu novamente a identificação V4.7. Nenhum arquivo do sistema de controle MCP precisou ser recuperado.

## Segurança e compatibilidade

A inteligência continua no ChatGPT; o avatar é apenas a interface. O cliente remoto vê o estado e o wireframe através de HTTP GET e SSE filtrado. Chamadas HTTP POST na porta 3767 são recusadas com HTTP 405. Os tokens de controle ficam somente no PC.

Não foram alterados outros projetos, automações, arquivos originais de firewall nem as branches V4.4–V4.6. Manter `main` intocada até a aprovação visual.

## Validação

```powershell
npm run build-v4
npm test
```

A bateria final passou com **34 de 34 testes**: regressões das versões anteriores, seis testes de expressividade V4.7 e uma validação adicional do inicializador de IP dinâmico. O visualizador LAN retornou **HTTP 200** e recusou POST com **HTTP 405**. O estado remoto confirmou sessão visual e sincronismo ativos, em modo Ouvindo. A captura do Chrome mostrou o rosto 3D V4.7 renderizado na página LAN. A animação de olhos e boca em tempo real ainda pode ser avaliada pelo usuário em uma conversa prolongada.

## Recuperação

Para voltar à versão V4.6, consulte a branch `feature/jarvis-v4.6-natural-face`. Não recrie nem distribua tokens locais ao transferir código. O sincronizador de áudio deverá ser reativado após reiniciar o servidor por segurança e por reinicialização do estado.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
