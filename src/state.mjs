export const MODES = ['core', 'face'];
export const EXPRESSIONS = ['neutral', 'happy', 'thinking', 'alert', 'surprised', 'listening', 'speaking'];
export const STATUSES = ['idle', 'listening', 'processing', 'speaking', 'success', 'error'];

export function initialState() {
  return {mode: 'face', expression: 'neutral', status: 'idle', speaking: false, voiceSession: false, audioSync: false, remoteTurnActive: false,
    audioLevel: 0, caption: 'JARVIS ONLINE', lastEventAt: new Date().toISOString()};
}

export function applyCommand(current, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Comando inválido');
  const {action, value} = input;
  const next = {...current};
  if (action === 'set_mode' && MODES.includes(value)) next.mode = value;
  else if (action === 'set_expression' && EXPRESSIONS.includes(value)) next.expression = value;
  else if (action === 'set_status' && STATUSES.includes(value)) {next.status = value; next.remoteTurnActive = false;}
  else if (action === 'set_speaking' && typeof value === 'boolean') {
    next.speaking = value;
    if (!value) next.remoteTurnActive = false;
    next.status = value ? 'speaking' : next.voiceSession ? 'listening' : 'idle';
    if (value) next.expression = 'speaking';
    else if (next.expression === 'speaking') next.expression = next.voiceSession ? 'listening' : 'neutral';
  }
  else if (action === 'set_voice_session' && typeof value === 'boolean') {
    next.voiceSession = value;
    next.remoteTurnActive = false;
    next.speaking = false;
    next.status = value ? 'listening' : 'idle';
    next.expression = value ? 'listening' : 'neutral';
  }
  else if (action === 'voice_turn' && typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 60) {
    // Inicia uma resposta visual, sem acesso ao audio do ChatGPT.
    next.voiceSession = true;
    next.remoteTurnActive = true;
    next.speaking = false;
    next.status = 'processing';
    next.expression = 'thinking';
  }
  else if (action === 'animate_reply' && typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 60) {
    // Apenas anima a face; não captura nem reproduz áudio.
    next.remoteTurnActive = true;
    next.speaking = true;
    next.status = 'speaking';
    next.expression = 'speaking';
  }
  else if (action === 'set_caption' && typeof value === 'string' && value.length <= 120) next.caption = value;
  else if (action === 'set_audio_sync' && typeof value === 'boolean') {
    next.audioSync = value;
    next.remoteTurnActive = false;
    next.audioLevel = 0;
    next.speaking = false;
    next.status = next.voiceSession ? 'listening' : 'idle';
    next.expression = next.voiceSession ? 'listening' : 'neutral';
  }
  else if (action === 'set_audio_level' && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1) {
    next.audioLevel = value;
    if (next.voiceSession && next.audioSync) {
      const speaking = value >= 0.12;
      next.speaking = speaking;
      next.status = speaking ? 'speaking' : 'listening';
      next.expression = speaking ? 'speaking' : 'listening';
    }
  }
  else if (action === 'reset') return initialState();
  else throw Error('Ação ou valor não permitido');
  next.lastEventAt = new Date().toISOString();
  return next;
}
