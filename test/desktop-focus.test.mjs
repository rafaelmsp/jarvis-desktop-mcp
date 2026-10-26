import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyCommand,initialState} from '../src/state.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('desktop: painel exibe monitor Windows e mantém controles visuais sem voz local', async()=>{
  const html=await fs.readFile(path.join(root,'public/index.html'),'utf8');
  const client=await fs.readFile(path.join(root,'public/app.js'),'utf8');
  const css=await fs.readFile(path.join(root,'public/style.css'),'utf8');
  const profile=await fs.readFile(path.join(root,'docs/perfil-jarvis-rafael.md'),'utf8');
  assert.ok(html.includes('id="desktopAudioStatus"'));
  assert.ok(html.includes('MODO DESKTOP'));
  assert.ok(client.includes("state.audioLevel>=.12") || client.includes("level>=.12"));
  assert.ok(client.includes("state.remoteTurnActive"));
  assert.ok(client.includes("voiceEnabled=false; synth?.cancel(); localSpeaking=false;"));
  assert.ok(css.includes('#desktopAudioStatus[data-active="true"]'));
  assert.ok(profile.includes('Rafael'));
  assert.ok(profile.includes('não altera por si só'));
  const batch=await fs.readFile(path.join(root,'iniciar-jarvis-pc.bat'),'utf8');
  assert.ok(batch.includes('127.0.0.1:3766'));
  assert.ok(batch.includes('start-lipsync.ps1'));
  assert.ok(!batch.includes('3767'), 'inicializador PC não abre a rede LAN');
});
test('desktop: áudio Windows altera a expressão sem comandos móveis',()=>{
  let state=applyCommand(initialState(),{action:'set_voice_session',value:true});
  state=applyCommand(state,{action:'set_audio_sync',value:true});
  state=applyCommand(state,{action:'set_audio_level',value:0.5});
  assert.equal(state.status,'speaking');
  assert.equal(state.remoteTurnActive,false);
  state=applyCommand(state,{action:'set_audio_level',value:0});
  assert.equal(state.status,'listening');
  assert.equal(state.speaking,false);
  assert.equal(state.voiceSession,true);
});
