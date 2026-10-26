import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root,'public');
const host = process.env.JARVIS_LAN_HOST;
const port = Number(process.env.JARVIS_LAN_PORT || 3767);
const upstream = 'http://127.0.0.1:'+(process.env.JARVIS_PORT || '3766');
if (!host || !/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host)) throw Error('Configure JARVIS_LAN_HOST com o IP privado LAN');
const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js',
  '/style.css':'style.css','/face-v4.bundle.js':'face-v4.bundle.js',
  '/assets/models/canonical-face.json':'assets/models/canonical-face.json',
  '/assets/jarvis_humanoide_grid_conceito.webp':'../assets/jarvis_humanoide_grid_conceito.webp',
  '/lan-viewer.css':'lan-viewer.css'};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.webp':'image/webp','.json':'application/json; charset=utf-8'};
const safe=s=>({mode:s.mode,expression:s.expression,status:s.status,speaking:s.speaking,
  voiceSession:s.voiceSession,audioSync:s.audioSync,audioLevel:s.audioLevel,
  remoteTurnActive:s.remoteTurnActive,mood:s.mood||'neutral',caption:'JARVIS ONLINE',lastEventAt:s.lastEventAt});
function response(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
  if(req.method!=='GET')return response(res,405,{error:'Visualizador LAN: somente leitura'});
  const route=new URL(req.url,'http://localhost').pathname;
  if(route==='/api/state'){
    try{const r=await fetch(upstream+'/api/state',{signal:AbortSignal.timeout(2500)});
      if(!r.ok)throw Error('offline');return response(res,200,safe(await r.json()));}
    catch{return response(res,503,{error:'Servidor local indisponivel'});}
  }
  if(route==='/api/events'){
    const u=http.get(upstream+'/api/events',inbound=>{
      if(inbound.statusCode!==200){inbound.resume();return response(res,503,{error:'Servidor local indisponivel'});}
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8',
        'Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});
      let buf='';
      inbound.setEncoding('utf8');
      inbound.on('data',chunk=>{
        buf+=chunk;
        let pos;while((pos=buf.indexOf('\n'))!==-1){
          const line=buf.slice(0,pos).replace(/\r$/,'');buf=buf.slice(pos+1);
          if(line.startsWith('data: ')){
            try{res.write('data: '+JSON.stringify(safe(JSON.parse(line.slice(6))))+'\n');}
            catch{res.write(': invalid state\n');}
          }else if(line.startsWith(':'))res.write(line+'\n');
          else if(line==='')res.write('\n');
        }
        if(buf.length>100000){inbound.destroy();res.end();}
      });
      inbound.on('end',()=>res.end());
      inbound.on('error',()=>res.end());
    });u.on('error',()=>{if(!res.headersSent)response(res,503,{error:'Servidor local indisponivel'});else res.end();});
    req.on('close',()=>u.destroy());return;
  }
  if(!Object.hasOwn(files,route))return response(res,404,{error:'Nao encontrado'});
  const file=path.resolve(publicDir,files[route]);
  const allow=[publicDir,path.resolve(root,'assets')];
  if(!allow.some(dir=>file.startsWith(dir+path.sep)))return response(res,403,{error:'Proibido'});
  try{
    const stat=await fs.promises.stat(file);if(!stat.isFile())throw Error('not file');
    if(route==='/' || route==='/index.html'){
      const original=await fs.promises.readFile(file,'utf8');
      const rendered=original.replace('</head>','<link rel="stylesheet" href="/lan-viewer.css"></head>');
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      return res.end(rendered);
    }
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream',
      'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Cache-Control':'no-store',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"});
    fs.createReadStream(file).pipe(res);
  }catch{return response(res,404,{error:'Arquivo nao encontrado'});}
});
server.listen(port,host,()=>console.log('JARVIS LAN viewer em http://'+host+':'+port));
