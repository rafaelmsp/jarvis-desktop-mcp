// Mede apenas a latencia comando local -> estado disponivel no visualizador LAN.
// Nao mede a rede do aparelho, frames WebGL ou inicio real da voz ChatGPT.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
const allIps = Object.values(os.networkInterfaces()).flat().filter(x => x?.family === 'IPv4' && !x.internal);
const lanIp = allIps.find(x => x.address.startsWith('192.168.'))?.address || allIps.find(x => /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(x.address))?.address;
const host = process.argv[2] || (lanIp && 'http://' + lanIp + ':3767');
if (!host) throw Error('IP privado nao encontrado; informe a URL LAN como argumento');
const main = 'http://127.0.0.1:3766';
const token = fs.readFileSync(path.join(os.homedir(), '.jarvis-desktop-mcp-token-3766'), 'utf8').trim();
const pause = n => new Promise(resolve=>setTimeout(resolve,n));
async function send(action,value) {
  const r=await fetch(main+'/api/control',{method:'POST',headers:{'content-type':'application/json','x-jarvis-token':token},body:JSON.stringify({action,value})});
  if (!r.ok) throw Error('control HTTP '+r.status);
}
async function state() {
  const r=await fetch(host+'/api/state',{cache:'no-store'});
  if(!r.ok)throw Error('LAN HTTP '+r.status);
  return r.json();
}
async function waitFor(status,until) {
  while(performance.now()<until){
    if((await state()).status===status)return performance.now();
    await pause(15);
  }
  throw Error('Sem retorno a '+status);
}
const results=[];
try {
  const original=await state();
  if(!original.voiceSession) await send('set_voice_session',true);
  for(let i=0;i<8;i++){
    const t0=performance.now();
    await send('animate_reply',2);
    const tSpeaking=await waitFor('speaking',t0+3000);
    const t1=performance.now();
    await send('set_voice_session',true);
    const tListening=await waitFor('listening',t1+3000);
    results.push({startMs:+(tSpeaking-t0).toFixed(1),stopMs:+(tListening-t1).toFixed(1)});
    await pause(60);
  }
  const sorted=k=>results.map(x=>x[k]).sort((a,b)=>a-b);
  const median=k=>{const v=sorted(k);return (v[3]+v[4])/2};
  console.log(JSON.stringify({samples:results.length,medianStartMs:median('startMs'),medianStopMs:median('stopMs'),maxStartMs:sorted('startMs')[7],maxStopMs:sorted('stopMs')[7],note:'PC -> LAN HTTP state, not mobile screen/voice'},null,2));
} finally {await send('set_voice_session',true).catch(()=>{});}
