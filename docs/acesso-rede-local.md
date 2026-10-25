# JARVIS V4.7 — Visualizador na rede local

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**

O JARVIS tem dois endereços e funções diferentes:

- **Interface principal e MCP:** `http://127.0.0.1:3766/` — somente no PC.
- **Visualizador da rede local:** `http://<IP-PRIVADO-ATUAL>:3767/` — celular, tablet e outros aparelhos da mesma rede.

A interface da porta **3767 é somente leitura**: aceita GET para HTML, JS, CSS, JSON filtrado e SSE; rejeita qualquer POST com HTTP 405. Não envia token MCP, não permite comandos ou instalação de microfone remoto. Não substitui a conexão do ChatGPT com o Desktop Commander.

## Como iniciar

Primeiro execute `iniciar-jarvis-dual.bat`. Em seguida execute `iniciar-jarvis-rede.bat`.

Desde a V4.7, o inicializador usa `scripts/start-lan-viewer.ps1` e detecta automaticamente o endereço IPv4 privado na interface com gateway em rede **Privada** ou de **Domínio**. Ele reutiliza um visualizador já ativo ou cria um processo Node e anuncia a URL correta.

**Exemplo confirmado em 25/10/2026:** o PC passou do antigo `192.168.0.132` para **`192.168.1.65`**; a nova URL de exemplo é `http://192.168.1.65:3767/`. Não grave esse IP como valor permanente: ele pode mudar.

## Firewall e rede

O script **não modifica a firewall**. Se a rede do Windows estiver classificada como Pública, o visualizador não deverá ser iniciado até o próprio usuário verificar e corrigir a classificação, quando apropriado. Para acesso LAN, uma regra de firewall restrita a TCP 3767 e ao perfil Privado pode ser necessária, de acordo com a sub-rede atual e as políticas do PC. Se houver regra antiga para `192.168.0.0/24`, ela não abrange a nova sub-rede `192.168.1.0/24`.

Evite encaminhar portas no roteador, não exponha o servidor diretamente à internet e não disponibilize a porta 3766 em outros endereços. A ferramenta apenas inicia um visualizador GET isolado no endereço IP privado escolhido.

## Se não abrir no celular

Confira se PC e celular estão na mesma rede, se o endereço anunciado no Windows está correto e se o roteador não isola os clientes Wi-Fi. No Windows, confirme `http://127.0.0.1:3766/` e o endereço LAN anunciado. Uma resposta `EADDRNOTAVAIL` indica tentativa de vincular-se a um endereço que já não pertence ao computador.

Logs do visualizador LAN, quando ele é iniciado pelo script PowerShell: `%LOCALAPPDATA%\JarvisLANViewer\stdout.log` e `stderr.log`.
