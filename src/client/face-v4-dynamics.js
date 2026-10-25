/**
 * JARVIS V4.7 - deterministic facial timing.
 * No randomness, microphone access, network, timers, or new dependencies.
 * The visual motions are artistic estimates, not semantic understanding.
 */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=t=>t*t*(3-2*t);

const positions=Object.freeze([
  {at:0,x:0,y:0},
  {at:3.35,x:.092,y:.014},
  {at:6.35,x:.025,y:-.006},
  {at:9.7,x:-.102,y:.022},
  {at:13.25,x:-.028,y:-.033},
  {at:16.65,x:.055,y:-.012},
  {at:20.2,x:0,y:0}
]);
const gazeCycle=22.4;

// Only a few irregularly spaced, short blinks in each 29-second cycle.
const blinkEvents=Object.freeze([
  [2.7,.145,1],
  [7.45,.135,1],
  [12.9,.16,1],
  [18.2,.145,1],
  [18.48,.11,.65],
  [24.65,.15,1]
]);
function modulo(t,cycle){
  const v=Number.isFinite(t)?t:0;
  return ((v%cycle)+cycle)%cycle;
}

/**
 * Human-like gaze holding a target for several seconds, then easing toward
 * a new one in 340 ms. Movement remains within the eye socket.
 */
export function gazeAt(time,expression='neutral',reducedMotion=false){
  if(reducedMotion)return {x:0,y:0};
  const phase=modulo(time,gazeCycle);
  let active=0;
  for(let i=1;i<positions.length;i++){
    if(phase>=positions[i].at)active=i;
    else break;
  }
  const target=positions[active];
  const previous=positions[active===0?positions.length-1:active-1];
  const f=active===0?1:smooth(clamp((phase-target.at)/.34,0,1));
  const gain=expression==='listening'?1:
    expression==='speaking'?.88:
    expression==='thinking'?.65:
    expression==='alert'?.20:
    expression==='surprised'?.35:.55;
  return {
    x:(previous.x+(target.x-previous.x)*f)*gain,
    y:(previous.y+(target.y-previous.y)*f)*gain
  };
}

export function blinkAt(time,reducedMotion=false){
  if(reducedMotion)return 0;
  const phase=modulo(time,29);
  let amount=0;
  for(const [at,width,height] of blinkEvents){
    const t=clamp(1-Math.abs(phase-at)/width,0,1);
    amount=Math.max(amount,smooth(t)*height);
  }
  return amount;
}
