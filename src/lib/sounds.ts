// 基于 Web Audio API 合成的打字音效，无需音频资源文件
let audioCtx: AudioContext | null = null;

// 全局音频开关：默认开启（false 表示不静音）
let muted = false;

// 设置是否静音
export function setSoundMuted(value: boolean) {
  muted = value;
}

// 当前是否静音（供 speechSynthesis 朗读等场景复用同一开关）
export function isSoundMuted(): boolean {
  return muted;
}

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
  if (muted) return; // 静音时不播放任何音效
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

// ===== 打字战斗游戏音效 =====

// 击杀敌人：上扬琶音（快速三连音）
export function playKill() {
  playTone({ freq: 660, duration: 0.08, type: 'square', volume: 0.08 });
  setTimeout(() => playTone({ freq: 880, duration: 0.08, type: 'square', volume: 0.08 }), 60);
  setTimeout(() => playTone({ freq: 1320, endFreq: 1760, duration: 0.12, type: 'triangle', volume: 0.1 }), 120);
}

// 敌人越线受伤：低频轰击
export function playHitDamage() {
  playTone({ freq: 120, endFreq: 60, duration: 0.35, type: 'sawtooth', volume: 0.16 });
  playTone({ freq: 55, endFreq: 40, duration: 0.4, type: 'sine', volume: 0.2 });
}

// 连击里程碑：明亮和弦
export function playCombo() {
  playTone({ freq: 523, duration: 0.1, type: 'triangle', volume: 0.1 });
  setTimeout(() => playTone({ freq: 659, duration: 0.1, type: 'triangle', volume: 0.1 }), 70);
  setTimeout(() => playTone({ freq: 784, duration: 0.16, type: 'triangle', volume: 0.12 }), 140);
}

// ===== 拼写模式专用音效 =====

// 拼写正确（比字母模式更有成就感的击杀音）：上行琶音 + 和弦
export function playSpellCorrect() {
  playTone({ freq: 523, duration: 0.1, type: 'sine', volume: 0.12 });
  setTimeout(() => playTone({ freq: 659, duration: 0.1, type: 'sine', volume: 0.12 }), 50);
  setTimeout(() => playTone({ freq: 784, duration: 0.1, type: 'sine', volume: 0.12 }), 100);
  setTimeout(() => playTone({ freq: 1047, duration: 0.18, type: 'triangle', volume: 0.15 }), 150);
}

// 拼写模式连击里程碑：更华丽的音效
export function playSpellCombo() {
  playTone({ freq: 587, duration: 0.08, type: 'sine', volume: 0.12 });
  setTimeout(() => playTone({ freq: 740, duration: 0.08, type: 'sine', volume: 0.12 }), 60);
  setTimeout(() => playTone({ freq: 880, duration: 0.08, type: 'sine', volume: 0.12 }), 120);
  setTimeout(() => playTone({ freq: 1175, duration: 0.2, type: 'triangle', volume: 0.15 }), 180);
}
