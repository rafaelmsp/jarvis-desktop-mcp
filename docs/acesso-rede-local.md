# JARVIS V4.3 — Visualizador na rede local

Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.

- **Painel principal e MCP:** http://127.0.0.1:3766 (somente PC).
- **Visualizador da rede local:** http://192.168.0.132:3767 (celular, tablet ou outro PC na mesma rede 192.168.0.0/24).
- **Iniciar:** primeiro iniciar-jarvis-dual.bat, depois iniciar-jarvis-rede.bat.
- Porta 3767 aceita **GET** de páginas estáticas, estado visual filtrado e SSE; todo POST é recusado (HTTP 405). Nenhum token de MCP é compartilhado.
- O rosto 3D se move no navegador remoto conforme os eventos do servidor original. O som continua no ChatGPT.
- O acesso na LAN não substitui a integração ChatGPT/Plugin/Desktop Commander.

## Firewall
Windows pode bloquear a porta 3767. Caso o celular não abra a URL, permita TCP **3767**, apenas no perfil **Privado**, restrito à sub-rede **192.168.0.0/24** (sem expor portas no roteador; nunca permitir perfil Público). A regra deve ser criada nas configurações do Firewall pelo usuário/administrador; não foi configurada automaticamente.

Se o IP local do computador mudar, edite JARVIS_LAN_HOST no arquivo iniciar-jarvis-rede.bat, atualize a regra de Firewall e reinicie o visualizador.
