import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFacialRig} from '../src/client/face-v4-rig.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mesh=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const original=new Float32Array(mesh.vertices.flat());
const component=(arr,i,axis)=>arr[i*3+axis];
function render(expression='neutral',extra={}){
  const rig=createFacialRig(original),working=new Float32Array(original.length);
  for(let i=0;i<50;i++)rig.updateInto(working,{
    time:2+i/30,delta:1/30,expression,...extra
  });
  return {working,pose:rig.getPose()};
}

test('V4.5: nariz, maçãs e queixo têm profundidade anatômica sem modificar a base',()=>{
  const before=Float32Array.from(original);
  const {working}=render();
  assert.ok(component(working,1,2)>component(before,1,2)+.05,'ponta nasal sem relevo');
  assert.ok(component(working,205,2)>component(before,205,2),'maçã esquerda sem relevo');
  assert.ok(component(working,425,2)>component(before,425,2),'maçã direita sem relevo');
  assert.ok(component(working,152,2)>=component(before,152,2),'queixo deformado');
  assert.deepEqual([...original],[...before],'base canônica alterada');
});

test('V4.5: simetria, valores finitos e deslocamentos limitados em todos os estados',()=>{
  for(const expression of ['neutral','listening','thinking','speaking','happy','surprised','alert']){
    const {working}=render(expression,{speaking:expression==='speaking'});
    assert.ok(working.every(Number.isFinite),'coordenadas inválidas: '+expression);
    let largest=0;
    for(let i=0;i<working.length;i++){
      largest=Math.max(largest,Math.abs(working[i]-original[i]));
    }
    assert.ok(largest<1.7,'deformação excessiva: '+expression+' '+largest);
    const left=component(working,205,2)-component(original,205,2);
    const right=component(working,425,2)-component(original,425,2);
    assert.ok(Math.abs(left-right)<.01,'assimetria facial não intencional');
  }
});

test('V4.5: olhos focam e piscam; modo de movimento reduzido elimina micro-oscilação',()=>{
  const listening=render('listening');
  const thinking=render('thinking');
  const idle=render('neutral');
  assert.ok(listening.pose.attention>.95);
  assert.ok(thinking.pose.thinking>.95);
  assert.ok(listening.pose.squint>idle.pose.squint);
  const reduced=render('listening',{reducedMotion:true});
  assert.equal(reduced.pose.blink,0);
  assert.equal(reduced.pose.gaze,0);
  assert.equal(reduced.pose.gazeVertical,0);
});

test('V4.5: áudio alto abre mais os lábios; silêncio encerra a fala',()=>{
  const low=render('speaking',{speaking:true,audioDriven:true,audioLevel:.18});
  const high=render('speaking',{speaking:true,audioDriven:true,audioLevel:.94});
  assert.ok(high.pose.mouth>low.pose.mouth+.35);
  const gap=arr=>component(arr,13,1)-component(arr,14,1);
  assert.ok(gap(high.working)>gap(low.working)+.1);
  const rig=createFacialRig(original),out=new Float32Array(original.length);
  for(let i=0;i<45;i++)rig.updateInto(out,{
    time:i/30,delta:1/30,expression:'speaking',speaking:true,audioDriven:true,audioLevel:.94
  });
  for(let i=0;i<40;i++)rig.updateInto(out,{
    time:2+i/30,delta:1/30,expression:'listening',speaking:false,audioDriven:true,audioLevel:0
  });
  assert.ok(rig.getPose().mouth<.05);
});

test('V4.5: renderizador, barra com porcentagem e LAN compartilham os arquivos atualizados',async()=>{
  const [face,finish,html,app,lan]=await Promise.all([
    fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8'),
    fs.readFile(path.join(root,'src/client/face-v4-finishing.js'),'utf8'),
    fs.readFile(path.join(root,'public/index.html'),'utf8'),
    fs.readFile(path.join(root,'public/app.js'),'utf8'),
    fs.readFile(path.join(root,'src/lan-viewer.mjs'),'utf8')
  ]);
  assert.match(face,/version:'4\.[5678]-/);
  assert.ok(face.includes('gaze:pose.gaze'));
  assert.ok(finish.includes('gazeVertical=0'));
  assert.match(html,/SYNTH-FACE · V4\.[5678]/);
  assert.match(app,/SYNTH-FACE · V4\.[5678]/);
  assert.ok(html.includes('id="renderProgressNumber"'));
  assert.ok(lan.includes("'/face-v4.bundle.js':'face-v4.bundle.js'"));
  assert.ok(lan.includes("'/assets/models/canonical-face.json'"));
});
