/**
 * Expressividade por ritmo da fala local.
 * Audio RMS nao revela o conteudo nem o sentimento da conversa.
 * Humores explicitos do MCP/painel SEMPRE prevalecem.
 */
const allowed=new Set(['neutral','happy','alert','surprised','thinking']);
const passThrough=new Set(['speaking','listening','neutral']);

export function createExpressionDirector() {
  let phraseStart=-1;
  let lastSpokenAt=-Infinity;
  let lastCueAt=-Infinity;
  let highStart=-1;
  let cue='speaking';
  let cueUntil=-Infinity;
  let lastLevel=0;
  let lastTime=-Infinity;
  const select=({
    time=0,expression='neutral',mood='neutral',speaking=false,
    audioDriven=false,audioLevel=0,voiceSession=false,reducedMotion=false,
    enabled=true
  }={})=>{
    const t=Number.isFinite(time)?time:0;
    const level=Math.max(0,Math.min(1,Number(audioLevel)||0));
    if(t<lastTime){phraseStart=-1;lastSpokenAt=-Infinity;lastCueAt=-Infinity;highStart=-1;cueUntil=-Infinity;}
    lastTime=t;
    // Intencao comunicada explicitamente pelo assistente ou pelo operador.
    if(allowed.has(mood)&&mood!=='neutral'){lastLevel=level;return mood;}
    if(!enabled||reducedMotion||!voiceSession||!audioDriven||!passThrough.has(expression)){
      lastLevel=level;return expression;
    }
    if(!speaking){
      const gap=t-lastSpokenAt;
      lastLevel=level;
      if(gap>.85) phraseStart=-1;
      highStart=-1;
      return gap>=.17 && gap<.70 ? 'thinking' : 'listening';
    }
    if(phraseStart<0||t-lastSpokenAt>1.05){
      phraseStart=t;
      highStart=-1;
      cueUntil=-Infinity;
    }
    lastSpokenAt=t;
    const elapsed=t-phraseStart;
    if(elapsed<.38){lastLevel=level;return 'thinking';}
    if(level>=.73){
      if(highStart<0) highStart=t;
    }else highStart=-1;
    // Ressalto vocal: surpresa visual breve, sem inferir emocao de conteudo.
    if(level>.87 && level-lastLevel>.22 && elapsed>.9 && t-lastCueAt>7){
      cue='surprised';cueUntil=t+.42;lastCueAt=t;
    }
    // Tom sustentado e forte: concentracao/alerta por menos de meio segundo.
    else if(highStart>=0 && t-highStart>.43 && t-lastCueAt>10 && elapsed>1){
      cue='alert';cueUntil=t+.38;lastCueAt=t;highStart=-1;
    }
    // Ritmo moderado apos uma frase longa: sorriso sutil e ocasional.
    else if(level>.19 && level<.59 && elapsed>2.4 &&
      t-lastCueAt>6 && (Math.sin(t*.9)>.79)){
      cue='happy';cueUntil=t+.62;lastCueAt=t;
    }
    lastLevel=level;
    return t<cueUntil ? cue : 'speaking';
  };
  return {select};
}
