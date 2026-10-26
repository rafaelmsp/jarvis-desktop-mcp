import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('V4.8: partida manual inicia PC + LAN sem registrar inicializacao no Windows', async()=>{
  const [manual,ensure,diagnostic] = await Promise.all([
    fs.readFile(path.join(root,'iniciar-jarvis-manual.bat'),'utf8'),
    fs.readFile(path.join(root,'scripts/ensure-jarvis.ps1'),'utf8'),
    fs.readFile(path.join(root,'scripts/diagnostico-jarvis.ps1'),'utf8')
  ]);
  assert.match(manual,/ensure-jarvis\.ps1.*-RequireAll/);
  assert.match(manual,/jarvis-voice\.ps1.*-Mode on/);
  assert.match(ensure,/start-lipsync\.ps1/);
  assert.match(ensure,/start-lan-viewer\.ps1/);
  assert.match(diagnostic,/FIREWALL_PRIVADO/);
  assert.match(diagnostic,/INICIO_COM_WINDOWS/);
  assert.doesNotMatch(manual,/schtasks|reg add|runas|jarvis-autostart/i);
  assert.doesNotMatch(ensure,/schtasks|reg add|New-NetFirewallRule|Set-NetFirewallProfile/i);
});
test('V4.8: interface expõe versão atual e continua 3D',async()=>{
  const [html,app,rig,face]=await Promise.all([
    fs.readFile(path.join(root,'public/index.html'),'utf8'),
    fs.readFile(path.join(root,'public/app.js'),'utf8'),
    fs.readFile(path.join(root,'src/client/face-v4-rig.js'),'utf8'),
    fs.readFile(path.join(root,'src/client/face-v4.js'),'utf8')
  ]);
  assert.match(html,/SYNTH-FACE · V4\.9/);
  assert.match(app,/SYNTH-FACE · V4\.9/);
  assert.match(face,/version:'4\.9-expression-director'/);
  assert.match(face,/Rosto V4\.9 pronto/);
  assert.match(rig,/syntheticSpeechAt/);
  assert.match(app,/avatar\.dataset\.mood/);
});
