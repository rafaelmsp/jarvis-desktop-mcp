# JARVIS V5.0 — Holograma humanoide natural

**Objetivo:** melhorar a leitura visual de um rosto humano real, mantendo a assinatura holográfica azul do JARVIS e a arquitetura de avatar silencioso.

## O que mudou
- **Volume facial orgânico:** malha anatômica suavizada por uma subdivisão Loop com controle de intensidade. A topologia MediaPipe original de 468 pontos e 898 faces continua **intacta** como guia das linhas e de deformação facial.
- **Iluminação tridimensional:** material semiopaco com rugosidade difusa, luz principal lateral, preenchimento suave e ambiente frio, posicionados para realçar nariz, órbitas, bochechas e mandíbula.
- **Olhar:** olhos com volume elipsoidal e pupilas discretas, ainda inteiramente monocromáticos/tecnológicos; piscadas e acompanhamento ocular antigos continuam funcionando.
- **Cabeça e respiração:** rotação suave relacionada ao olhar, à postura facial e à respiração, em vez de oscilação mecânica contínua.
- **Menos ruído visual:** linhas, pontos e brilho calibrados para que os contornos anatômicos sejam mais legíveis, sem remover a grade holográfica.
- **Comparação imediata:** novo botão **Realismo anatômico** (padrão ligado) / **Wireframe clássico**. A preferência é salva apenas no navegador atual via localStorage; o avatar da LAN tem preferência própria.
- **Reversibilidade:** desligar o realismo alterna apenas a camada de superfície e intensidades visuais. A malha e os modos MCP, áudio Windows e voz do ChatGPT permanecem preservados.

## Limites do resultado
- **Não é um deepfake nem um rosto humano fotográfico**: continua sendo um holograma sem textura de pele, criado a partir da topologia pública MediaPipe e das formas geométricas do projeto.
- A tela pode parecer mais ou menos realista conforme ângulo, GPU, WebGL, tamanho e brilho do monitor. A avaliação estética final exige o teste visual pelo usuário.
- Não existe captura de webcam nem microfone; o áudio Windows continua sendo apenas um detector local de amplitude para abrir a boca. O rosto não identifica emoções reais pela voz.
- Nenhum serviço externo, biblioteca paga ou API adicionada. O modo de início no Windows continua **manual**, por solicitação expressa.

## Testes e validação
Execute a partir da pasta `JarvisAvatar`:

```powershell
npm run build-v4
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\diagnostico-jarvis.ps1
```

O comando `npm test` agora limita a execução a dois arquivos simultâneos, reduzindo falhas espúrias por excesso de processos Node no Windows. Os testes de V5 avaliam topologia, finitude, limites de geometria, recalculo do volume, movimento de cabeça, limpeza de GPU e presença dos controles.

## Uso
1. Abra o JARVIS manualmente com `iniciar-jarvis-manual.bat` (caso não esteja rodando).
2. Atualize o Chrome com **Ctrl+F5** em `http://127.0.0.1:3766/`.
3. Em **APARÊNCIA**, compare **Realismo anatômico** com **Wireframe clássico**.
4. Em **EXPRESSÕES**, execute a demonstração e observe sorriso, surpresa, olhos e boca.
5. A versão principal (`main`) deve permanecer intacta até a aprovação de Rafael.

**Copyright © 2026 Rafael Passos — Engenharia de Software, IA e Segurança da Informação.**
