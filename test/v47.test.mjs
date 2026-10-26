import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {blinkAt,gazeAt} from '../src/client/face-v4-dynamics.js';
import {createFacialRig} from '../src/client/face-v4-rig.js';
import {createFacialFinishing} from '../src/client/face-v4-finishing.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mesh=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const original=new Float32Array(mesh.vertices.flat());

test('V4.7: olhar mantém posições, muda suavemente e não atravessa as órbitas',()=>{
  assert.deepEqual(gazeAt(0,'listening'),{x:0,y:0});
  const before=gazeAt(3.35,'listening');
  const during=gazeAt(3.52,'listening');
  const after=gazeAt(3.71,'listening');
  assert.ok(Math.abs(before.x)<.002,'look should start at previous anchor');
  assert.ok(during.x>before.x && during.x<after.x);
  assert.ok(after.x>.08);
  for(let time=0;time<=80;time+=.07){
    const {x,y}=gazeAt(time,'listening');
    assert.ok(Number.isFinite(x)&&Number.isFinite(y));
    assert.ok(Math.abs(x)<.11&&Math.abs(y)<.045);
  }
  const limit=Math.abs(gazeAt(3.8,'alert').x);
  assert.ok(limit<Math.abs(gazeAt(3.8,'listening').x));
});

test('V4.7: piscar variável, com intervalo silencioso e sem oscilações rápidas constantes',()=>{
  assert.equal(blinkAt(0),0);
  assert.ok(blinkAt(2.7)>.95);
  assert.equal(blinkAt(4),0);
  assert.ok(blinkAt(7.45)>.95);
  assert.ok(blinkAt(18.48)>.55);
  assert.equal(blinkAt(100,true),0);
  for(let time=0;time<=100;time+=.031){
    const v=blinkAt(time);
    assert.ok(v>=0&&v<=1);
  }
});

test('V4.7: redução de movimento suprime deslocamentos oculares e piscadas',()=>{
  for(const exp of ['neutral','listening','speaking','thinking','alert']){
    assert.deepEqual(gazeAt(15.1,exp,true),{x:0,y:0});
    assert.equal(blinkAt(15.1,true),0);
  }
});

test('V4.7: bochechas e sobrancelhas respondem à fala e relaxam no silêncio',()=>{
  const rig=createFacialRig(original);
  const work=new Float32Array(original.length);
  const lipGap=a=>a[13*3+1]-a[14*3+1];
  for(let i=0;i<45;i++) rig.updateInto(work,{time:10+i/30,delta:1/30,
    expression:'speaking',speaking:true,audioDriven:true,audioLevel:.84});
  const talk=rig.getPose();
  assert.ok(talk.speechAccent>.52);
  assert.ok(talk.mouth>.7);
  assert.ok(lipGap(work)>.5);
  for(let i=0;i<45;i++) rig.updateInto(work,{time:12+i/30,delta:1/30,
    expression:'listening',speaking:false,audioDriven:true,audioLevel:0});
  const idle=rig.getPose();
  assert.ok(idle.speechAccent<.01);
  assert.ok(idle.mouth<.01);
  assert.ok(lipGap(work)<.3);
  assert.ok(work.every(Number.isFinite));
});

test('V4.7: luz orbital suavizada e desmontagem sem vazamento',()=>{
  const rootGroup=new THREE.Group();
  const finish=createFacialFinishing(THREE,rootGroup,original);
  const glows=rootGroup.children.filter(item=>item.isMesh&&item.geometry.type==='CircleGeometry');
  assert.equal(glows.length,2);
  const mat=glows[0].material;
  finish.update({working:original,attention:0,speechAccent:0,reducedMotion:true});
  const a=mat.opacity;
  finish.update({working:original,attention:1,speechAccent:.8,reducedMotion:true});
  assert.ok(mat.opacity>a+.04);
  finish.dispose();
  assert.equal(rootGroup.children.length,0);
});

test('V4.8: compilação e interface usam mesma versão e mantêm prioridade MCP',async()=>{
  const [source,html,app]=await Promise.all([
    fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8'),
    fs.readFile(path.join(root,'public/index.html'),'utf8'),
    fs.readFile(path.join(root,'public/app.js'),'utf8')
  ]);
  assert.match(source,/version:'4\.8-expressive-dual'/);
  assert.match(source,/progress\(100,'Rosto V4\.8 pronto'\)/);
  assert.ok(source.includes('speechAccent:pose.speechAccent'));
  assert.ok(source.includes("avatar.dataset.remoteTurnActive!=='true'"));
  assert.ok(html.includes('SYNTH-FACE · V4.8'));
  assert.ok(app.includes('SYNTH-FACE · V4.8'));
  assert.ok(html.includes('id="renderProgressNumber"'));
  assert.equal(Buffer.from(html).includes(Buffer.from([0])),false);
});

test('V4.7: iniciador LAN usa IP privado dinâmico e não altera firewall',async()=>{
  const [script,batch,viewer]=await Promise.all([
    fs.readFile(path.join(root,'scripts/start-lan-viewer.ps1'),'utf8'),
    fs.readFile(path.join(root,'iniciar-jarvis-rede.bat'),'utf8'),
    fs.readFile(path.join(root,'src/lan-viewer.mjs'),'utf8')
  ]);
  assert.match(script,/Get-NetIPConfiguration/);
  assert.match(script,/NetworkCategory/);
  assert.match(script,/192\\.168\\./);
  assert.doesNotMatch(script,/192\\.168\\.1\\.65/);
  assert.doesNotMatch(script,/New-NetFirewallRule|Set-NetFirewallProfile|netsh\\s+advfirewall/i);
  assert.ok(batch.includes('start-lan-viewer.ps1'));
  assert.match(viewer,/req.method!=='GET'/);
  assert.match(viewer,/JARVIS_LAN_HOST/);
  assert.ok(viewer.includes('127.0.0.1'));
});
