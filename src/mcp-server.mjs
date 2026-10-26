import readline from 'node:readline';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {MODES, EXPRESSIONS, STATUSES, MOODS} from './state.mjs';

// MCP da V4.9 usa o painel atual por padrao; defina JARVIS_PORT=3765 para o painel legado.
const PORT = Number(process.env.JARVIS_PORT || 3766);
const TOKEN_FILE = path.join(os.homedir(), `.jarvis-desktop-mcp-token${PORT === 3765 ? '' : '-' + PORT}`);
const URL = `http://127.0.0.1:${PORT}`;
const PROTOCOL_URI = 'jarvis://protocol/persona';
const PROTOCOL_NAME = 'jarvis-rafael';
const PROTOCOL_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','docs','JARVIS_PERSONALIDADE_MCP.md');
const readProtocol = () => fs.readFileSync(PROTOCOL_PATH,'utf8');
const serverInstructions = 'Quando Rafael pedir modo JARVIS, carregue o prompt jarvis-rafael ou execute a ferramenta jarvis_activate_protocol. Fale com serenidade e humor discreto, chame-o Rafael (nunca senhor Stark). O avatar e silencioso; nao alegue movimentos faciais sem executar a ferramenta. A simples conexao MCP nao altera a identidade ou estilo de todos os chats.';
const tool = (name, description, properties, required=['value']) => ({
  name, description, inputSchema:{type:'object',properties,required,additionalProperties:false}
});
const option = values => ({type:'string', enum:values});
const tools = [
  tool('jarvis_set_mode', 'Altera visual: core (símbolo circular) ou face (rosto holográfico).', {value:option(MODES)}),
  tool('jarvis_set_expression', 'Altera expressão visual do avatar.', {value:option(EXPRESSIONS)}),
  tool('jarvis_set_status', 'Altera status do avatar: ouvindo, processando, falando, etc.', {value:option(STATUSES)}),
  tool('jarvis_set_speaking', 'Inicia/encerra a animação de fala. Não representa necessariamente o áudio real do ChatGPT.', {value:{type:'boolean'}}),
  tool('jarvis_animate_reply', 'Simula silenciosamente a fala no rosto durante 1 a 60 segundos, desligando a animação automaticamente. Não captura nem emite áudio; é apenas uma aproximação visual, não sincronização com o áudio real.', {value:{type:'number',minimum:1,maximum:60}}),
  tool('jarvis_voice_session', 'Ativa/desativa o modo visual de conversação. Ativo = rosto atento, ouvindo; desligado = rosto neutro. Nenhum áudio ou conversa é capturado.', {value:{type:'boolean'}}),
  tool('jarvis_voice_turn', 'Inicia uma resposta visual em uma chamada: pensando por 0,45 segundo, simulando fala silenciosa por 1 a 60 segundos estimados, e voltando a ouvir. Não recebe eventos de voz do ChatGPT e não sincroniza fonemas.', {value:{type:'number',minimum:1,maximum:60}}),
  tool('jarvis_expressive_reply', 'Anima fala com expressao contextual, 1 a 60 segundos, sem analisar audio', {seconds:{type:'number',minimum:1,maximum:60},mood:option(MOODS)}, ['seconds','mood']),
  tool('jarvis_audio_sync', 'Habilita ou desabilita o sincronismo labial pelo áudio local de saída do Windows, quando o monitor estiver instalado. Não grava áudio nem reconhece palavras.', {value:{type:'boolean'}}),
  tool('jarvis_set_caption', 'Define mensagem breve no painel; não envie dados confidenciais.', {value:{type:'string',maxLength:120}}),
  tool('jarvis_get_state', 'Obtém estado visual atual do Jarvis.', {}, []),
  tool('jarvis_activate_protocol', 'Ativa a sessao visual JARVIS no PC e devolve o Markdown oficial de personalidade para a conversa com Rafael. A chamada e explicita; apenas conectar ao MCP nao executa a ferramenta.', {}, []),
  tool('jarvis_reset', 'Restaura o avatar para estado inicial.', {}, [])
];
const actions = {jarvis_set_mode:'set_mode',jarvis_set_expression:'set_expression',jarvis_set_status:'set_status',jarvis_set_speaking:'set_speaking',jarvis_animate_reply:'animate_reply',jarvis_voice_session:'set_voice_session',jarvis_voice_turn:'voice_turn',jarvis_expressive_reply:'express_reply',jarvis_audio_sync:'set_audio_sync',jarvis_set_caption:'set_caption',jarvis_reset:'reset'};

async function runTool(name,args={}) {
  const definition = tools.find(t=>t.name===name);
  if (!definition) throw Error('Ferramenta desconhecida');
  if (name === 'jarvis_activate_protocol') {
    const current = await runTool('jarvis_get_state');
    const state = current.voiceSession ? current : await runTool('jarvis_voice_session',{value:true});
    return {activated:true,avatarSession:state.voiceSession,protocol:readProtocol(),state};
  }
  if (name === 'jarvis_get_state') {
    const response = await fetch(`${URL}/api/state`);
    if (!response.ok) throw Error('Painel não está disponível');
    return await response.json();
  }
  const token = fs.readFileSync(TOKEN_FILE,'utf8').trim();
  const response = await fetch(`${URL}/api/control`, {
    method:'POST', headers:{'Content-Type':'application/json','X-Jarvis-Token':token},
    body:JSON.stringify({action:actions[name], value:name==='jarvis_expressive_reply'?{seconds:args.seconds,mood:args.mood}:args.value})
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || 'Comando falhou');
  return result.state;
}
function send(obj) { process.stdout.write(JSON.stringify(obj)+'\n'); }
async function handle(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return;
  if (msg.id === undefined) return;
  try {
    let result;
    switch(msg.method) {
      case 'initialize': result = {protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false},prompts:{listChanged:false},resources:{listChanged:false}},serverInfo:{name:'jarvis-avatar',version:'0.4.0'},instructions:serverInstructions}; break;
      case 'ping': result = {}; break;
      case 'tools/list': result = {tools}; break;
      case 'prompts/list': result = {prompts:[{name:PROTOCOL_NAME,description:'Ativar o estilo conversacional JARVIS (Rafael) nesta conversa e orientar as expressoes visuais MCP.'}]}; break;
      case 'prompts/get': {
        if (msg.params?.name !== PROTOCOL_NAME) return send({jsonrpc:'2.0',id:msg.id,error:{code:-32602,message:'Prompt nao encontrado'}});
        result={description:'Protocolo JARVIS para Rafael, ativacao apenas na conversa solicitada.',messages:[{role:'user',content:{type:'text',text:readProtocol()}}]};
        break;
      }
      case 'resources/list': result = {resources:[{uri:PROTOCOL_URI,name:'JARVIS — Personalidade Rafael',mimeType:'text/markdown',description:'Markdown local do modo JARVIS. Leitura nao altera o estado do avatar.'}]}; break;
      case 'resources/read': {
        if (msg.params?.uri !== PROTOCOL_URI) return send({jsonrpc:'2.0',id:msg.id,error:{code:-32602,message:'Recurso nao encontrado'}});
        result={contents:[{uri:PROTOCOL_URI,mimeType:'text/markdown',text:readProtocol()}]};
        break;
      }
      case 'tools/call': {
        try {result={content:[{type:'text',text:JSON.stringify(await runTool(msg.params?.name,msg.params?.arguments))}],isError:false};}
        catch(e){result={content:[{type:'text',text:String(e.message)}],isError:true};}
        break;
      }
      default: return send({jsonrpc:'2.0',id:msg.id,error:{code:-32601,message:'Method not found'}});
    }
    send({jsonrpc:'2.0',id:msg.id,result});
  } catch(e) {send({jsonrpc:'2.0',id:msg.id,error:{code:-32603,message:String(e.message)}});}
}
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
rl.on('line',line=>{try {const msg=JSON.parse(line);void handle(msg);} catch {process.stderr.write('Mensagem JSON inválida\n');}});
