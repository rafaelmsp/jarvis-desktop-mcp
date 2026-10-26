/**
 * Gerador de demo publica estatica do JARVIS.
 * Nao empacota servidor MCP, token, monitores locais ou comunicacao com PC.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.cwd();
const target=path.join(base,'dist-preview');
await fs.rm(target,{recursive:true,force:true});
await fs.cp(path.join(base,'public'),target,{recursive:true});
const read=async file=>fs.readFile(path.join(target,file),'utf8');
const save=async(file,data)=>fs.writeFile(path.join(target,file),data);
const replaceUnique=(source,find,replacement)=>{
  if(source.split(find).length!==2)throw Error('Template desconhecido: '+find);
  return source.replace(find,replacement);
};
let html=await read('index.html');
html=replaceUnique(html,'href="/style.css"','href="style.css"');
html=replaceUnique(html,'<script type="module" src="/app.js"></script>','<script type="module" src="preview.js"></script>');
html=replaceUnique(html,'<script type="module" src="/face-v4.bundle.js"></script>','<script type="module" src="face-v4.bundle.js"></script>');
html=html.replaceAll('href="/assets/','href="assets/').replaceAll('src="/assets/','src="assets/');
html=replaceUnique(html,'<body>','<body class="jarvis-demo">');
html=replaceUnique(html,'<main class="shell">','<main class="shell"><div class="demo-banner" role="status">DEMONSTRAÇÃO PÚBLICA · SEM CONEXÃO COM O COMPUTADOR · SEM MICROFONE</div>');
html=replaceUnique(html,'<h1 id="caption">JARVIS ONLINE</h1>','<h1 id="caption">JARVIS V5.0 · DEMONSTRAÇÃO</h1>');
html=replaceUnique(html,'</head>','<link rel="stylesheet" href="preview.css"></head>');
await save('index.html',html);
let face=await read('face-v4.bundle.js');
face=replaceUnique(face,'"/assets/models/canonical-face.json"','"assets/models/canonical-face.json"');
await save('face-v4.bundle.js',face);
await fs.copyFile(path.join(base,'preview/preview.js'),path.join(target,'preview.js'));
await fs.copyFile(path.join(base,'preview/preview.css'),path.join(target,'preview.css'));
await fs.rm(path.join(target,'app.js'),{force:true});
await fs.rm(path.join(target,'lan-viewer.css'),{force:true});
await fs.writeFile(path.join(target,'.nojekyll'),'');
console.log('JARVIS static preview ready: '+target+' (no backend or control endpoints)');
