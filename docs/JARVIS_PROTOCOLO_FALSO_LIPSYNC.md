# JARVIS V4.3 — Protocolo de fala visual simulada (PC + celular)

**Data:** 25/10/2026  
**Projeto:** JarvisAvatar / JARVIS V4.3 — porta local 3766  
**Finalidade:** guardar comandos reutilizáveis para animar o avatar silenciosamente durante as respostas do ChatGPT.  
**Autor do projeto:** Rafael Passos.

## 1. O que este protocolo faz

- **ChatGPT no celular:** antes de uma resposta, o ChatGPT pode chamar o Desktop Commander por MCP e emitir um comando temporizado. O JARVIS exibe pensamento breve, move a boca por um período estimado e volta ao estado de escuta.
- **ChatGPT no PC / Chrome:** o monitor WASAPI segue reagindo à intensidade do áudio reproduzido pelo Windows; não precisa dos comandos temporizados para acompanhar o som local.
- **Prioridade dupla:** durante um comando móvel, a animação por MCP prevalece temporariamente sobre o áudio local. Ao terminar, o controle do áudio do Windows é retomado.
- O avatar **não fala**, **não lê o microfone do celular** e **não recebe a transmissão de áudio da chamada**. A animação móvel é intencionalmente um *falso sincronismo labial* por tempo, não por fonemas.

## 2. Comandos reais (Desktop Commander no Windows)

Pasta do projeto: C:\Users\Rafael\Documents\JarvisAvatar  
Script existente: scripts\jarvis-voice.ps1  
Porta padrão: 3766

### Consultar estado (não altera nada)

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Rafael\Documents\JarvisAvatar\scripts\jarvis-voice.ps1" -Mode status
~~~

### Ativar a sessão visual (uma vez por sessão)

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Rafael\Documents\JarvisAvatar\scripts\jarvis-voice.ps1" -Mode on
~~~

### Simular uma resposta falada por 12 segundos

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Rafael\Documents\JarvisAvatar\scripts\jarvis-voice.ps1" -Mode turn -Seconds 12
~~~

### Encerrar a sessão visual (quando solicitado)

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Rafael\Documents\JarvisAvatar\scripts\jarvis-voice.ps1" -Mode off
~~~

**Parâmetros válidos:** Mode = on, off, turn ou status. Seconds = 1 até 60. O script usa token LOCAL guardado no Windows; jamais copiar esse token para prompts, Markdown público ou GitHub.

## 3. Rotina sugerida a cada resposta no celular

1. Com a sessão visual ativa e o Desktop Commander disponível, **enviar o comando de turno ANTES de começar a responder**, sempre que o cliente ChatGPT permitir chamar a ferramenta.
2. Escolher Seconds conforme a **duração estimada da fala do assistente**, não conforme a duração da fala do usuário.
3. O servidor transita automaticamente por **pensando (~0,45 segundo) → falando (N segundos estimados) → ouvindo**.
4. Se uma nova resposta começar, enviar um novo turno estimado. Se a chamada falhar ou o PC estiver offline, responder normalmente sem prometer animação.
5. Não disparar áudio, microfone, SpeechSynthesis ou comandos de fala no navegador; só controlar a expressão visual.
6. Não emitir turn sem resposta falada; durante a escuta, manter o rosto em 'ouvindo' sem supor detecção de voz do telefone.

### Estimativas práticas de duração

| Tamanho aproximado da resposta falada | Seconds sugerido |
| --- | ---: |
| Muito curta (até ~12 palavras) | 4 |
| Curta (~13–28 palavras) | 8 |
| Média (~29–55 palavras) | 14 |
| Longa (~56–90 palavras) | 22 |
| Muito longa (>90 palavras) | 30–60 (máximo permitido: 60) |

Os valores são heurísticos: velocidade de leitura, latência do MCP, pausas e interrupções podem deixar o rosto adiantado ou atrasado. Para resposta longa, preferir duração estimada conservadora; **não afirmar sincronização precisa**.

## 4. Instrução reutilizável para o plugin JARVIS — Protocolo Visual

> Quando uma sessão do JARVIS V4.3 estiver ativa e o Desktop Commander conectado, tente, antes de cada resposta em voz, executar no PC o script de comando visual em Mode turn com Seconds estimado pela extensão da resposta. Preserve o modo de sincronismo local pelo áudio do Windows e não ative voz ou microfone no avatar. Depois do temporizador, o JARVIS retorna sozinho a ouvindo. Se o MCP não estiver disponível, não afirme que houve animação. Não acesse nem altere LexJuridicus, Codex Native ou outros MCPs.

**IMPORTANTE:** salvar este arquivo NÃO faz o ChatGPT ler o MD ou executar comandos automaticamente. O plugin/instrução ativa precisa orientar o modelo e a chamada MCP precisa realmente ocorrer. O modo Voz Live não garante chamadas automáticas a cada turno nem eventos exatos de início/fim do áudio.

## 5. Como testar o resultado sem confundir aceitação com animação

1. Abrir no PC: http://127.0.0.1:3766/
2. Executar Mode status; conferir se a sessão visual está ativa.
3. Executar Mode turn -Seconds 12.
4. Durante a janela de fala, consultar http://127.0.0.1:3766/api/state; procurar speaking=true e remoteTurnActive=true.
5. Após o temporizador, confirmar remoteTurnActive=false e retorno a 'ouvindo'; audioSync pode continuar true (modo PC preservado).
6. Confirmar visualmente no Chrome se o rosto moveu a boca; a confirmação via API por si só não prova renderização visual.

## 6. Integridade e limites

- Usar **somente** Desktop Commander + JARVIS, sem LexJuridicus e sem túnel novo.
- Manter o servidor em 127.0.0.1:3766 e nunca publicar token ou chave.
- Preservar o inicializador e o modo Windows/WASAPI da V4.3; não alterar a branch main sem autorização.
- Se o usuário pedir silêncio do avatar, manter zero áudio do JARVIS — somente a voz oficial do ChatGPT.
- Referências do projeto: docs/protocolo-jarvis-voz.md e docs/sincronismo-labial-v4.3.md.
