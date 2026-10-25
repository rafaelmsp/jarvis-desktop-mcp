import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createFacialRig} from '../src/client/face-v4-rig.js';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mesh=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const vertices=new Float32Array(mesh.vertices.flat());
const y=(arr,index)=>arr[index*3+1];
const poseAt=(expression,options={})=>{
  const rig=createFacialRig(vertices);
  const output=new Float32Array(vertices.length);
  for(let i=0;i<50;i++) rig.updateInto(output,{time:(i+1)/30,delta:1/30,expression,...options});
  return {output,pose:rig.getPose()};
};

test('V4.4: malha de 468 pontos permanece imutável',()=>{
  const original=Float32Array.from(vertices);
  const rig=createFacialRig(vertices);
  const out=new Float32Array(vertices.length);
  for(const expression of ['neutral','listening','thinking','speaking','happy','surprised','alert']){
    const pose=rig.updateInto(out,{time:2,delta:1/30,expression,speaking:expression==='speaking'});
    assert.ok(out.every(Number.isFinite),expression+' gerou valor inválido');
    assert.ok(pose.mouth>=0&&pose.mouth<=1);
    assert.equal(out.length,468*3);
  }
  assert.deepEqual(Array.from(vertices),Array.from(original));
});

test('V4.4: abertura labial acompanha amplitude e afasta lábios sem rasgar a malha',()=>{
  const idle=poseAt('neutral');
  const voiced=poseAt('speaking',{speaking:true,audioDriven:true,audioLevel:.88});
  const baseline=y(idle.output,13)-y(idle.output,14);
  const open=y(voiced.output,13)-y(voiced.output,14);
  assert.ok(open>baseline+.14, 'lábios não abriram ao receber áudio');
  assert.ok(voiced.pose.mouth>.6);
  const silent=poseAt('listening',{audioDriven:true,audioLevel:0,speaking:false});
  assert.ok(silent.pose.mouth<.015);
});

test('V4.4: sorriso, atenção e pensamento produzem movimentos distintos',()=>{
  const idle=poseAt('neutral');
  const happy=poseAt('happy');
  const attentive=poseAt('listening');
  const thought=poseAt('thinking');
  assert.ok(happy.pose.smile>.95);
  assert.ok(attentive.pose.attention>.95);
  assert.ok(thought.pose.thinking>.95);
  assert.ok(y(happy.output,61)>y(idle.output,61), 'canto esquerdo não subiu no sorriso');
});

test('V4.4: transição labial suave e recuperação após silêncio',()=>{
  const rig=createFacialRig(vertices);
  const out=new Float32Array(vertices.length);
  for(let i=0;i<10;i++) rig.updateInto(out,{time:i/30,delta:1/30,expression:'listening'});
  const start=rig.getPose().mouth;
  rig.updateInto(out,{time:2,delta:1/30,expression:'speaking',speaking:true,audioDriven:true,audioLevel:1});
  const first=rig.getPose().mouth;
  assert.ok(first>start&&first<.9,'abertura deveria ser interpolada');
  for(let i=0;i<25;i++) rig.updateInto(out,{time:2+i/30,delta:1/30,expression:'speaking',speaking:true,audioDriven:true,audioLevel:1});
  const peak=rig.getPose().mouth;
  assert.ok(peak>first);
  for(let i=0;i<35;i++) rig.updateInto(out,{time:3+i/30,delta:1/30,expression:'listening',speaking:false,audioDriven:true,audioLevel:0});
  assert.ok(rig.getPose().mouth<.05,'boca ficou presa em fala');
});

test('V4.4: progresso real de carregamento, renderer e indicadores presentes',async()=>{
  const [source,html,app,css]=await Promise.all([
    fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8'),
    fs.readFile(path.join(root,'public/index.html'),'utf8'),
    fs.readFile(path.join(root,'public/app.js'),'utf8'),
    fs.readFile(path.join(root,'public/style.css'),'utf8')
  ]);
  assert.ok(source.includes('createFacialRig(vertices)'));
  assert.match(source,/progress\(100,'Rosto V4\.[45] pronto'\)/);
  assert.match(source,/version:'4\.[45]-/);
  assert.ok(source.includes("avatar.dataset.remoteTurnActive!=='true'"),'preservar prioridade celular MCP');
  assert.ok(html.includes('id="renderProgressBar"'));
  assert.ok(html.includes('id="renderProgressNumber"'));
  assert.ok(app.includes("window.addEventListener('jarvis-render-progress'"));
  assert.ok(css.includes('.render-load progress'));
});
