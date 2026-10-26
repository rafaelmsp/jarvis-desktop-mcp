import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('MCP disponibiliza o Markdown como instrucoes, prompt e recurso; ativacao so por chamada',async()=>{
  const port=56000+Math.floor(Math.random()*5500);
  const tokenFile=path.join(os.homedir(),'.jarvis-desktop-mcp-token-'+port);
  const base='http://127.0.0.1:'+port;
  const env={...process.env,JARVIS_PORT:String(port)};
  const avatar=spawn(process.execPath,['src/server.mjs'],{cwd:root,env,stdio:'ignore'});
  const mcp=spawn(process.execPath,['src/mcp-server.mjs'],{cwd:root,env,stdio:['pipe','pipe','pipe']});
  const reader=readline.createInterface({input:mcp.stdout});
  let id=0;
  const pending=new Map();
  reader.on('line',line=>{
    const message=JSON.parse(line);
    const receive=pending.get(message.id);
    if(receive){pending.delete(message.id);receive(message);}
  });
  const request=(method,params={})=>new Promise((resolve,reject)=>{
    const current=++id;
    const timer=setTimeout(()=>{pending.delete(current);reject(Error('MCP timeout: '+method));},5000);
    pending.set(current,m=>{clearTimeout(timer);resolve(m);});
    mcp.stdin.write(JSON.stringify({jsonrpc:'2.0',id:current,method,params})+'\n');
  });
  try {
    let online=false;
    for(let i=0;i<65;i++){
      try{const r=await fetch(base+'/api/state');if(r.ok){online=true;break;}}catch{}
      await wait(50);
    }
    assert.equal(online,true,'Servidor local de teste inicializado');
    const init=await request('initialize',{protocolVersion:'2025-06-18'});
    assert.match(init.result.instructions,/JARVIS/);
    assert.equal(init.result.capabilities.prompts.listChanged,false);
    assert.equal(init.result.capabilities.resources.listChanged,false);
    const available=await request('prompts/list');
    assert.ok(available.result.prompts.some(p=>p.name==='jarvis-rafael'));
    const prompt=await request('prompts/get',{name:'jarvis-rafael'});
    const markdown=prompt.result.messages[0].content.text;
    assert.match(markdown,/PROTOCOLO JARVIS/);
    assert.match(markdown,/Rafael/);
    assert.match(markdown,/nunca por “senhor Stark”/);
    assert.doesNotMatch(markdown,/\.jarvis-desktop-mcp-token-/);
    const listed=await request('resources/list');
    assert.equal(listed.result.resources[0].uri,'jarvis://protocol/persona');
    const resource=await request('resources/read',{uri:'jarvis://protocol/persona'});
    assert.equal(resource.result.contents[0].text,markdown,'Prompt e recurso devem ler o mesmo MD');
    const before=await fetch(base+'/api/state').then(r=>r.json());
    assert.equal(before.voiceSession,false,'Handshake nao ativa o avatar sozinho');
    const result=await request('tools/call',{name:'jarvis_activate_protocol',arguments:{}});
    assert.equal(result.result.isError,false);
    const activated=JSON.parse(result.result.content[0].text);
    assert.equal(activated.activated,true);
    assert.equal(activated.avatarSession,true);
    assert.match(activated.protocol,/PROTOCOLO JARVIS/);
    const after=await fetch(base+'/api/state').then(r=>r.json());
    assert.equal(after.voiceSession,true);
    assert.equal(after.audioSync,false,'Ativacao nao liga nem desliga monitor de audio');
    const again=await request('tools/call',{name:'jarvis_activate_protocol',arguments:{}});
    assert.equal(JSON.parse(again.result.content[0].text).state.voiceSession,true);
    const wrong=await request('prompts/get',{name:'outro-prompt'});
    assert.equal(wrong.error.code,-32602);
    const wrongResource=await request('resources/read',{uri:'file:///segredo'});
    assert.equal(wrongResource.error.code,-32602);
  }finally{
    mcp.kill();avatar.kill();reader.close();
    await fs.rm(tokenFile,{force:true}).catch(()=>{});
  }
});
