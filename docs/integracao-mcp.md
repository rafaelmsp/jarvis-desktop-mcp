# Conectar JARVIS ao ChatGPT Desktop (Windows 10)

## 1. Faça o teste de voz antes

Atualize com `git pull` no diretório clonado e reinicie `npm start`. No Chrome/Edge, abra http://127.0.0.1:3765, clique **Ativar voz local** e depois **Testar resposta**. A fala é gerada localmente pela API SpeechSynthesis do navegador (usa as vozes instaladas no Windows/navegador), sem API de IA.

O microfone é independente: ele controla o brilho e **não transcreve o que você fala**. O avatar também **não tem acesso automático ao áudio da voz do ChatGPT**.

## 2. Conecte o MCP local no ChatGPT Desktop, se essa opção estiver disponível

Deixe o painel web rodando com `npm start`. Em outra janela:

1. No aplicativo ChatGPT para Windows, abra **Configurações → Servidores MCP → Adicionar servidor**.
2. Nome: `jarvis-avatar`. Transporte: **STDIO**.
3. Comando: `node`.
4. Argumento (caminho absoluto, adaptado à sua pasta):

   ```text
   C:\\Users\\SEU_USUARIO\\jarvis-desktop-mcp\\src\\mcp-server.mjs
   ```

5. Salve e use **Reiniciar** quando solicitado.
6. Na caixa de conversa, digite `/mcp` para verificar se aparecem as sete ferramentas.
7. Na conversa, solicite: **"Use jarvis-avatar para mudar a expressão para happy e a legenda para Olá!"**.

A configuração do host local é compartilhada pelos clientes Codex compatíveis, mas **um chat na nuvem ou no navegador não usa automaticamente as ferramentas locais**. Quando a opção de servidor STDIO não aparece no seu aplicativo, consulte o próximo método.

## 3. Alternativa: Codex CLI

No terminal, se o comando `codex` estiver instalado, execute dentro da pasta do projeto:

```powershell
codex mcp add jarvis-avatar -- node "$((Get-Location).Path)\\src\\mcp-server.mjs"
codex mcp list
```

Ou edite `~/.codex/config.toml` sem substituir as entradas MCP existentes:

```toml
[mcp_servers.jarvis-avatar]
command = "node"
args = ["C:\\\\CAMINHO\\\\jarvis-desktop-mcp\\\\src\\\\mcp-server.mjs"]
```

Sempre substitua o caminho ilustrativo pelo caminho real; no TOML, barras invertidas exigem escape em strings de aspas duplas.

## 4. Alternativa para ChatGPT web/Plugins: Secure MCP Tunnel

ChatGPT web/Plugins não inicia diretamente servidores STDIO locais. Para esse contexto, é necessário um **Secure MCP Tunnel** configurado no OpenAI Platform, usando um **tunnel_id** próprio para o Jarvis, um runtime API key e o `tunnel-client` instalado no computador. Configure o `tunnel-client` para executar `node <caminho>\\src\\mcp-server.mjs` por STDIO e conecte o túnel no menu Plugins → Adicionar servidor MCP personalizado → Tunnel. Não reaproveite ou altere o túnel dos seus outros projetos sem avaliar o isolamento. A existência de um runtime key não deve ser confundida com autorização para cobrança de inferência; verifique condições da conta antes de habilitar serviços de plataforma.

Documentação oficial:
- https://learn.chatgpt.com/docs/extend/mcp
- https://help.openai.com/pt-br/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- https://developers.openai.com/api/docs/guides/secure-mcp-tunnels

## Sete ferramentas

| Nome | Função |
|---|---|
| `jarvis_set_mode` | alterna entre `core` e `face` |
| `jarvis_set_expression` | expressão: `neutral`, `happy`, `thinking`, `alert`, `surprised`, `listening`, `speaking` |
| `jarvis_set_status` | estado do avatar |
| `jarvis_set_speaking` | anima a fala (sem áudio real do ChatGPT) |
| `jarvis_set_caption` | altera a legenda; **com Voz local ativa, o navegador lê essa legenda** |
| `jarvis_get_state` | consulta o estado atual |
| `jarvis_reset` | restaura o estado inicial |

**Exemplo:** depois de ativar a voz local, chamar `jarvis_set_caption` com `{"value":"Bom dia, estou online!"}` faz o painel mostrar e falar essa frase. O ChatGPT decide quando chamar a ferramenta; isso não ocorre automaticamente a cada palavra da conversa.

## Segurança e isolamento

- O painel escuta só em `127.0.0.1`, sem publicar portas na rede.
- O servidor MCP envia comandos somente ao painel e requer um token de sessão local.
- A conexão não dá ao Jarvis permissão de alterar arquivos, executar comandos do Windows ou ler outros sistemas.
- Não publique chaves, senhas, tokens ou conteúdo jurídico sigiloso em legendas.
- LexJuridicus, Codex e Desktop Commander continuam intactos.

## Se não aparecer o MCP

Confirme Node.js 20+, painel rodando, caminho absoluto correto, disponibilidade de STDIO no seu cliente e que você reiniciou o aplicativo após salvar.
