import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyCommand} from '../src/state.mjs';
import {readFile} from 'node:fs/promises';
import {createFacialRig} from '../src/client/face-v4-rig.js';

test('emocoes manuais persistem durante audio Windows e sao reversiveis',()=>{
  let state=applyCommand(initialState(),{action:'set_voice_session',value:true});
  state=applyCommand(state,{action:'set_audio_sync',value:true});
  for(const mood of ['happy','thinking','alert','surprised']){
    state=applyCommand(state,{action:'set_expression',value:mood});
    assert.equal(state.mood,mood);
    state=applyCommand(state,{action:'set_audio_level',value:.8});
    assert.equal(state.expression,'speaking');
    assert.equal(state.mood,mood);
    state=applyCommand(state,{action:'set_audio_level',value:0});
    assert.equal(state.expression,'listening');
    assert.equal(state.mood,mood);
  }
  state=applyCommand(state,{action:'set_expression',value:'neutral'});
  assert.equal(state.mood,'neutral');
  state=applyCommand(state,{action:'set_expression',value:'happy'});
  state=applyCommand(state,{action:'set_voice_session',value:false});
  assert.equal(state.mood,'neutral');
});

test('rig aplica as emocoes mesmo com monitor de audio e em silencio',async()=>{
  const mesh=JSON.parse(await readFile(new URL('../public/assets/models/canonical-face.json',import.meta.url),'utf8'));
  const points=new Float32Array(mesh.vertices.flat());
  const output=new Float32Array(points.length);
  for(const mood of ['happy','thinking','alert','surprised']){
    const rig=createFacialRig(points);
    for(let i=0;i<36;i++) rig.updateInto(output,{time:i/30,delta:1/30,expression:'listening',mood,audioDriven:true,audioLevel:0,speaking:false});
    const pose=rig.getPose();
    const key={happy:'smile',thinking:'thinking',alert:'alert',surprised:'surprise'}[mood];
    assert.ok(pose[key]>.75,`${mood} nao chegou ao rosto`);
  }
});
