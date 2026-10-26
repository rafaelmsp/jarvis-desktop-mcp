import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import readline from 'node:readline';
import {applyCommand,initialState} from '../src/state.mjs';

test('comandos permitidos modificam somente o estado do avatar',()=>{
  const result=applyCommand(initialState(),{action:'set_expression',value:'happy'});
  assert.equal(result.expression,'happy');
  assert.throws(()=>applyCommand(result,{action:'set_mode',value:'executar-comandos'}));
  assert.throws(()=>applyCommand(result,{action:'set_caption',value:'x'.repeat(121)}));
  const puppet = applyCommand(result,{action:'animate_reply',value:12});
  assert.equal(puppet.speaking,true);
  assert.equal(puppet.status,'speaking');
  assert.equal(puppet.expression,'speaking');
  assert.throws(()=>applyCommand(result,{action:'animate_reply',value:61}));
  const session=applyCommand(result,{action:'set_voice_session',value:true});
  assert.equal(session.voiceSession,true);
  assert.equal(session.expression,'listening');
  const thinking=applyCommand(session,{action:'voice_turn',value:2});
  assert.equal(thinking.expression,'thinking');
  assert.equal(thinking.status,'processing');
  assert.equal(thinking.remoteTurnActive,true);
  const speaking=applyCommand(thinking,{action:'set_speaking',value:true});
  assert.equal(speaking.expression,'speaking');
  const done=applyCommand(speaking,{action:'set_speaking',value:false});
  assert.equal(done.status,'listening');
  assert.equal(done.expression,'listening');
  assert.equal(done.remoteTurnActive,false);
  const sync=applyCommand(done,{action:'set_audio_sync',value:true});
  assert.equal(sync.audioSync,true);
  const sample=applyCommand(sync,{action:'set_audio_level',value:0.65});
  assert.equal(sample.speaking,true);
  assert.equal(sample.status,'speaking');
  const silence=applyCommand(sample,{action:'set_audio_level',value:0});
  assert.equal(silence.status,'listening');
  const disabled=applyCommand(silence,{action:'set_audio_sync',value:false});
  assert.equal(disabled.audioSync,false);
  const stopped=applyCommand(done,{action:'set_voice_session',value:false});
  assert.equal(stopped.expression,'neutral');
  assert.throws(()=>applyCommand(result,{action:'voice_turn',value:61}));
  const expressive=applyCommand(session,{action:'express_reply',value:{seconds:4,mood:'happy'}});
  assert.equal(expressive.speaking,true);
  assert.equal(expressive.mood,'happy');
  assert.equal(applyCommand(expressive,{action:'set_speaking',value:false}).mood,'neutral');
  assert.throws(()=>applyCommand(session,{action:'express_reply',value:{seconds:4,mood:'execute'}}));
  assert.throws(()=>applyCommand(session,{action:'express_reply',value:{seconds:0,mood:'alert'}}));
});

test('servidor MCP responde a initialize e tools/list',async()=>{
  const proc=spawn(process.execPath,['src/mcp-server.mjs'],{cwd:new URL('..',import.meta.url),stdio:['pipe','pipe','pipe']});
  const reader=readline.createInterface({input:proc.stdout});
  const pending=new Map();
  reader.on('line',line=>{const msg=JSON.parse(line);const complete=pending.get(msg.id);if(complete){pending.delete(msg.id);complete(msg);}});
  const request=(id,method,params={})=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error(`Timeout ${method}`)),3000);
    pending.set(id,reply=>{clearTimeout(timer);resolve(reply);});
    proc.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
  });
  try {
    const init=await request(1,'initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1.0'}});
    assert.equal(init.result.serverInfo.name,'jarvis-avatar');
    const response=await request(2,'tools/list');
    assert.equal(response.result.tools.length,13);
    assert.ok(response.result.tools.some(x=>x.name==='jarvis_activate_protocol'));
    assert.ok(init.result.capabilities.prompts);
    assert.ok(init.result.capabilities.resources);
    assert.match(init.result.instructions,/Rafael/);
    assert.ok(response.result.tools.some(x=>x.name==='jarvis_set_mode'));
    assert.ok(response.result.tools.some(x=>x.name==='jarvis_animate_reply'));
    assert.ok(response.result.tools.some(x=>x.name==='jarvis_voice_session'));
    assert.ok(response.result.tools.some(x=>x.name==='jarvis_voice_turn'));
    assert.ok(response.result.tools.some(x=>x.name==='jarvis_expressive_reply'));
  } finally {proc.kill();reader.close();}
});
