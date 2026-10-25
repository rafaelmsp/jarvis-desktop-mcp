import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {initialState, applyCommand} from './state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const HOST = '127.0.0.1';
const PORT = Number(process.env.JARVIS_PORT || 3765);
const TOKEN_FILE = path.join(os.homedir(), `.jarvis-desktop-mcp-token${PORT === 3765 ? '' : '-' + PORT}`);
let state = initialState();
const clients = new Set();
let replyAnimationTimer = null;
let thinkingTimer = null;

const token = randomBytes(32).toString('hex');
fs.writeFileSync(TOKEN_FILE, token, {mode: 0o600});
const authorized = input => {
  if (typeof input !== 'string' || input.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(token));
};
const reply = (res, code, data) => {
  res.writeHead(code, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(data));
};
const publish = () => {
  for (const client of clients) {
    try { client.write(`data: ${JSON.stringify(state)}\n\n`); }
    catch { clients.delete(client); }
  }
};
const consume = req => new Promise((resolve, reject) => {
  let bytes = 0; let chunks = '';
  req.on('data', chunk => {
    bytes += chunk.length;
    if (bytes > 4096) {reject(Error('Payload muito grande')); req.destroy(); return;}
    chunks += chunk;
  });
  req.on('end', () => {try {resolve(JSON.parse(chunks));} catch {reject(Error('JSON inválido'));}});
  req.on('error', reject);
});
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css','/face-v4.bundle.js':'face-v4.bundle.js','/assets/models/canonical-face.json':'assets/models/canonical-face.json','/assets/jarvis_humanoide_grid_conceito.webp':'../assets/jarvis_humanoide_grid_conceito.webp'};
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.json':'application/json; charset=utf-8'};

const server = http.createServer(async (req, res) => {
  const p = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && p === '/api/state') return reply(res, 200, state);
  if (req.method === 'GET' && p === '/api/events') {
    res.writeHead(200, {'Content-Type':'text/event-stream; charset=utf-8', 'Cache-Control':'no-cache', 'Connection':'keep-alive', 'X-Accel-Buffering':'no'});
    clients.add(res);
    res.write(`data: ${JSON.stringify(state)}\n\n`);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (req.method === 'POST' && (p === '/api/control' || p === '/api/manual')) {
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') return reply(res, 415, {error:'Somente JSON'});
    if (p === '/api/control' && !authorized(req.headers['x-jarvis-token'])) return reply(res, 401, {error:'Token MCP inválido'});
    if (p === '/api/manual') {
      const origin = req.headers.origin;
      if (origin && origin !== `http://${HOST}:${PORT}`) return reply(res, 403, {error:'Origem não permitida'});
      if (!req.headers['x-jarvis-ui']) return reply(res, 403, {error:'Somente interface local'});
    }
    try {
      const command = await consume(req);
      const nextState = applyCommand(state, command);
      // Novos comandos explícitos de fala/estado substituem uma animação temporizada anterior.
      if (['animate_reply','voice_turn','set_voice_session','set_speaking','set_status','reset'].includes(command.action)) {
        clearTimeout(replyAnimationTimer);
        clearTimeout(thinkingTimer);
        replyAnimationTimer = null;
        thinkingTimer = null;
      }
      state = nextState;
      if (command.action === 'voice_turn') {
        // Uma unica chamada MCP inicia pensando -> falando -> ouvindo.
        // As duracoes sao estimativas, nao eventos reais do audio.
        thinkingTimer = setTimeout(() => {
          thinkingTimer = null;
          state = applyCommand(state, {action:'set_speaking',value:true});
          publish();
          replyAnimationTimer = setTimeout(() => {
            replyAnimationTimer = null;
            state = applyCommand(state, {action:'set_speaking',value:false});
            publish();
          }, command.value * 1000);
          replyAnimationTimer.unref();
        }, 450);
        thinkingTimer.unref();
      }
      if (command.action === 'animate_reply') {
        replyAnimationTimer = setTimeout(() => {
          replyAnimationTimer = null;
          state = applyCommand(state, {action:'set_speaking', value:false});
          publish();
        }, command.value * 1000);
        replyAnimationTimer.unref();
      }
      publish();
      return reply(res, 200, {ok:true, state});
    } catch (e) { return reply(res, 400, {error:e.message}); }
  }
  if (req.method !== 'GET' || !files[p]) return reply(res, 404, {error:'Não encontrado'});
  const f = path.join(PUBLIC, files[p]);
  try {
    res.writeHead(200, {'Content-Type':types[path.extname(f)], 'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-cache', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; frame-ancestors 'none'"});
    fs.createReadStream(f).pipe(res);
  } catch {reply(res, 500, {error:'Falha no arquivo'});}
});
const heartbeat = setInterval(() => {
  for (const client of clients) {try { client.write(': ping\n\n');} catch {clients.delete(client);}}
}, 20_000);
server.on('close', () => {clearInterval(heartbeat); clearTimeout(replyAnimationTimer); clearTimeout(thinkingTimer);});
server.listen(PORT, HOST, () => console.log(`JARVIS online em http://${HOST}:${PORT}\nToken local: ${TOKEN_FILE}`));
