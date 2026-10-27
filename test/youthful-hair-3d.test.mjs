import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {createYouthfulHairProfile} from '../src/client/hair-youth-profile.js';
import {createHairFauxDepth} from '../src/client/hair-faux-depth.js';
import {createHairBrowsGrid} from '../src/client/hair-brows-grid.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const canonical=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const vertices=new Float32Array(canonical.vertices.flat());
test('corte juvenil 3D: topete levantado, assimetria e laterais baixas',()=>{
  const before=vertices.slice();
  const p=createYouthfulHairProfile(vertices);
  assert.equal(p.style,'high-upright-spiky-fade');
  const front=p.sample(0,0),raised=p.sample(0,.32),rear=p.sample(0,.92);
  const left=p.sample(-.79,.32),right=p.sample(.79,.32);
  assert.ok(raised[1]>front[1]+1.5,'topete não ganhou volume');
  assert.ok(raised[1]>left[1]+.5&&raised[1]>right[1]+.5,'laterais deveriam ser baixas');
  assert.ok(raised[2]<front[2]-1,'topete precisa ter volume para trás');
  assert.ok(front[1]>8.1,'linha frontal do cabelo não está sobre a testa');
  assert.notEqual(Math.round((p.sample(.3,.5)[0]+p.sample(-.3,.5)[0])*100),0,
    'topete deveria ter orientação assimétrica');
  for(let u=-1;u<=1.01;u+=.1)for(let v=0;v<=1.001;v+=.1)
    assert.ok(p.sample(u,v).every(Number.isFinite));
  for(let i=0;i<10;i++)
    assert.ok(p.filament(-.65+i*.14,.32,i).every(Number.isFinite));
  assert.deepEqual(vertices,before,'a malha original não pode ser alterada');
});
test('falso 3D: 3 planos em Z, sombra, linhas iluminadas e ausência de textura',()=>{
  const root3=new THREE.Group(),p=createYouthfulHairProfile(vertices);
  const fx=createHairFauxDepth(THREE,root3,p.sample);
  assert.equal(fx.getStats().fauxLayers,3);
  assert.equal(fx.getStats().highlightPairs,12);
  assert.equal(fx.getStats().textureFree,true);
  const sheets=['hair-faux-depth-shadow','hair-faux-depth-midtone','hair-faux-depth-cyan-sheen']
    .map(n=>root3.getObjectByName(n));
  assert.ok(sheets.every(x=>x?.isMesh));
  const y=sheets.map(x=>x.geometry.getAttribute('position'));
  assert.ok(y[0].getZ(12)<y[1].getZ(12));
  assert.ok(y[1].getZ(12)<y[2].getZ(12));
  assert.ok(root3.getObjectByName('hair-faux-highlight-0')?.isLine);
  assert.ok(root3.getObjectByName('hair-faux-root-shadow-11')?.isLine);
  const resources=new Set(),disposes=new Set();
  root3.traverse(o=>{
    if(o.geometry)resources.add(o.geometry);
    if(o.material)resources.add(o.material);
    if(o.isMesh||o.isLine)assert.equal(o.material.map,null);
  });
  for(const r of resources)r.addEventListener('dispose',()=>disposes.add(r));
  fx.update({natural:false});
  assert.ok(sheets[0].material.opacity<.20);
  fx.update({natural:true});
  assert.ok(sheets[0].material.opacity>.3);
  fx.dispose();
  assert.equal(root3.children.length,0);
  assert.equal(disposes.size,resources.size,'GPU cleanup failed');
});
test('falso 3D: integrado ao cabelo, às sobrancelhas e à desmontagem',()=>{
  const root3=new THREE.Group(),g=createHairBrowsGrid(THREE,root3,vertices);
  assert.equal(g.getStats().style,'high-upright-spiky-fade');
  assert.equal(g.getStats().youthfulFrontTips,9);
  assert.equal(g.getStats().fauxLayers,3);
  assert.ok(g.getStats().brushedStrands>=35);
  assert.ok(root3.getObjectByName('jarvis-hair-faux-3d'));
  assert.ok(root3.getObjectByName('hair-youthful-front-tip-8'));
  assert.ok(root3.getObjectByName('brow-left-expressive-volume'));
  g.update({working:vertices,natural:false,reducedMotion:true});
  g.update({working:vertices,natural:true,surprise:.9});
  g.dispose();
  assert.equal(root3.children.length,0);
});
