/**
 * JARVIS V4 build: convert the MediaPipe canonical face geometry to a compact
 * local asset and bundle Three.js for offline use. No CDN, API key or runtime npm.
 * MediaPipe canonical_face_model.obj is Apache-2.0, attribution in third_party/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const obj=await fs.readFile(path.join(root,'assets/models/mediapipe-canonical-face.obj'),'utf8');
const vertices=[];
const triangles=[];
for (const line of obj.split(/\r?\n/)){
 const t=line.trim();
 if(t.startsWith('v ')){
   const xyz=t.split(/\s+/).slice(1,4).map(Number);
   if(xyz.length!==3||xyz.some(n=>!Number.isFinite(n)))throw Error('OBJ: vertice invalido');
   vertices.push(xyz.map(x=>Math.round(x*10000)/10000));
 } else if(t.startsWith('f ')){
   const ids=t.split(/\s+/).slice(1).map(s=>Number(s.split('/')[0])-1);
   if(ids.length!==3||ids.some(n=>!Number.isInteger(n)||n<0))throw Error('OBJ: triangulo invalido');
   triangles.push(ids);
 }
}
if(vertices.length!==468||triangles.length<800||triangles.some(t=>t.some(i=>i>=vertices.length)))throw Error('OBJ facial inesperado');
const output={source:'Google MediaPipe canonical_face_model.obj',license:'Apache-2.0',
  modified:'Numbers rounded to 4 decimal places; OBJ faces converted to indexed triangles.',
  vertexCount:vertices.length,triangleCount:triangles.length,vertices,triangles};
await fs.mkdir(path.join(root,'public/assets/models'),{recursive:true});
await fs.writeFile(path.join(root,'public/assets/models/canonical-face.json'),JSON.stringify(output));
await build({entryPoints:[path.join(root,'src/client/face-v4.js')],
  outfile:path.join(root,'public/face-v4.bundle.js'),
  bundle:true,format:'esm',platform:'browser',target:'es2022',
  minify:true,legalComments:'inline',sourcemap:false,logLevel:'warning'});
console.log('Face V4 built:',vertices.length,'vertices,',triangles.length,'triangles');
