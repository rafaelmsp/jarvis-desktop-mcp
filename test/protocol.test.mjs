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
    assert.equal(response.result.tools.length,7);
    assert.ok(response.result.tools.some(x=>x.name==='jarvis_set_mode'));
  } finally {proc.kill();reader.close();}
});
