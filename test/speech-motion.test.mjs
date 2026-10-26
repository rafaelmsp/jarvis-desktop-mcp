import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticSpeechAt} from '../src/client/speech-motion.js';

test('labios remotos simulam cadencia sem audio, com pausas e limites',()=>{
  const samples=Array.from({length:400},(_,i)=>syntheticSpeechAt(i/40));
  assert.ok(samples.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
  assert.ok(Math.max(...samples)>.6,'movimento perceptivel');
  assert.ok(Math.min(...samples)<.15,'pausas visuais');
  assert.ok(new Set(samples.map(x=>x.toFixed(2))).size>25,'variacao temporal');
  assert.equal(syntheticSpeechAt(1,{speaking:false}),0);
  assert.equal(syntheticSpeechAt(1,{reducedMotion:true}),.32);
});
