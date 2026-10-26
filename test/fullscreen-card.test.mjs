import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=await Promise.all([
  fs.readFile(path.join(root,'public/index.html'),'utf8'),
  fs.readFile(path.join(root,'public/app.js'),'utf8'),
  fs.readFile(path.join(root,'public/style.css'),'utf8')
]);
const [html,app,css]=files;
const start=app.indexOf('// Maximiza somente o card do rosto:');
const end=app.indexOf("if ($('portLabel'))",start);
const snippet=app.slice(start,end);

function setup({blocked=false,unsupported=false}={}){
  const hooks=new Map();
  const classes=()=>{
    const values=new Set();
    return {
      add:name=>values.add(name),
      remove:name=>values.delete(name),
      contains:name=>values.has(name),
      toggle:(name,enabled)=>enabled?values.add(name):values.delete(name)
    };
  };
  const button={
    attributes:new Map(),innerHTML:'',title:'',focused:false,
    setAttribute(key,value){this.attributes.set(key,value);},
    addEventListener(name,handler){hooks.set('button:'+name,handler);},
    focus(){this.focused=true;}
  };
  const faceCard={classList:classes()};
  const document={
    fullscreenElement:null,fullscreenEnabled:!unsupported,
    body:{classList:classes()},
    addEventListener(name,handler){hooks.set('document:'+name,handler);}
  };
  faceCard.requestFullscreen=async()=>{
    if(blocked)throw new Error('fullscreen blocked');
    document.fullscreenElement=faceCard;
    hooks.get('document:fullscreenchange')?.();
  };
  document.exitFullscreen=async()=>{
    document.fullscreenElement=null;
    hooks.get('document:fullscreenchange')?.();
  };
  const context={document,console:{warn:()=>{}},__faceCard:faceCard,__button:button};
  vm.runInNewContext(
    "const $ = id=>id==='jarvisFaceCard'?__faceCard:__button;"+snippet+
    '\nthis.fullscreenApi={toggleFaceFullscreen,syncFaceFullscreenButton};',
    context
  );
  return {document,faceCard,button,hooks,api:context.fullscreenApi};
}
test('card contém botão acessível no próprio rosto, sem criar outra página ou canvas',()=>{
  assert.match(html,/<section class="screen" id="jarvisFaceCard"/);
  assert.match(html,/<button id="faceFullscreenButton"[^>]+aria-label="Maximizar o card do rosto do JARVIS"/);
  const first=html.indexOf('id="jarvisFaceCard"');
  const button=html.indexOf('id="faceFullscreenButton"');
  const viewport=html.indexOf('id="face3dViewport"');
  assert.ok(first<button&&button<viewport);
  assert.match(snippet,/requestFullscreen/);
  assert.match(snippet,/exitFullscreen/);
  assert.doesNotMatch(snippet,/replaceChildren|new THREE|set_audio_sync|set_voice_session|reset/);
});
test('botão maximiza card via Fullscreen API e restaura sem destruir o canvas',async()=>{
  const {api,document,faceCard,button}=setup();
  await api.toggleFaceFullscreen();
  assert.equal(document.fullscreenElement,faceCard);
  assert.equal(button.attributes.get('aria-pressed'),'true');
  assert.match(button.innerHTML,/Restaurar/);
  assert.equal(document.body.classList.contains('jarvis-face-expanded'),true);
  await api.toggleFaceFullscreen();
  assert.equal(document.fullscreenElement,null);
  assert.equal(button.attributes.get('aria-pressed'),'false');
  assert.match(button.innerHTML,/Maximizar/);
  assert.equal(document.body.classList.contains('jarvis-face-expanded'),false);
});
test('Esc recupera tela quando Fullscreen API for bloqueada',async()=>{
  const {api,hooks,faceCard,button,document}=setup({blocked:true});
  await api.toggleFaceFullscreen();
  assert.equal(faceCard.classList.contains('screen-expanded'),true);
  assert.equal(button.attributes.get('aria-pressed'),'true');
  hooks.get('document:keydown')({key:'Escape'});
  assert.equal(faceCard.classList.contains('screen-expanded'),false);
  assert.equal(button.focused,true);
  assert.equal(document.body.classList.contains('jarvis-face-expanded'),false);
});
test('sem API de fullscreen, mantém controle acessível e expansão reversível',async()=>{
  const {api,faceCard,button}=setup({unsupported:true});
  await api.toggleFaceFullscreen();
  assert.equal(faceCard.classList.contains('screen-expanded'),true);
  await api.toggleFaceFullscreen();
  assert.equal(faceCard.classList.contains('screen-expanded'),false);
  assert.equal(button.attributes.get('aria-pressed'),'false');
});
test('layout expande WebGL conforme viewport e respeita telas pequenas',()=>{
  assert.match(css,/\.screen:fullscreen,\.screen\.screen-expanded/);
  assert.match(css,/\.screen:fullscreen \.avatar\.face/);
  assert.match(css,/--jarvis-max-face:min\(78vw,60vh,810px\)/);
  assert.match(css,/max-width:600px/);
  assert.match(css,/max-height:470px/);
  assert.match(css,/\.face-fullscreen-button:focus-visible/);
  assert.match(snippet,/fullscreenchange/);
});
