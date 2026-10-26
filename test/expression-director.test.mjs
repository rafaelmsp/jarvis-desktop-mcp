import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createExpressionDirector} from '../src/client/expression-director.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const audio=(dir,time,level=.4,speaking=true,more={})=>dir.select({
  time,expression:speaking?'speaking':'listening',mood:'neutral',
  speaking,voiceSession:true,audioDriven:true,audioLevel:level,...more
});
test('Classic / áudio do Windows gera concentração e retornos à escuta',()=>{
  const dir=createExpressionDirector();
  assert.equal(audio(dir,0,.35),'thinking');
  assert.equal(audio(dir,.5,.4),'speaking');
  assert.equal(audio(dir,.8,.95),'speaking');
  assert.equal(audio(dir,1.1,.97),'speaking');
  assert.equal(audio(dir,1.4,.35),'speaking');
  assert.equal(audio(dir,1.5,0,false),'listening');
  assert.equal(audio(dir,1.8,0,false),'thinking');
  assert.equal(audio(dir,2.3,0,false),'listening');
});
test('Ênfase acústica desencadeia reações breves sem interpretar palavras',()=>{
  const dir=createExpressionDirector();
  assert.equal(audio(dir,0,.30),'thinking');
  assert.equal(audio(dir,.7,.40),'speaking');
  assert.equal(audio(dir,1.0,.94),'surprised');
  assert.equal(audio(dir,1.22,.60),'surprised');
  assert.equal(audio(dir,1.6,.38),'speaking');
  const high=createExpressionDirector();
  assert.equal(audio(high,0,.78),'thinking');
  assert.equal(audio(high,.65,.78),'speaking');
  assert.equal(audio(high,1.14,.78),'alert');
});
test('Sorriso discreto aparece na cadência, mas emoção explícita sempre vence',()=>{
  const dir=createExpressionDirector();
  let happy=false;
  for(let i=0;i<60;i++){
    const t=i/20;
    if(audio(dir,t,.35)==='happy') happy=true;
  }
  assert.equal(happy,true);
  assert.equal(audio(dir,3.1,.99,true,{mood:'alert'}),'alert');
  assert.equal(audio(dir,3.2,.99,true,{mood:'surprised'}),'surprised');
  assert.equal(audio(dir,3.3,.99,true,{mood:'thinking'}),'thinking');
  assert.equal(audio(dir,3.4,.99,true,{mood:'happy'}),'happy');
});
test('Modo desligado e movimento reduzido respeitam a expressão original',()=>{
  const dir=createExpressionDirector();
  assert.equal(audio(dir,0,.8,true,{enabled:false}),'speaking');
  assert.equal(audio(dir,.5,.8,true,{reducedMotion:true}),'speaking');
  assert.equal(audio(dir,1,.8,true,{voiceSession:false}),'speaking');
  assert.equal(audio(dir,2,.8,true,{audioDriven:false}),'speaking');
  assert.equal(audio(dir,3,.8,true,{mood:'surprised',enabled:false}),'surprised');
  assert.equal(audio(dir,4,.8,true,{expression:'happy'}),'happy');
});
test('Interface tem demonstrador local e estado facial visível',async()=>{
  const [html,app,face,css]=await Promise.all([
    fs.readFile(path.join(root,'public/index.html'),'utf8'),
    fs.readFile(path.join(root,'public/app.js'),'utf8'),
    fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8'),
    fs.readFile(path.join(root,'public/style.css'),'utf8')
  ]);
  assert.match(html,/id="autoExpressionButton"/);
  assert.match(html,/id="expressionDemoButton"/);
  assert.match(html,/id="liveExpressionStatus"/);
  assert.match(app,/stopEmotionDemo/);
  assert.match(app,/control\('set_expression',emotion\)/);
  assert.match(app,/dataset\.voiceSession=/);
  assert.match(face,/createExpressionDirector/);
  assert.match(face,/enabled:avatar\.dataset\.autoExpressions/);
  assert.match(face,/expression:expressive/);
  assert.match(css,/\.expression-tools/);
});
