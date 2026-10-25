const $ = id => document.getElementById(id);
const avatar = $('avatar');
const audioValue = $('audioValue');
const bars = Array.from({length:25},()=>{
  const bar = document.createElement('span');
  $('wave').append(bar);
  return bar;
});
let current = {mode:'face',expression:'neutral',status:'idle',speaking:false,audioLevel:0,caption:'JARVIS ONLINE'};
let micEnabled = false;
let stream = null;
let audioContext = null;
let analyser = null;
let tick = 0;
let micLevel = 0;
let voiceEnabled = false;
let lastCaption = null;
let localSpeaking = false;
const synth = window.speechSynthesis;
function updateVoiceInfo(message) { $('voiceInfo').textContent = message; }
function speakLocal(text) {
  if (!voiceEnabled || !synth || !text.trim()) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1;
  utterance.pitch = 0.95;
  const choices = synth.getVoices();
  utterance.voice = choices.find(v => v.lang.toLowerCase() === 'pt-br') || choices.find(v => v.lang.toLowerCase().startsWith('pt')) || null;
  utterance.onstart = () => {
    localSpeaking = true;
    avatar.dataset.speaking = 'true';
    $('activity').textContent = 'RESPONDENDO POR VOZ';
    updateVoiceInfo('Falando...');
  };
  const finish = () => {
    localSpeaking = false;
    avatar.dataset.speaking = String(Boolean(current.speaking || current.status === 'speaking'));
    $('activity').textContent = labels[current.status] || 'SISTEMA EM ESPERA';
    updateVoiceInfo('Voz local pronta');
  };
  utterance.onend = finish;
  utterance.onerror = event => { finish(); if (event.error !== 'interrupted' && event.error !== 'canceled') updateVoiceInfo('Erro de voz: ' + event.error); };
  synth.speak(utterance);
}

const labels={idle:'SISTEMA EM ESPERA',listening:'ESCUTANDO',processing:'PROCESSANDO',speaking:'TRANSMITINDO',success:'OPERAÇÃO CONCLUÍDA',error:'ALERTA DO SISTEMA'};
function apply(state) {
  const changedCaption = lastCaption !== null && state.caption !== lastCaption;
  lastCaption = state.caption;
  current=state;
  avatar.classList.toggle('face',state.mode==='face');
  avatar.classList.toggle('core',state.mode==='core');
  avatar.dataset.expression=state.expression;
  avatar.dataset.speaking=String(Boolean(state.speaking || state.status==='speaking' || localSpeaking));
  $('caption').textContent=state.caption;
  $('activity').textContent=labels[state.status] || 'JARVIS ONLINE';
  $('renderStatus').textContent=state.status.toUpperCase();
  $('modeLabel').textContent=state.mode==='core'?'CORE · V1':'WIREGRID · V2';
  $('updated').textContent=new Date(state.lastEventAt).toLocaleTimeString('pt-BR');
  document.body.classList.toggle('alert',state.expression==='alert'||state.status==='error');
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
  document.querySelectorAll('[data-expression]').forEach(b=>b.classList.toggle('active',b.dataset.expression===state.expression));
  if (changedCaption) speakLocal(state.caption);
}
async function control(action,value) {
  try {
    const response=await fetch('/api/manual',{method:'POST',headers:{'Content-Type':'application/json','X-Jarvis-UI':'1'},body:JSON.stringify({action,value})});
    if (!response.ok) throw Error((await response.json()).error || 'Falha de controle');
    apply((await response.json()).state);
  } catch(e) {console.warn('Jarvis:',e.message);}
}
for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click',()=>control('set_mode',b.dataset.mode));
for (const b of document.querySelectorAll('[data-expression]')) b.addEventListener('click',()=>control('set_expression',b.dataset.expression));
function connection(ok) {$('connectionDot').parentElement.classList.toggle('connected',ok);$('connectionText').textContent=ok?'PAINEL LOCAL · ATIVO':'PAINEL SEM CONEXÃO';}
const events=new EventSource('/api/events');
events.onopen=()=>connection(true);
events.onmessage=ev=>{try{apply(JSON.parse(ev.data));}catch(e){console.warn(e);}};
events.onerror=()=>connection(false);
async function toggleMic() {
  const button=$('micButton');
  if(micEnabled) {
    micEnabled=false;stream?.getTracks().forEach(t=>t.stop());stream=null;
    await audioContext?.close();audioContext=null;analyser=null;micLevel=0;
    button.textContent='♬ Ativar microfone';button.classList.remove('active');return;
  }
  try {
    stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    audioContext=new (window.AudioContext||window.webkitAudioContext)();
    const source=audioContext.createMediaStreamSource(stream);
    analyser=audioContext.createAnalyser();analyser.fftSize=512;source.connect(analyser);
    micEnabled=true;button.textContent='◉ Microfone ativo';button.classList.add('active');
  } catch(e) {button.textContent='Microfone indisponível';console.warn('Permissão:',e);}
}
$('micButton').addEventListener('click',toggleMic);
$('voiceButton').addEventListener('click', () => {
  if (!synth) { updateVoiceInfo('Síntese de voz indisponível neste navegador'); return; }
  voiceEnabled = !voiceEnabled;
  $('voiceButton').classList.toggle('active',voiceEnabled);
  $('voiceButton').setAttribute('aria-pressed',String(voiceEnabled));
  $('voiceButton').textContent = voiceEnabled ? '🔊 Voz local ativa' : '🔇 Ativar voz local';
  if (voiceEnabled) speakLocal('Voz local ativada.');
  else {synth.cancel();localSpeaking = false;avatar.dataset.speaking = String(Boolean(current.speaking));updateVoiceInfo('Voz desativada');}
});
$('testVoice').addEventListener('click', async () => {
  const phrase = $('testText').value.trim();
  if (!phrase) return;
  if (!voiceEnabled) { updateVoiceInfo('Ative a voz local primeiro'); return; }
  if (phrase === current.caption) speakLocal(phrase);
  else await control('set_caption',phrase);
});

function animate() {
  tick+=.1;
  if(micEnabled&&analyser){
    const buffer=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(buffer);
    const rms=Math.sqrt(buffer.reduce((sum,n)=>sum+(n-128)**2,0)/buffer.length)/64;
    micLevel=Math.max(0,Math.min(1,rms*2.2));
  }
  const level=Math.max(micLevel,current.audioLevel||0,current.speaking?.4:0);
  audioValue.textContent=Math.round(level*100)+'%';
  $('aura').style.setProperty('--level',level.toFixed(2));
  bars.forEach((b,i)=>{
    const wave=Math.sin(tick*1.8+i*.56)*Math.cos(tick*.6-i*.3);
    b.style.setProperty('--height',Math.max(4,6+(wave+1)*12*level+(current.speaking?7:0))+'px');
  });
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


/* SYNTH-FACE: anatomically shaped, animated 3D triangulated wireframe.
 * Procedural Canvas, no external assets, camera or paid API required.
 * Visual state is driven by the same avatar data attributes as the MCP UI.
 */
(function startSynthFace() {
  const surface = document.getElementById('wireframeFace');
  const context = surface?.getContext('2d', { alpha: true });
  if (!surface || !context) return;
  const C = context;
  const profile = [
    [-1.05,.36],[-.96,.55],[-.83,.67],[-.68,.75],[-.52,.80],
    [-.36,.83],[-.20,.85],[-.04,.86],[.12,.84],[.28,.80],
    [.44,.75],[.59,.67],[.73,.58],[.86,.46],[.97,.31],[1.04,.12]
  ];
  const columns = 20;
  const TWO_PI = Math.PI * 2;
  const gaussian = (v,width) => Math.exp(-(v*v)/(width*width));
  let last = 0;

  function outline(points, color, width=1, glow=0, closed=false) {
    if (points.length < 2) return;
    C.beginPath();
    C.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++) C.lineTo(points[i].x,points[i].y);
    if(closed) C.closePath();
    C.strokeStyle=color;
    C.lineWidth=width;
    C.shadowColor='#42daff';
    C.shadowBlur=glow;
    C.stroke();
    C.shadowBlur=0;
  }
  function ellipse3D(project,cx,cy,rx,ry,depth,count=24) {
    const coords=[];
    for(let k=0;k<=count;k++){
      const a=k*TWO_PI/count;
      coords.push(project(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,depth));
    }
    return coords;
  }
  function headDepth(x,y) {
    // Nose projection, recessed eye sockets, cheekbones and lip volume.
    const nose=.40*gaussian(x,.20)*gaussian(y-.24,.32);
    const socket=-.14*(gaussian(x-.37,.23)+gaussian(x+.37,.23))*gaussian(y+.20,.19);
    const cheeks=.105*(gaussian(x-.54,.28)+gaussian(x+.54,.28))*gaussian(y-.23,.29);
    const lips=.10*gaussian(x,.31)*gaussian(y-.62,.11);
    return .30+nose+socket+cheeks+lips;
  }
  function render(timestamp) {
    requestAnimationFrame(render);
    if(timestamp-last<30) return;
    last=timestamp;
    if(!avatar.classList.contains('face')) return;
    const bounds=surface.getBoundingClientRect();
    if(bounds.width < 5 || bounds.height < 5) return;
    const dpr=Math.min(window.devicePixelRatio || 1,2);
    const w=Math.round(bounds.width),h=Math.round(bounds.height);
    if(surface.width!==Math.round(w*dpr) || surface.height!==Math.round(h*dpr)){
      surface.width=Math.round(w*dpr);
      surface.height=Math.round(h*dpr);
    }
    C.setTransform(dpr,0,0,dpr,0,0);
    C.clearRect(0,0,w,h);

    const t=timestamp*.001;
    const expression=avatar.dataset.expression || 'neutral';
    const talking=avatar.dataset.speaking==='true';
    const yaw=-.18+Math.sin(t*.42)*.055;
    const tilt=(expression==='thinking' ? -.035 : 0)+Math.sin(t*.35)*.014;
    const size=Math.min(w*.46,h*.352);
    const ox=w*.50,oy=h*.435+Math.sin(t*.82)*2.5;
    function project(x,y,z=.4){
      const spinX=x*Math.cos(yaw)+z*Math.sin(yaw);
      const depth=z*Math.cos(yaw)-x*Math.sin(yaw);
      const elevation=y*Math.cos(tilt)-spinX*Math.sin(tilt);
      const lateral=y*Math.sin(tilt)+spinX*Math.cos(tilt);
      const perspective=1+.07*depth;
      return {x:ox+lateral*size*perspective,y:oy+elevation*size*perspective,z:depth};
    }

    // Particles are fixed in their orbits; positions evolve smoothly over time.
    for(let i=0;i<23;i++){
      const angle=(i*2.39996)+t*(i%2?-.09:.07);
      const radius=size*(1.06+(i%6)*.078);
      const px=ox+Math.cos(angle)*radius*.95;
      const py=oy+Math.sin(angle)*radius*.91;
      const radiusDot=i%7===0?2.15:.85;
      C.beginPath();C.arc(px,py,radiusDot,0,TWO_PI);
      C.fillStyle=i%7===0?'rgba(91,240,255,.77)':'rgba(46,175,234,.30)';
      C.shadowColor='#33dcff';C.shadowBlur=i%7===0?11:2;C.fill();
    }
    C.shadowBlur=0;

    // Cross-sectional rings describe forehead, temple, cheeks, jaw and chin.
    const mesh=profile.map(([y,halfWidth],row)=>Array.from({length:columns+1},(_,col)=>{
      const a=-Math.PI/2+col*Math.PI/columns;
      const x=Math.sin(a)*halfWidth;
      let depth=headDepth(x,y)*Math.max(.06,Math.cos(a));
      depth+=.05*Math.cos(a);
      // Mostly regular with subtle asymmetry, closer to scanned topology.
      return project(x,y,depth);
    }));

    C.save();
    C.globalCompositeOperation='screen';
    // Shade facets so the triangular grid has depth without a solid face.
    for(let r=0;r<mesh.length-1;r++){
      for(let c=0;c<columns;c++){
        const q=[mesh[r][c],mesh[r][c+1],mesh[r+1][c],mesh[r+1][c+1]];
        if((r+c)%5===0){
          C.beginPath();C.moveTo(q[0].x,q[0].y);C.lineTo(q[1].x,q[1].y);
          C.lineTo(q[2].x,q[2].y);C.closePath();
          C.fillStyle='rgba(34,141,203,.022)';C.fill();
        }
        const diagonal=((r+c)%2===0) ? [q[0],q[3]]:[q[1],q[2]];
        outline(diagonal,'rgba(64,197,249,.34)',.62);
      }
    }
    for(let r=0;r<mesh.length;r++) outline(mesh[r],r%3===0?'rgba(99,222,255,.55)':'rgba(55,177,228,.35)',r%3===0?1.08:.65);
    for(let c=0;c<=columns;c++) outline(mesh.map(row=>row[c]),c%4===0?'rgba(97,223,255,.54)':'rgba(51,169,228,.30)',c%4===0?.98:.64);

    // Silhouette and chin ridge emphasize actual facial volume.
    outline(mesh.map(row=>row[0]),'rgba(126,242,255,.84)',1.6,6);
    outline(mesh.map(row=>row[columns]),'rgba(126,242,255,.84)',1.6,6);
    outline(mesh[0],'rgba(99,231,255,.65)',1.2,4);
    outline(mesh[mesh.length-1],'rgba(131,243,255,.72)',1.1,5);
    for(let r=1;r<mesh.length-1;r++){
      for(let c=1;c<columns;c++){
        if((r*11+c*7)%9!==0) continue;
        const v=mesh[r][c],light=(r+c)%4===0;
        C.beginPath();C.arc(v.x,v.y,light?1.95:1.1,0,TWO_PI);
        C.fillStyle=light?'rgba(180,252,255,.91)':'rgba(78,217,255,.66)';
        C.shadowColor='#4beaff';C.shadowBlur=light?12:4;C.fill();
      }
    }
    C.shadowBlur=0;

    // Ears are individual contour meshes, connected to the temple.
    for(const side of [-1,1]){
      const earCenter=project(side*.89,-.04,.04);
      outline(ellipse3D(project,side*.89,-.035,.115,.23,.075),
        'rgba(117,233,255,.80)',1.15,4);
      outline(ellipse3D(project,side*.89,-.015,.055,.145,.105),
        'rgba(64,185,245,.58)',.7);
      const earRim=[
        project(side*.80,-.16,.11),project(side*.95,-.09,.08),
        project(side*.91,.10,.10),project(side*.78,.14,.12)
      ];
      outline(earRim,'rgba(97,219,255,.55)',.7);
      C.beginPath();C.arc(earCenter.x,earCenter.y,1.1,0,TWO_PI);
      C.fillStyle='#b2faff';C.fill();
    }

    // Eye sockets are modeled in the mesh; explicit rings give readable expression.
    for(const side of [-1,1]){
      const cx=side*.37;
      const narrow=expression==='happy' ? .048 : expression==='listening' ? .09 : .075;
      outline(ellipse3D(project,cx,-.20,.195,narrow,.58),
        'rgba(154,244,255,.91)',1.35,8);
      outline([project(cx-side*.21,-.16,.63),project(cx-side*.10,-.35+(expression==='thinking'&&side>0?-.06:0),.62),
        project(cx+side*.11,-.36,.59),project(cx+side*.20,-.30,.51)],
        expression==='alert'?'rgba(255,203,114,.93)':'rgba(107,217,255,.75)',1.25,5);
      const iris=project(cx,-.20,.62);
      C.beginPath();C.arc(iris.x,iris.y,2.9,0,TWO_PI);
      C.fillStyle='rgba(185,252,255,.94)';C.shadowColor='#8fefff';C.shadowBlur=10;C.fill();
      C.shadowBlur=0;
    }

    // Nose: bridge, tip and nostrils rise out of the projected face.
    outline([project(0,-.23,.62),project(-.025,.02,.78),project(.015,.24,.89),
      project(-.09,.34,.79),project(0,.375,.90),project(.12,.34,.79)],
      'rgba(131,235,255,.89)',1.2,6);
    outline([project(-.20,.34,.64),project(-.075,.38,.83),project(.07,.38,.84),
      project(.20,.34,.64)],'rgba(90,214,255,.70)',.9,2);

    // Lips: the same expression flags drive smiling, thinking and speech.
    if(expression==='surprised'&&!talking){
      outline(ellipse3D(project,0,.625,.105,.15,.67),
        'rgba(184,251,255,.95)',1.55,10);
    } else if(talking) {
      const mouthOpen=.07+.11*(.5+.5*Math.sin(t*16));
      outline(ellipse3D(project,0,.625,.245,mouthOpen,.66),
        'rgba(178,249,255,.95)',1.65,9);
    } else {
      const happy=expression==='happy';
      const upper=[
        project(-.27,happy?.57:.62,.60),project(-.16,happy?.61:.625,.67),
        project(-.045,happy?.645:.61,.73),project(0,happy?.63:.625,.77),
        project(.045,happy?.645:.61,.73),project(.16,happy?.61:.625,.67),
        project(.27,happy?.57:.62,.60)
      ];
      const lower=[
        project(-.27,happy?.57:.62,.59),project(-.15,happy?.66:.67,.65),
        project(0,happy?.70:.695,.71),project(.15,happy?.66:.67,.65),
        project(.27,happy?.57:.62,.59)
      ];
      outline(upper,'rgba(186,250,255,.97)',1.5,8);
      outline(lower,'rgba(94,219,255,.68)',1,3);
    }

    // Jaw to collar: an open network instead of a solid bust.
    const neckLeft=project(-.29,.90,.14),neckRight=project(.29,.90,.14);
    const bottomLeft=project(-.42,1.53,.10),bottomRight=project(.42,1.53,.10);
    const center=project(0,1.42,.26);
    outline([neckLeft,project(-.31,1.15,.18),bottomLeft],'rgba(71,205,248,.57)',.9,3);
    outline([neckRight,project(.31,1.15,.18),bottomRight],'rgba(71,205,248,.57)',.9,3);
    outline([neckLeft,center,neckRight],'rgba(57,162,216,.42)',.7);
    outline([bottomLeft,center,bottomRight],'rgba(61,177,222,.35)',.7);

    // Scan reticle / diagnostic bracket; independent of audio permissions.
    const active=expression==='alert';
    const color=active?'rgba(253,198,94,.67)':'rgba(82,218,246,.28)';
    const x1=ox-size*.98,x2=ox+size*.98,y1=oy-size*.95,y2=oy+size*1.12;
    outline([{x:x1,y:y1+13},{x:x1,y:y1},{x:x1+14,y:y1}],color,.9);
    outline([{x:x2-14,y:y2},{x:x2,y:y2},{x:x2,y:y2-13}],color,.9);
    C.restore();
  }
  requestAnimationFrame(render);
})();
