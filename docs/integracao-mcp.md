# Conectar o Jarvis ao ChatGPT ou a outro cliente MCP

1. Execute `iniciar-jarvis.bat` ou `npm start` no Windows 10. Deixe o processo aberto.
2. No cliente MCP que suporta **servidores locais stdio**, configure:

```json
{
  "mcpServers": {
    "jarvis-avatar": {
      "command": "node",
      "args": ["C:\\CAMINHO\\jarvis-desktop-mcp\\src\\mcp-server.mjs"]
    }
  }
}
```

Substitua `C:\\CAMINHO` pelo caminho de extração. A disponibilidade de integração local no ChatGPT depende do cliente/plano e de como o host expõe MCP; a simples configuração do arquivo **não conecta automaticamente** o servidor a esta conversa.

## Ferramentas expostas

- `jarvis_set_mode`: `core` | `face`
- `jarvis_set_expression`: `neutral` | `happy` | `thinking` | `alert` | `surprised` | `listening` | `speaking`
- `jarvis_set_status`: `idle` | `listening` | `processing` | `speaking` | `success` | `error`
- `jarvis_set_speaking`: booleano
- `jarvis_set_caption`: texto curto sem dados sigilosos
- `jarvis_get_state`: consulta de estado
- `jarvis_reset`: reinicia o estado

## Limitações e segurança

- As expressões só mudam quando uma ferramenta MCP é **de fato chamada**; o Jarvis não lê automaticamente pensamentos, conversa ou áudio do ChatGPT.
- O painel usa apenas `127.0.0.1`; o controle MCP requer token temporário local renovado a cada inicialização.
- O microfone opcional anima o avatar com a sua voz, mediante permissão do navegador; não escuta o áudio de saída do ChatGPT.
- Nenhuma chave OpenAI/OpenRouter, modelo de IA ou cobrança adicional é necessária.
- Não existe integração automática com LexJuridicus, Codex ou Desktop Commander nesta versão. O projeto é isolado e não modifica sistemas existentes.
