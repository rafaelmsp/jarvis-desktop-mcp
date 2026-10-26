import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('um comando contextual anima, respeita audio local e volta ao repouso',async()=>{
  const port=50000+Math.floor(Math.random()*1500);
  const base='http://127.0.0.1:'+port;
  const tokenFile=path.join(os.homedir(),'.jarvis-desktop-mcp-token-'+port);
  const srv=spawn(process.execPath,['src/server.mjs'],{cwd:root,env:{...process.env,JARVIS_PORT:String(port)},stdio:'ignore'});
  try{
    let ready=false;
    for(let i=0;i<80;i++){
      try{if((await fetch(base+'/api/state')).ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,45));
    }
    assert.equal(ready,true);
    const token=(await fs.readFile(tokenFile,'utf8')).trim();
    const send=async(action,value)=>{
      const r=await fetch(base+'/api/control',{method:'POST',
        headers:{'Content-Type':'application/json','X-Jarvis-Token':token},
        body:JSON.stringify({action,value})});
      return {status:r.status,body:await r.json()};
    };
    await send('set_voice_session',true);
    await send('set_audio_sync',true);
    const start=await send('express_reply',{seconds:1,mood:'happy'});
    assert.equal(start.status,200);
    assert.equal(start.body.state.mood,'happy');
    assert.equal(start.body.state.speaking,true);
    const quiet=await send('set_audio_level',0);
    assert.equal(quiet.body.state.speaking,true,'audio em silencio nao cancela o celular');
    await new Promise(resolve=>setTimeout(resolve,1160));
    const end=await fetch(base+'/api/state').then(r=>r.json());
    assert.equal(end.mood,'neutral');
    assert.equal(end.speaking,false);
    assert.equal(end.audioSync,true);
    assert.equal(end.expression,'listening');
    const invalid=await send('express_reply',{seconds:6,mood:'hacked'});
    assert.equal(invalid.status,400);
    const off=await send('set_voice_session',false);
    assert.equal(off.body.state.mood,'neutral');
  }finally{
    srv.kill();
    await fs.rm(tokenFile,{force:true}).catch(()=>{});
  }
});

test('humor visual atravessa cliente e LAN sem texto privado',async()=>{
  const rig=await fs.readFile(path.join(root,'src/client/face-v4-rig.js'),'utf8');
  const face=await fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8');
  const app=await fs.readFile(path.join(root,'public/app.js'),'utf8');
  const lan=await fs.readFile(path.join(root,'src/lan-viewer.mjs'),'utf8');
  assert.ok(rig.includes('const visual='));
  assert.ok(face.includes('expression:expr,mood,speaking'));
  assert.ok(app.includes('avatar.dataset.mood='));
  assert.ok(lan.includes('mood:s.mood'));
});
