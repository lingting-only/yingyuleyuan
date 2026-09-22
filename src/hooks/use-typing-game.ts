// 打字战斗游戏引擎：每次一个单词，按字母数生成敌人缓慢下压；
// 输入正确字母 → 触发开火事件（页面发射光波子弹）并消灭对应字母敌人；
// 任一字母敌人越过防线 → 扣血并重置本词；血量归零结束
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type GameWord,
  type LetterEnemy,
  type FireEvent,
  type FloatingText,
  type GameStats,
  type GamePhase,
  GAME_MAX_ENERGY,
  GAME_DEFENSE_LINE,
  NEXT_WORD_DELAY,
  SCORE_PER_CHAR,
  SCORE_KILL_BONUS,
  ENERGY_PER_CHAR,
  ENERGY_PER_KILL,
  ENERGY_PER_MISS,
  computeLevel,
  enemySpeed,
  initialStats,
} from '@/lib/game';
import { playKeyClick, playErrorBuzz, playKill, playHitDamage, playCombo } from '@/lib/sounds';
import { getComboMilestone } from '@/components/typing/combo-effects';

export interface UseTypingGameOptions {
  // 正确按键：页面从对应键位向敌人发射子弹
  onFire?: (e: FireEvent) => void;
  // 输错时：页面播放单词朗读
  onWrong?: () => void;
}

export interface GameSnapshot {
  phase: GamePhase;
  word: GameWord | null;
  typed: number; // 当前单词已正确输入的字母数
  enemies: LetterEnemy[];
  floats: FloatingText[];
  stats: GameStats;
  shakeKey: number; // 受伤震屏
  flashKey: number; // 完成单词的闪屏/粒子
  comboBannerKey: number; // 连击里程碑横幅
  burstCenter: { x: number; y: number } | null; // 粒子爆发中心（战场百分比）
  nextChar: string; // 下一待输入字母（虚拟键盘高亮）
}

interface EngineState {
  phase: GamePhase;
  word: GameWord | null;
  typed: number;
  enemies: LetterEnemy[];
  floats: FloatingText[];
  stats: GameStats;
  words: GameWord[];
  lastTime: number;
  nextWordAt: number | null; // 到点生成下一个单词（performance.now 时间戳）
  idSeq: number;
  shakeKey: number;
  flashKey: number;
  comboBannerKey: number;
  burstEnemy: { x: number; y: number } | null;
  onFire?: (e: FireEvent) => void;
  onWrong?: () => void;
}

const freshEngine = (): EngineState => ({
  phase: 'idle',
  word: null,
  typed: 0,
  enemies: [],
  floats: [],
  stats: initialStats(),
  words: [],
  lastTime: 0,
  nextWordAt: null,
  idSeq: 1,
  shakeKey: 0,
  flashKey: 0,
  comboBannerKey: 0,
  burstEnemy: null,
});

export function useTypingGame(options: UseTypingGameOptions = {}) {
  const engRef = useRef<EngineState>(freshEngine());
  useEffect(() => {
    engRef.current.onFire = options.onFire;
    engRef.current.onWrong = options.onWrong;
  }, [options.onFire, options.onWrong]);

  // 渲染快照：rAF 每帧同步（字母敌人 ≤ 12，开销可控）
  // 初始值用纯函数构造，避免在 render 期读取 ref（react-hooks/refs）
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => buildSnapshot(freshEngine()));

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
        eng.stats.level = computeLevel(eng.stats.elapsed, eng.stats.kills);

        // 到点生成下一个单词
        if (eng.nextWordAt !== null && now >= eng.nextWordAt) {
          spawnWord(eng);
        }

        // 字母敌人下移（已命中待击/死亡中的敌人停止移动）；任一未死敌人越线 → 扣血并重置本词
        let breached = false;
        for (const e of eng.enemies) {
          if (e.dying || e.hit) continue;
          e.y += e.speed * dtSec;
          if (e.y >= GAME_DEFENSE_LINE) breached = true;
        }
        if (breached && eng.word) {
          damagePlayer(eng);
          spawnWord(eng, eng.word); // 重置当前单词
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
      const { shakeKey, flashKey, comboBannerKey } = eng;
      Object.assign(eng, freshEngine(), {
        words,
        phase: 'running' as GamePhase,
        shakeKey,
        flashKey,
        comboBannerKey,
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

  // 键盘输入：返回该键是否被游戏消费
  const handleKey = useCallback(
    (key: string): boolean => {
      const eng = engRef.current;
      if (eng.phase !== 'running' || !eng.word || eng.nextWordAt !== null) return false;
      if (key.length !== 1 || !/^[a-zA-Z]$/.test(key)) return false;
      const ch = key.toLowerCase();

      const expected = eng.word.text[eng.typed];
      if (ch !== expected) {
        registerWrong(eng);
        sync();
        return true;
      }

      // 命中：推进进度、计分，将敌人标记为“待击”（停止移动），并通知页面开火
      const enemy = eng.enemies.find((e) => e.index === eng.typed && !e.dying && !e.hit);
      eng.typed += 1;
      eng.stats.correctChars += 1;
      eng.stats.score += SCORE_PER_CHAR;
      eng.stats.energy = Math.min(GAME_MAX_ENERGY, eng.stats.energy + ENERGY_PER_CHAR);
      playKeyClick();

      if (enemy) {
        enemy.hit = true;
        eng.onFire?.({ enemyId: enemy.id, char: ch, x: enemy.x, y: enemy.y });
      }

      // 单词完成：结算奖励，延迟生成下一个单词
      if (eng.typed >= eng.word.text.length) {
        completeWord(eng);
      }
      sync();
      return true;
    },
    [sync]
  );

  // 子弹到达：将待击敌人置为死亡，触发死亡动画；返回敌人战场百分比坐标（供页面做粒子爆发）
  const killEnemy = useCallback(
    (id: number): { x: number; y: number } | null => {
      const eng = engRef.current;
      const enemy = eng.enemies.find((e) => e.id === id);
      if (enemy && !enemy.dying) {
        enemy.dying = true;
        sync();
        return { x: enemy.x, y: enemy.y };
      }
      return null;
    },
    [sync]
  );

  // 敌人死亡动画结束后移除实体（幂等）
  const removeEnemy = useCallback(
    (id: number) => {
      const eng = engRef.current;
      eng.enemies = eng.enemies.filter((e) => e.id !== id);
      sync();
    },
    [sync]
  );

  // 飘字动画结束后移除
  const removeFloat = useCallback(
    (id: number) => {
      const eng = engRef.current;
      eng.floats = eng.floats.filter((f) => f.id !== id);
      sync();
    },
    [sync]
  );

  return {
    snapshot,
    start,
    pause,
    resume,
    handleKey,
    killEnemy,
    removeEnemy,
    removeFloat,
  };
}

// ===== 内部逻辑 =====

function buildSnapshot(eng: EngineState): GameSnapshot {
  const nextChar =
    eng.word && eng.nextWordAt === null ? eng.word.text[eng.typed] ?? '' : '';
  return {
    phase: eng.phase,
    word: eng.word,
    typed: eng.typed,
    enemies: eng.enemies.map((e) => ({ ...e })),
    floats: eng.floats.map((f) => ({ ...f })),
    stats: { ...eng.stats, elapsed: Math.floor(eng.stats.elapsed) },
    shakeKey: eng.shakeKey,
    flashKey: eng.flashKey,
    comboBannerKey: eng.comboBannerKey,
    burstCenter: eng.burstEnemy ? { x: eng.burstEnemy.x, y: eng.burstEnemy.y } : null,
    nextChar,
  };
}

// 生成单词：按字母数在战场顶部一排布下字母敌人
function spawnWord(eng: EngineState, word?: GameWord) {
  const w = word ?? eng.words[Math.floor(Math.random() * eng.words.length)];
  if (!w) return;
  eng.word = w;
  eng.typed = 0;
  eng.nextWordAt = null;
  eng.enemies = [];

  const n = w.text.length;
  const speed = enemySpeed(eng.stats.level);
  // 一排居中铺开，相邻字母间距随词长收紧，附带轻微错位与纵向抖动
  const spacing = Math.min(9, 76 / n);
  const startX = 50 - (spacing * (n - 1)) / 2;
  for (let i = 0; i < n; i++) {
    eng.enemies.push({
      id: eng.idSeq++,
      char: w.text[i],
      index: i,
      x: startX + i * spacing + (Math.random() * 2 - 1),
      y: 4 + Math.random() * 5,
      speed: speed * (0.9 + Math.random() * 0.2),
      hit: false,
      dying: false,
      shake: 0,
    });
  }
}

function completeWord(eng: EngineState) {
  const st = eng.stats;
  const word = eng.word;
  if (!word) return;

  st.kills += 1;
  st.combo += 1;
  st.maxCombo = Math.max(st.maxCombo, st.combo);
  st.score += SCORE_KILL_BONUS;
  st.energy = Math.min(GAME_MAX_ENERGY, st.energy + ENERGY_PER_KILL);

  playKill();
  if (getComboMilestone(st.combo)) {
    playCombo();
    eng.comboBannerKey += 1;
  }
  eng.flashKey += 1;

  // 爆发中心取字母敌人的平均位置
  const alive = eng.enemies;
  const cx = alive.length ? alive.reduce((s, e) => s + e.x, 0) / alive.length : 50;
  const cy = alive.length ? alive.reduce((s, e) => s + e.y, 0) / alive.length : 30;
  eng.burstEnemy = { x: cx, y: cy };

  // 飘字：+XP 与 +ENERGY 双色，连击里程碑附 HEADSHOT
  const xpGain = SCORE_PER_CHAR * word.text.length + SCORE_KILL_BONUS;
  pushFloat(eng, { text: `+${xpGain} XP`, kind: 'xp', x: Math.max(cx - 10, 8), y: cy });
  pushFloat(eng, {
    text: `+${ENERGY_PER_CHAR * word.text.length + ENERGY_PER_KILL} ENERGY`,
    kind: 'energy',
    x: Math.min(cx + 10, 80),
    y: cy + 6,
  });
  if (getComboMilestone(st.combo)) {
    pushFloat(eng, { text: 'HEADSHOT!', kind: 'headshot', x: cx, y: Math.max(cy - 10, 6) });
  }

  // 延迟生成下一个单词（期间字母敌人播完死亡动画）
  eng.nextWordAt = performance.now() + NEXT_WORD_DELAY;
}

function damagePlayer(eng: EngineState) {
  eng.stats.hp -= 1;
  eng.stats.combo = 0;
  eng.shakeKey += 1;
  playHitDamage();
  pushFloat(eng, { text: '-1 HP', kind: 'damage', x: 50, y: GAME_DEFENSE_LINE - 6 });
}

function registerWrong(eng: EngineState) {
  eng.stats.wrongChars += 1;
  eng.stats.combo = 0;
  // 输错扣减能量（下限 0）
  eng.stats.energy = Math.max(0, eng.stats.energy - ENERGY_PER_MISS);
  // 晃动当前待输入的字母敌人
  const target = eng.enemies.find((e) => e.index === eng.typed && !e.dying && !e.hit);
  if (target) target.shake += 1;
  playErrorBuzz();
  // 输错后播放单词朗读
  eng.onWrong?.();
}

function pushFloat(eng: EngineState, f: Omit<FloatingText, 'id'>) {
  eng.floats.push({ ...f, id: eng.idSeq++ });
}
