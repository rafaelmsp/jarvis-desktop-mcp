/**
 * JARVIS V4.4 facial rig.
 * Non-destructive deformation of the original 468 MediaPipe landmarks.
 * No extra dependencies and no dependency on audio capture.
 */
export const clamp01 = n => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const gauss = (x,y,cx,cy,sx,sy) =>
  Math.exp(-1.65*(((x-cx)/sx)**2+((y-cy)/sy)**2));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=(start,end,value)=>{
  const t=clamp01((value-start)/(end-start));
  return t*t*(3-2*t);
};

export function createFacialRig(vertices) {
  if (!(vertices instanceof Float32Array) || vertices.length !== 468*3) {
    throw Error('Malha facial inválida: 468 vértices obrigatórios');
  }
  const state={mouth:0, smile:0, attention:0, thinking:0, alert:0, surprise:0, blink:0, gaze:0};
  const pose={...state};

  function updateInto(out,{time=0,delta=1/30,expression='neutral',speaking=false,
    audioDriven=false,audioLevel=0,reducedMotion=false}={}) {
    if (!(out instanceof Float32Array) || out.length!==vertices.length)
      throw Error('Buffer de deformação inválido');
    const d=Math.max(1/240, Math.min(0.2, delta));
    const intensity=clamp01(audioLevel);
    const vocal=audioDriven ? (speaking ? 0.1+0.85*Math.pow(intensity,0.72):0) :
      speaking ? 0.25+0.54*(0.5+0.5*Math.sin(time*13.8)) : 0;
    const targets={
      mouth: Math.max(vocal,expression==='surprised' ? 0.66 : 0),
      smile: expression==='happy' ? 1 : 0,
      attention: expression==='listening' ? 1 : 0,
      thinking: expression==='thinking' ? 1 : 0,
      alert: expression==='alert' ? 1 : 0,
      surprise: expression==='surprised' ? 1 : 0,
      blink: reducedMotion ? 0 : blinkAt(time),
      gaze: reducedMotion ? 0 : Math.sin(time*0.49)*0.055
    };
    for(const key of Object.keys(state)){
      const attack = key==='mouth' ? 0.055 : key==='blink' ? 0.028 : 0.17;
      const release= key==='mouth' ? 0.095 : key==='blink' ? 0.042 : 0.23;
      const tau=targets[key]>state[key] ? attack : release;
      state[key]=mix(state[key],targets[key],1-Math.exp(-d/tau));
    }
    const mouth=state.mouth;
    const attention=state.attention,thought=state.thinking;
    const blink=state.blink,smile=state.smile;
    for(let i=0;i<468;i++){
      const k=i*3,x=vertices[k],y=vertices[k+1],z=vertices[k+2];
      const front=ease(0.7,3.5,z);
      const lip=gauss(x,y,0,-4.33,2.85,0.94)*front;
      const corner=gauss(Math.abs(x),y,2.28,-4.28,0.95,0.85)*front;
      const cheek=gauss(Math.abs(x),y,3.55,-2.5,2.15,2.5)*front;
      const jaw=gauss(x,y,0,-6.05,4.35,3.3)*front;
      const upper=y>=-4.32;
      const eye=gauss(Math.abs(x),y,3.16,2.64,1.58,0.9)*front;
      const brow=gauss(Math.abs(x),y,3.18,3.55,2.05,.78)*front;
      const midline=gauss(x,y,0,2.8,1.8,1.6)*front;
      // Lips part gently, jaw follows. Mouth corners retain natural attachment.
      const centerFactor=1-ease(1.45,3.1,Math.abs(x));
      const lipMotion=mouth*lip*(0.72+0.28*centerFactor);
      const lipDy=upper ? lipMotion*0.34 : -lipMotion*0.49;
      const jawDrop=-mouth*jaw*0.19;
      const smileLift=smile*(corner*.34 + cheek*.07);
      const eyelid=eye*blink*(y>2.64 ? -0.35 : 0.12);
      const focusEye=eye*(attention*0.048-thought*0.055);
      const browMove=brow*(attention*0.13+thought*.09+state.surprise*.32-state.alert*.17);
      out[k]=x + Math.sign(x)*corner*(smile*.12 - mouth*.04);
      out[k+1]=y+lipDy+jawDrop+smileLift+eyelid+focusEye+browMove;
      out[k+2]=z + lipMotion*(upper?0.045:0.085) + cheek*smile*.045+
        midline*(thought*.025);
    }
    Object.assign(pose,state);
    return pose;
  }
  return {updateInto,getPose:()=>({...pose})};
}

// An asymmetrical double blink, with slower human-like recovery.
// Entirely deterministic: no changing mesh topology or random allocations.
function blinkAt(t) {
  const phase=((t+0.75)%6.2+6.2)%6.2;
  const pulse=(at,width)=>Math.max(0,1-Math.abs(phase-at)/width);
  return Math.min(1,pulse(3.31,.145)+pulse(3.55,.095)*.58);
}
