export const MODES = ['core', 'face'];
export const EXPRESSIONS = ['neutral', 'happy', 'thinking', 'alert', 'surprised', 'listening', 'speaking'];
export const STATUSES = ['idle', 'listening', 'processing', 'speaking', 'success', 'error'];

export function initialState() {
  return {mode: 'core', expression: 'neutral', status: 'idle', speaking: false,
    audioLevel: 0, caption: 'JARVIS ONLINE', lastEventAt: new Date().toISOString()};
}

export function applyCommand(current, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Comando inválido');
  const {action, value} = input;
  const next = {...current};
  if (action === 'set_mode' && MODES.includes(value)) next.mode = value;
  else if (action === 'set_expression' && EXPRESSIONS.includes(value)) next.expression = value;
  else if (action === 'set_status' && STATUSES.includes(value)) next.status = value;
  else if (action === 'set_speaking' && typeof value === 'boolean') {
    next.speaking = value;
    next.status = value ? 'speaking' : 'idle';
    if (value) next.expression = 'speaking';
    else if (next.expression === 'speaking') next.expression = 'neutral';
  }
  else if (action === 'set_caption' && typeof value === 'string' && value.length <= 120) next.caption = value;
  else if (action === 'set_audio_level' && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1) next.audioLevel = value;
  else if (action === 'reset') return initialState();
  else throw Error('Ação ou valor não permitido');
  next.lastEventAt = new Date().toISOString();
  return next;
}
