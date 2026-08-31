// 基于 Web Audio API 合成的打字音效，无需音频资源文件
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  // 浏览器策略：首次用户交互后才允许出声，打字本身即交互
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

// 播放一个带音量包络的单音
function playTone(options: {
  freq: number;
  endFreq?: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  osc.type = options.type;
  osc.frequency.setValueAtTime(options.freq, t0);
  if (options.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(options.endFreq, t0 + options.duration);
  }
  gain.gain.setValueAtTime(options.volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + options.duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + options.duration);
}

// 正确按键：短促清脆的“嗒”声
export function playKeyClick() {
  playTone({ freq: 1100, endFreq: 700, duration: 0.06, type: 'triangle', volume: 0.12 });
}

// 输入错误：低沉的警告音
export function playErrorBuzz() {
  playTone({ freq: 220, endFreq: 150, duration: 0.2, type: 'sawtooth', volume: 0.1 });
}
