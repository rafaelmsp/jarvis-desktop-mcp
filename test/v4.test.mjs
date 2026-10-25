import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('geometria canônica facial V4 possui anatomia indexada válida', async()=>{
  const mesh=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
  assert.equal(mesh.license,'Apache-2.0');
  assert.equal(mesh.vertexCount,468);
  assert.equal(mesh.triangleCount,898);
  assert.ok(mesh.vertices.every(v=>v.length===3&&v.every(Number.isFinite)));
  assert.ok(mesh.triangles.every(v=>v.length===3&&v.every(i=>Number.isInteger(i)&&i>=0&&i<468)));
  assert.ok(mesh.vertices[1][2]>mesh.vertices[33][2], 'nariz à frente da órbita');
  assert.ok(mesh.vertices[10][1]>mesh.vertices[152][1], 'testa acima do queixo');
});
test('apenas o renderer 3D V4 permanece no projeto',async()=>{
  const legacy=await fs.readFile(path.join(root,'public/app.js'),'utf8');
  const renderer=await fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8');
  assert.ok(!legacy.includes('startSynthFace'));
  assert.ok(!legacy.includes('JARVIS VECTORMESH'));
  assert.ok(renderer.includes("import * as THREE from 'three'"));
  assert.ok(legacy.includes('speechSynthesis'));
  assert.ok(legacy.includes('getUserMedia'));
});
test('servidor local atende WebGL e mantém controles com validação',async()=>{
  const port=48000+Math.floor(Math.random()*300);
  const endpoint='http://127.0.0.1:'+port;
  const tokenPath=path.join(os.homedir(),'.jarvis-desktop-mcp-token-'+port);
  const cp=spawn(process.execPath,['src/server.mjs'],{
    cwd:root,env:{...process.env,JARVIS_PORT:String(port)},stdio:['ignore','pipe','pipe']
  });
  try{
    let running=false;
    for(let tries=0;tries<100;tries++){
      if(cp.exitCode!==null)throw Error('server exited early: '+cp.exitCode);
      await new Promise(r=>setTimeout(r,30));
      try{const r=await fetch(endpoint+'/api/state'); if(r.ok){running=true;break;}}catch{}
    }
    assert.ok(running,'servidor local iniciou');
    const [html,js,geometry]=await Promise.all([
      fetch(endpoint+'/').then(r=>r.text()),
      fetch(endpoint+'/face-v4.bundle.js'),
      fetch(endpoint+'/assets/models/canonical-face.json').then(r=>r.json()),
    ]);
    assert.ok(html.includes('face3dViewport'));
    assert.ok(js.ok);
    assert.equal(js.headers.get('content-type')?.split(';')[0],'text/javascript');
    assert.equal(geometry.vertexCount,468);
    const deny=await fetch(endpoint+'/api/control',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'set_expression',value:'happy'})});
    assert.equal(deny.status,401);
    const missingHeader=await fetch(endpoint+'/api/manual',{method:'POST',
      headers:{'Content-Type':'application/json','Origin':endpoint},
      body:JSON.stringify({action:'set_expression',value:'happy'})});
    assert.equal(missingHeader.status,403);
    const foreignOrigin=await fetch(endpoint+'/api/manual',{method:'POST',
      headers:{'Content-Type':'application/json','Origin':'https://invalid.example','X-Jarvis-UI':'1'},
      body:JSON.stringify({action:'set_expression',value:'happy'})});
    assert.equal(foreignOrigin.status,403);
    const valid=await fetch(endpoint+'/api/manual',{method:'POST',
      headers:{'Content-Type':'application/json','Origin':endpoint,'X-Jarvis-UI':'1'},
      body:JSON.stringify({action:'set_expression',value:'happy'})});
    assert.equal(valid.status,200);
    assert.equal((await valid.json()).state.expression,'happy');
    assert.ok(await fs.stat(tokenPath));
  } finally {
    cp.kill();
    await new Promise(r=>setTimeout(r,100));
    await fs.rm(tokenPath,{force:true}).catch(()=>{});
  }
});
test('a interface anima a boca no modo falando e mostra a porta correta',async()=>{
  const app=await fs.readFile(path.join(root,'public/app.js'),'utf8');
  const html=await fs.readFile(path.join(root,'public/index.html'),'utf8');
  assert.ok(app.includes("state.expression==='speaking'"), 'expressão speaking habilita animação');
  assert.ok(app.includes("window.location.port || '80'"), 'porta é derivada da URL');
  assert.ok(html.includes('id="portLabel"'), 'rodapé exibe porta dinâmica');
  assert.ok(html.includes('Copyright © 2026 Rafael Passos'), 'rodapé informa os direitos autorais');
  assert.ok(html.includes('id="puppetTest"'), 'teste silencioso disponível na interface');
  assert.ok(html.includes('id="voiceSessionButton"'), 'sessao conversacional disponível');
  assert.ok(app.includes('current.voiceSession || !synth'), 'modo visual impede áudio local');
});

test('acabamento humanoide cria detalhes dos olhos e orelhas e libera recursos',async()=>{
  const THREE=await import('three');
  const {createFacialFinishing}=await import('../src/client/face-v4-finishing.js');
  const mesh=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
  const vertices=new Float32Array(mesh.vertices.flat());
  const group=new THREE.Group();
  const details=createFacialFinishing(THREE,group,vertices);
  assert.ok(group.children.length>=20,'o rosto recebe contornos e olhos modelados');
  details.update({working:vertices,time:0,expression:'neutral',speaking:false,reducedMotion:true});
  details.update({working:vertices,time:1.2,expression:'happy',speaking:false,reducedMotion:false});
  details.update({working:vertices,time:2.1,expression:'speaking',speaking:true,reducedMotion:false});
  details.dispose();
  assert.equal(group.children.length,0,'geometrias extras desconectadas do rosto');
});
test('olhos e boca mantêm contornos sem triangulação de dentes',async()=>{
  const code=await fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8');
  assert.ok(code.includes('detailZone(u,v)'));
  assert.ok(code.includes("createFacialFinishing(THREE,root,vertices)"));
  assert.ok(code.includes('finishing.dispose()'));
});

test('comando visual mudo inicia a fala e a encerra automaticamente', async()=>{
  const port=48700+Math.floor(Math.random()*300);
  const endpoint='http://127.0.0.1:'+port;
  const tokenPath=path.join(os.homedir(),'.jarvis-desktop-mcp-token-'+port);
  const cp=spawn(process.execPath,['src/server.mjs'],{cwd:root,env:{...process.env,JARVIS_PORT:String(port)},stdio:['ignore','pipe','pipe']});
  try{
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){
      await new Promise(r=>setTimeout(r,30));
      try{if((await fetch(endpoint+'/api/state')).ok){ready=true;break;}}catch{}
    }
    assert.ok(ready, 'servidor de teste iniciou');
    const token=(await fs.readFile(tokenPath,'utf8')).trim();
    const command=await fetch(endpoint+'/api/control',{method:'POST',headers:{'Content-Type':'application/json','X-Jarvis-Token':token},
      body:JSON.stringify({action:'animate_reply',value:1})});
    assert.equal(command.status,200);
    const initial=(await command.json()).state;
    assert.equal(initial.speaking,true);
    assert.equal(initial.expression,'speaking');
    await new Promise(r=>setTimeout(r,1150));
    const finished=await fetch(endpoint+'/api/state').then(r=>r.json());
    assert.equal(finished.speaking,false);
    assert.equal(finished.expression,'neutral');
    assert.equal(finished.status,'idle');
  } finally {
    cp.kill();
    await new Promise(r=>setTimeout(r,100));
    await fs.rm(tokenPath,{force:true}).catch(()=>{});
  }
});

test('sessão de voz silenciosa gera pensando, falando e ouvindo, com parada', async()=>{
  const port=49000+Math.floor(Math.random()*300);
  const endpoint='http://127.0.0.1:'+port;
  const tokenPath=path.join(os.homedir(),'.jarvis-desktop-mcp-token-'+port);
  const cp=spawn(process.execPath,['src/server.mjs'],{
    cwd:root,env:{...process.env,JARVIS_PORT:String(port)},stdio:['ignore','pipe','pipe']
  });
  try{
    let ready=false;
    for(let i=0;i<100;i++){
      await new Promise(r=>setTimeout(r,30));
      try{if((await fetch(endpoint+'/api/state')).ok){ready=true;break;}}catch{}
    }
    assert.ok(ready);
    const token=(await fs.readFile(tokenPath,'utf8')).trim();
    const cmd=async(action,value)=>{
      const res=await fetch(endpoint+'/api/control',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Jarvis-Token':token},
        body:JSON.stringify({action,value})
      });
      assert.equal(res.status,200);
      return (await res.json()).state;
    };
    let state=await cmd('set_voice_session',true);
    assert.equal(state.expression,'listening');
    assert.equal(state.voiceSession,true);
    state=await cmd('voice_turn',1);
    assert.equal(state.status,'processing');
    assert.equal(state.speaking,false);
    await new Promise(r=>setTimeout(r,600));
    state=await fetch(endpoint+'/api/state').then(r=>r.json());
    assert.equal(state.status,'speaking');
    assert.equal(state.expression,'speaking');
    await new Promise(r=>setTimeout(r,1050));
    state=await fetch(endpoint+'/api/state').then(r=>r.json());
    assert.equal(state.status,'listening');
    assert.equal(state.expression,'listening');
    assert.equal(state.speaking,false);
    // Cancel a long running reply immediately and verify no stale timer restarts it.
    await cmd('voice_turn',15);
    state=await cmd('set_voice_session',false);
    assert.equal(state.status,'idle');
    assert.equal(state.voiceSession,false);
    await new Promise(r=>setTimeout(r,550));
    state=await fetch(endpoint+'/api/state').then(r=>r.json());
    assert.equal(state.status,'idle');
    assert.equal(state.speaking,false);
  } finally {
    cp.kill();
    await new Promise(r=>setTimeout(r,100));
    await fs.rm(tokenPath,{force:true}).catch(()=>{});
  }
});

test('dois canais coexistem: mouth renderer alterna entre loopback do PC e MCP do celular', async()=>{
  const renderer=await fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8');
  const client=await fs.readFile(path.join(root,'public/app.js'),'utf8');
  assert.ok(renderer.includes("avatar.dataset.remoteTurnActive!=='true'"), 'durante celular, movimento nao depende de nivel do PC');
  assert.ok(client.includes('avatar.dataset.remoteTurnActive='), 'cliente propaga controle MCP para renderer');
  assert.ok(client.includes('PC · ÁUDIO WINDOWS ATIVO'), 'interface preserva o modo local');
  assert.ok(client.includes('CELULAR · MCP DISPONÍVEL'), 'interface exibe o modo celular');
});
