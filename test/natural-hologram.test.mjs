import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {createFacialSurfacePlan} from '../src/client/facial-surface.js';
import {naturalHeadAt} from '../src/client/natural-head-motion.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const model=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const vertices=new Float32Array(model.vertices.flat());
const triangles=new Uint16Array(model.triangles.flat());

test('V5: superficie organica refina a malha humana sem quebrar topologia original',()=>{
  const old=new Float32Array(vertices);
  const plan=createFacialSurfacePlan(vertices,triangles);
  const stat=plan.getStats();
  assert.equal(stat.sourceVertices,468);
  assert.equal(stat.triangles,model.triangles.length*4);
  assert.ok(stat.vertices>468&&stat.vertices<3200);
  assert.ok(stat.smoothness>.5&&stat.smoothness<.7);
  assert.ok(Array.from(plan.indices).every(i=>i<stat.vertices));
  assert.ok([...plan.positions].every(Number.isFinite));
  assert.deepEqual(vertices,old,'entrada precisa ser imutavel');
  assert.ok(plan.positions.some((v,i)=>i<vertices.length&&Math.abs(v-vertices[i])>.0001),'afinamento perceptivel');
});

test('V5: movimentos faciais atualizam a superficie com limites e custo reduzido',()=>{
  const plan=createFacialSurfacePlan(vertices,triangles);
  const before=plan.positions[17*3+2];
  const changed=new Float32Array(vertices);
  changed[17*3+2]+=.28;
  changed[61*3+1]+=.27;
  const start=performance.now();
  for(let i=0;i<90;i++)plan.update(changed);
  const elapsed=performance.now()-start;
  assert.ok(elapsed<2500,'Loop refinement deveria ser leve: '+elapsed);
  assert.notEqual(plan.positions[17*3+2],before);
  assert.ok(plan.positions.every(Number.isFinite));
  assert.ok(Math.max(...plan.positions)<19&&Math.min(...plan.positions)>-19);
  assert.deepEqual(vertices,new Float32Array(model.vertices.flat()));
});

test('V5: movimento natural da cabeca segue olhar, intencao e reducao de movimento',()=>{
  const neutral=naturalHeadAt(6,{gaze:0,thinking:0});
  const focus=naturalHeadAt(6,{gaze:.10,thinking:.8});
  assert.ok(focus.yaw>neutral.yaw);
  assert.ok(focus.pitch<neutral.pitch);
  for(let t=0;t<60;t+=.19){
    const p=naturalHeadAt(t,{gaze:.12,thinking:.7,surprise:.5,smile:.6,speechAccent:.9});
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(Math.abs(p.yaw)<.20&&Math.abs(p.pitch)<.09&&Math.abs(p.roll)<.04&&Math.abs(p.y)<.06);
  }
  assert.deepEqual(naturalHeadAt(6,{},true),{yaw:.055,pitch:0,roll:0,y:0});
});

test('V5: renderer usa luz e camada orgânica, controle de comparacao e limpeza de GPU',async()=>{
  const [face,html,app,css,finish]=await Promise.all([
    fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8'),
    fs.readFile(path.join(root,'public/index.html'),'utf8'),
    fs.readFile(path.join(root,'public/app.js'),'utf8'),
    fs.readFile(path.join(root,'public/style.css'),'utf8'),
    fs.readFile(path.join(root,'src/client/face-v4-finishing.js'),'utf8')
  ]);
  assert.match(face,/createFacialSurfacePlan/);
  assert.match(face,/new THREE\.MeshStandardMaterial/);
  assert.match(face,/new THREE\.HemisphereLight/);
  assert.match(face,/skinPlan\.update\(working\)/);
  assert.match(face,/skinGeometry\.computeVertexNormals\(\)/);
  assert.match(face,/skinGeometry\.dispose\(\)/);
  assert.match(face,/naturalHeadAt\(t,pose,motion\.matches\)/);
  assert.match(html,/id="naturalFaceButton"/);
  assert.match(app,/setNaturalFace/);
  assert.match(app,/jarvis-natural-hologram/);
  assert.match(css,/natural-face-toggle/);
  assert.match(finish,/new THREE\.SphereGeometry\(\.52/);
  assert.match(finish,/new THREE\.CircleGeometry\(\.135/);
});
