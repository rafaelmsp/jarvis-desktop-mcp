const $ = id => document.getElementById(id);
const avatar = $('avatar');
if ($('portLabel')) $('portLabel').textContent = window.location.port || '80';
const audioValue = $('audioValue');
window.addEventListener('jarvis-render-progress',event=>{
  const percent=Math.max(0,Math.min(100,Number(event.detail?.percent)||0));
  const phase=String(event.detail?.phase||'A iniciar modelo facial');
  if($('renderProgressBar')) $('renderProgressBar').value=percent;
  if($('renderProgressNumber')) $('renderProgressNumber').textContent=Math.round(percent)+'%';
  if($('renderProgressPhase')) $('renderProgressPhase').textContent=phase.toUpperCase();
});
const bars = Array.from({length:25},()=>{
  const bar = document.createElement('span');
  $('wave').append(bar);
  return bar;
});
let current = {mode:'face',expression:'neutral',status:'idle',speaking:false,voiceSession:false,audioLevel:0,caption:'JARVIS ONLINE'};
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
  if (!voiceEnabled || current.voiceSession || !synth || !text.trim()) return;
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
    avatar.dataset.speaking = String(Boolean(current.speaking || current.status === 'speaking' || current.expression === 'speaking'));
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
  avatar.dataset.audioSync=String(Boolean(state.audioSync && state.voiceSession));
  avatar.dataset.remoteTurnActive=String(Boolean(state.remoteTurnActive));
  avatar.dataset.audioLevel=String(state.audioLevel || 0);
  if ($('lipSyncStatus')) $('lipSyncStatus').textContent=state.remoteTurnActive?'EM USO · CELULAR / MCP':state.audioSync?'PC · ÁUDIO WINDOWS ATIVO  |  CELULAR · MCP DISPONÍVEL':'PC · SINCRONISMO DESATIVADO  |  CELULAR · MCP DISPONÍVEL';
  if (state.voiceSession) {
    // No modo visual, desabilitar som e captura locais.
    if (voiceEnabled) {
      voiceEnabled=false; synth?.cancel(); localSpeaking=false;
      $('voiceButton').classList.remove('active');
      $('voiceButton').setAttribute('aria-pressed','false');
      $('voiceButton').textContent='🔇 Ativar voz local';
      updateVoiceInfo('Modo visual sem áudio');
    }
    if (micEnabled) void toggleMic();
  }
  $('voiceSessionButton').classList.toggle('active',Boolean(state.voiceSession));
  $('voiceSessionButton').setAttribute('aria-pressed',String(Boolean(state.voiceSession)));
  $('voiceSessionButton').textContent=state.voiceSession?'◼ Encerrar sessão visual':'◉ Iniciar sessão visual';
  $('voiceSessionStatus').textContent=state.voiceSession?'SESSÃO VISUAL ATIVA · SEM ÁUDIO':'MCP pronto · sem sessão ativa';
  $('micButton').disabled=Boolean(state.voiceSession);
  $('voiceButton').disabled=Boolean(state.voiceSession);
  $('testVoice').disabled=Boolean(state.voiceSession);
  avatar.classList.toggle('face',state.mode==='face');
  avatar.classList.toggle('core',state.mode==='core');
  avatar.dataset.expression=state.expression;
  avatar.dataset.speaking=String(Boolean(state.speaking || state.status==='speaking' || state.expression==='speaking' || localSpeaking));
  $('caption').textContent=state.caption;
  $('activity').textContent=labels[state.status] || 'JARVIS ONLINE';
  $('renderStatus').textContent=state.status.toUpperCase();
  $('modeLabel').textContent=state.mode==='core'?'CORE · V1':'SYNTH-FACE · V4.7';
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
  if(current.voiceSession && !micEnabled){
    updateVoiceInfo('Microfone desativado no modo visual');
    return;
  }
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
$('voiceSessionButton').addEventListener('click',()=>control('set_voice_session',!current.voiceSession));
$('micButton').addEventListener('click',toggleMic);
$('puppetTest').addEventListener('click', () => {
  // Simulação visual local, sem SpeechSynthesis nem microfone.
  control('animate_reply', 12);
});
$('voiceButton').addEventListener('click', () => {
  if (current.voiceSession) { updateVoiceInfo('Voz local desativada no modo visual'); return; }
  if (!synth) { updateVoiceInfo('Síntese de voz indisponível neste navegador'); return; }
  voiceEnabled = !voiceEnabled;
  $('voiceButton').classList.toggle('active',voiceEnabled);
  $('voiceButton').setAttribute('aria-pressed',String(voiceEnabled));
  $('voiceButton').textContent = voiceEnabled ? '🔊 Voz local ativa' : '🔇 Ativar voz local';
  if (voiceEnabled) speakLocal('Voz local ativada.');
  else {synth.cancel();localSpeaking = false;avatar.dataset.speaking = String(Boolean(current.speaking || current.status==='speaking' || current.expression==='speaking'));updateVoiceInfo('Voz desativada');}
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


