// 拼写战斗游戏引擎：显示中文意思，输入完整英文单词自动攻击击杀敌人；
// 实时检测输入是否与目标单词完整匹配，匹配瞬间触发击杀
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type SpellEnemy,
  type SpellStats,
  type SpellPhase,
  type GameWord,
  GAME_MAX_ENERGY,
  GAME_DEFENSE_LINE,
  SPELL_NEXT_WORD_DELAY,
  SPELL_SCORE_PER_CHAR,
  SPELL_SCORE_WORD_BONUS,
  SPELL_ENERGY_PER_WORD,
  SPELL_ENERGY_PER_WRONG,
  spellComputeLevel,
  spellEnemySpeed,
  initialSpellStats,
} from '@/lib/game';
import { playErrorBuzz, playHitDamage, playSpellCorrect, playSpellCombo } from '@/lib/sounds';
import { getComboMilestone } from '@/components/typing/combo-effects';

export interface SpellGameOptions {
  // 正确击杀：页面触发粒子爆发等特效
  onKill?: () => void;
  // 输入错误：页面显示错误提示，并携带当前敌人单词供朗读
  onWrong?: (word?: string) => void;
}

export interface SpellGameSnapshot {
  phase: SpellPhase;
  enemy: SpellEnemy | null;
  inputProgress: string; // 当前输入进度（用户已输入的字符）
  stats: SpellStats;
  shakeKey: number; // 受伤震屏
  flashKey: number; // 完成单词的闪屏/粒子
  comboBannerKey: number; // 连击里程碑横幅
  nextWordAt: number | null; // 下一单词生成时间戳
  burstKey: number; // 击杀粒子爆发触发计数
}

interface SpellEngineState {
  phase: SpellPhase;
  enemy: SpellEnemy | null;
  stats: SpellStats;
  words: GameWord[];
  lastTime: number;
  nextWordAt: number | null;
  idSeq: number;
  shakeKey: number;
  flashKey: number;
  comboBannerKey: number;
  burstKey: number;
  onKill?: () => void;
  onWrong?: (word?: string) => void;
}

const freshEngine = (): SpellEngineState => ({
  phase: 'idle',
  enemy: null,
  stats: initialSpellStats(),
  words: [],
  lastTime: 0,
  nextWordAt: null,
  idSeq: 1,
  shakeKey: 0,
  flashKey: 0,
  comboBannerKey: 0,
  burstKey: 0,
});

export function useSpellGame(options: SpellGameOptions = {}) {
  const engRef = useRef<SpellEngineState>(freshEngine());

  useEffect(() => {
    engRef.current.onKill = options.onKill;
    engRef.current.onWrong = options.onWrong;
  }, [options.onKill, options.onWrong]);

  // 渲染快照
  const [snapshot, setSnapshot] = useState<SpellGameSnapshot>(() => buildSnapshot(freshEngine()));

  const sync = useCallback(() => {
    setSnapshot(buildSnapshot(engRef.current));
  }, []);

  // ===== 主循环 =====
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const eng = engRef.current;
      if (eng.phase === 'running') {
        const dt = eng.lastTime ? Math.min(now - eng.lastTime, 100) : 16;
        eng.lastTime = now;
        const dtSec = dt / 1000;

        // 存活时间与等级
        eng.stats.elapsed += dtSec;
        eng.stats.level = spellComputeLevel(eng.stats.elapsed, eng.stats.kills);

        // 到点生成下一个单词
        if (eng.nextWordAt !== null && now >= eng.nextWordAt) {
          spawnWord(eng);
        }

        // 敌人下移（死亡动画中的敌人停止移动）；敌人越线 → 扣血
        if (eng.enemy && !eng.enemy.dying) {
          eng.enemy.y += eng.enemy.speed * dtSec;
          if (eng.enemy.y >= GAME_DEFENSE_LINE) {
            damagePlayer(eng);
            spawnWord(eng, eng.enemy); // 重置当前单词
          }
        }

        if (eng.stats.hp <= 0) {
          eng.phase = 'over';
        }
      } else {
        eng.lastTime = now;
      }
      sync();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sync]);

  // ===== 外部操作 =====

  // 开始新一局：注入词表并重置状态，立即生成第一个单词
  const start = useCallback(
    (words: GameWord[]) => {
      const eng = engRef.current;
      const { shakeKey, flashKey, comboBannerKey, burstKey } = eng;
      Object.assign(eng, freshEngine(), {
        words,
        phase: 'running' as SpellPhase,
        shakeKey,
        flashKey,
        comboBannerKey,
        burstKey,
      });
      spawnWord(eng);
      sync();
    },
    [sync]
  );

  const pause = useCallback(() => {
    const eng = engRef.current;
    if (eng.phase === 'running') {
      eng.phase = 'paused';
      sync();
    }
  }, [sync]);

  const resume = useCallback(() => {
    const eng = engRef.current;
    if (eng.phase === 'paused') {
      eng.phase = 'running';
      sync();
    }
  }, [sync]);

  // 实时检测输入：每输入一个正确字母触发一次攻击
  // 返回：'match'（完整命中）| 'prefix'（前缀匹配）| 'mismatch'（输错）| 'ignore'（无效状态，应忽略输入）
  const handleInput = useCallback(
    (input: string): 'match' | 'prefix' | 'mismatch' | 'ignore' => {
      const eng = engRef.current;
      // 无效状态（未运行 / 无敌人 / 等待下一词 / 死亡动画中）：忽略输入
      if (eng.phase !== 'running' || !eng.enemy || eng.nextWordAt !== null) return 'ignore';
      if (eng.enemy.dying) return 'ignore';

      const normalized = input.toLowerCase().trim();
      const target = eng.enemy.word.toLowerCase();

      // 长度超限：不可输入超过单词长度，视为输错
      if (normalized.length > target.length) {
        registerWrong(eng);
        sync();
        return 'mismatch';
      }

      // 前缀匹配：逐字母攻击
      if (target.startsWith(normalized)) {
        const prevLen = eng.enemy.progress;
        const newLen = normalized.length;

        // 有新字母被正确输入
        if (newLen > prevLen) {
          for (let i = prevLen; i < newLen; i++) {
            hitEnemy(eng);
          }
        }
        // 完整匹配：击杀敌人
        if (normalized === target && normalized.length > 0) {
          completeWord(eng);
          sync();
          return 'match';
        }
        sync();
        return 'prefix';
      }

      // 输入无法继续匹配：输错处理
      registerWrong(eng);
      sync();
      return 'mismatch';
    },
    [sync]
  );

  // 死亡动画结束后：仅当敌人仍处于 dying 状态时才移除（幂等）。
  // 若 nextWordAt 已到点、主循环已生成新敌人，则不再清空，避免误删新敌人。
  const removeEnemy = useCallback(() => {
    const eng = engRef.current;
    if (eng.enemy?.dying) {
      eng.enemy = null;
      sync();
    }
  }, [sync]);

  return {
    snapshot,
    start,
    pause,
    resume,
    handleInput,
    removeEnemy,
  };
}

// ===== 内部逻辑 =====

function buildSnapshot(eng: SpellEngineState): SpellGameSnapshot {
  return {
    phase: eng.phase,
    enemy: eng.enemy ? { ...eng.enemy } : null,
    inputProgress: '',
    stats: { ...eng.stats, elapsed: Math.floor(eng.stats.elapsed) },
    shakeKey: eng.shakeKey,
    flashKey: eng.flashKey,
    comboBannerKey: eng.comboBannerKey,
    nextWordAt: eng.nextWordAt,
    burstKey: eng.burstKey,
  };
}

// 生成单词：随机取词，在战场顶部生成一个单词敌人
function spawnWord(eng: SpellEngineState, existingWord?: SpellEnemy) {
  const w = existingWord
    ? { text: existingWord.word, meaning: existingWord.meaning, phonetic: existingWord.phonetic }
    : eng.words[Math.floor(Math.random() * eng.words.length)];
  if (!w) return;

  const speed = spellEnemySpeed(eng.stats.level);
  const x = 50; // 居中
  // 如果是越线重置，保持原位置；否则随机初始位置
  const y = existingWord ? existingWord.y : 14 + Math.random() * 5;

  eng.enemy = {
    id: eng.idSeq++,
    word: w.text.toLowerCase(),
    meaning: w.meaning,
    phonetic: w.phonetic,
    x,
    y,
    speed: speed * (0.95 + Math.random() * 0.1),
    hp: w.text.length,
    maxHp: w.text.length,
    progress: 0,
    dying: false,
    shake: 0,
    hitKey: 0,
  };
  eng.nextWordAt = null;
}

// 逐字母击中敌人：扣血、触发击中特效
function hitEnemy(eng: SpellEngineState) {
  const enemy = eng.enemy;
  if (!enemy || enemy.dying) return;

  enemy.progress += 1;
  enemy.hp -= 1;
  enemy.hitKey += 1;
}

// 完成单词：结算奖励，触发特效，延迟生成下一个单词
function completeWord(eng: SpellEngineState) {
  const st = eng.stats;
  const enemy = eng.enemy;
  if (!enemy) return;

  st.kills += 1;
  st.combo += 1;
  st.maxCombo = Math.max(st.maxCombo, st.combo);
  st.score += enemy.word.length * SPELL_SCORE_PER_CHAR + SPELL_SCORE_WORD_BONUS;
  st.energy = Math.min(GAME_MAX_ENERGY, st.energy + SPELL_ENERGY_PER_WORD);
  st.correctWords += 1;

  // 标记敌人为死亡状态
  enemy.dying = true;

  // 触发击杀音效（拼写模式专用）
  playSpellCorrect();
  eng.onKill?.();

  // 连击里程碑
  if (getComboMilestone(st.combo)) {
    playSpellCombo();
    eng.comboBannerKey += 1;
  }

  eng.flashKey += 1;
  eng.burstKey += 1;

  // 延迟生成下一个单词
  eng.nextWordAt = performance.now() + SPELL_NEXT_WORD_DELAY;
}

// 玩家受伤：敌人越线
function damagePlayer(eng: SpellEngineState) {
  eng.stats.hp -= 1;
  eng.stats.combo = 0;
  eng.shakeKey += 1;
  playHitDamage();
}

// 输入错误：输入内容无法继续匹配目标单词的前缀
function registerWrong(eng: SpellEngineState) {
  eng.stats.wrongWords += 1;
  eng.stats.combo = 0;
  eng.stats.energy = Math.max(0, eng.stats.energy - SPELL_ENERGY_PER_WRONG);

  // 晃动敌人
  if (eng.enemy) {
    eng.enemy.shake += 1;
  }

  playErrorBuzz();
  eng.onWrong?.(eng.enemy?.word);
}
