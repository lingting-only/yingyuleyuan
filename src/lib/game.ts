// 打字战斗游戏：类型定义、取词与难度/计分常量
// 玩法：每次出现一个单词（显示中文并朗读），按字母数生成对应数量敌人，
// 输入正确字母时从键位发射光波子弹击杀对应字母敌人，集齐全词完成击杀

import { getBankContent, initWordBanks, wordBankIndex } from './wordbank';
import { getSelectedLessonId } from './storage';

// ========== 游戏实体类型 ==========

// 游戏词条：纯小写字母单词 + 中文释义 + 音标
export interface GameWord {
  text: string;
  meaning: string;
  phonetic: string;
}

// 字母敌人：一个单词的每个字母对应一个敌人
export interface LetterEnemy {
  id: number;
  char: string; // 该敌人携带的字母
  index: number; // 在单词中的字母下标
  x: number; // 横向位置 0-100（百分比）
  y: number; // 纵向位置 0-100（百分比）
  speed: number; // 每秒下移百分比
  hit: boolean; // 已被正确输入命中，等待子弹到达（此期间停止移动）
  dying: boolean; // 子弹命中，死亡动画中
  shake: number; // 输错该字母时自增，用于触发晃动动画
}

// 正确按键时引擎向页面发出的开火事件（页面据此从键位发射子弹）
export interface FireEvent {
  enemyId: number;
  char: string;
  x: number; // 敌人战场百分比坐标
  y: number;
}

export interface FloatingText {
  id: number;
  text: string;
  kind: 'xp' | 'energy' | 'headshot' | 'damage';
  x: number;
  y: number;
}

export interface GameStats {
  score: number;
  kills: number; // 完成的单词数
  combo: number;
  maxCombo: number;
  energy: number; // 0-100
  hp: number;
  level: number; // 难度等级
  correctChars: number;
  wrongChars: number;
  elapsed: number; // 存活秒数
}

export type GamePhase = 'idle' | 'running' | 'paused' | 'over';
export type GameMode = 'letter' | 'spell';

// ========== 拼写模式类型 ==========

// 单词敌人（整体作为一个敌人）
export interface SpellEnemy {
  id: number;
  word: string; // 英文单词（小写）
  meaning: string; // 中文意思
  phonetic: string; // 音标
  x: number; // 横向位置 0-100（百分比）
  y: number; // 纵向位置 0-100（百分比）
  speed: number; // 每秒下移百分比
  hp: number; // 当前血量（初始 = 单词长度）
  maxHp: number; // 最大血量
  progress: number; // 已正确输入的字母数
  dying: boolean; // 死亡动画中
  shake: number; // 输错时自增，用于触发晃动动画
  hitKey: number; // 每次正确击中时自增，用于触发击中特效
}

export interface SpellStats {
  score: number;
  kills: number; // 完成的单词数
  combo: number;
  maxCombo: number;
  energy: number; // 0-100
  hp: number;
  level: number; // 难度等级
  correctWords: number;
  wrongWords: number;
  elapsed: number; // 存活秒数
}

export type SpellPhase = 'idle' | 'running' | 'paused' | 'over';

// ========== 游戏常量 ==========

export const GAME_MAX_HP = 3;
export const GAME_MAX_ENERGY = 100;
// 敌人越过此线判定失守扣血（战场高度百分比）
export const GAME_DEFENSE_LINE = 92;

// 难度曲线：基础下落速度（%/s）随等级提升
export const ENEMY_BASE_SPEED = 3.2;
export const ENEMY_SPEED_PER_LEVEL = 0.7;
// 每 25 秒或每完成 6 个单词升一级
export const LEVEL_UP_TIME = 25;
export const LEVEL_UP_KILLS = 6;
export const MAX_LEVEL = 20;

// 单词字母数量限制（字母敌人需在一排内放下）
export const WORD_MIN_LEN = 2;
export const WORD_MAX_LEN = 12;
// 完成一个单词后到下一个单词出现的间隔（ms）
export const NEXT_WORD_DELAY = 700;

// 计分
export const SCORE_PER_CHAR = 10;
export const SCORE_KILL_BONUS = 30;
export const ENERGY_PER_CHAR = 6;
export const ENERGY_PER_KILL = 12;
// 输错一个字母扣减的能量（与正确输入 +6 对称）
export const ENERGY_PER_MISS = 6;

// ========== 拼写模式常量 ==========

export const SPELL_SCORE_PER_CHAR = 8; // 拼写模式：每个正确字符的分数
export const SPELL_SCORE_WORD_BONUS = 50; // 拼写模式：单词完成奖励
export const SPELL_ENERGY_PER_WORD = 10; // 拼写模式：完成单词增加能量
export const SPELL_ENERGY_PER_WRONG = 8; // 拼写模式：输入错误扣减能量
export const SPELL_ENEMY_BASE_SPEED = 2.5; // 拼写模式：敌人基础下落速度（略慢于字母模式）
export const SPELL_ENEMY_SPEED_PER_LEVEL = 0.5; // 拼写模式：每级速度增量
export const SPELL_LEVEL_UP_TIME = 30; // 拼写模式：每 30 秒升一级
export const SPELL_LEVEL_UP_KILLS = 5; // 拼写模式：每完成 5 个单词升一级
export const SPELL_NEXT_WORD_DELAY = 700; // 拼写模式：完成单词后到下一词出现的间隔（ms），需 ≥ 死亡动画时长
// 拼写模式敌人尺寸（横向占战场百分比）
export const SPELL_ENEMY_WIDTH = 40;

export function computeLevel(elapsed: number, kills: number): number {
  const byTime = Math.floor(elapsed / LEVEL_UP_TIME);
  const byKills = Math.floor(kills / LEVEL_UP_KILLS);
  return Math.min(1 + Math.max(byTime, byKills), MAX_LEVEL);
}

export function enemySpeed(level: number): number {
  return ENEMY_BASE_SPEED + (level - 1) * ENEMY_SPEED_PER_LEVEL;
}

// 拼写模式难度计算
export function spellComputeLevel(elapsed: number, kills: number): number {
  const byTime = Math.floor(elapsed / SPELL_LEVEL_UP_TIME);
  const byKills = Math.floor(kills / SPELL_LEVEL_UP_KILLS);
  return Math.min(1 + Math.max(byTime, byKills), MAX_LEVEL);
}

// 拼写模式敌人速度
export function spellEnemySpeed(level: number): number {
  return SPELL_ENEMY_BASE_SPEED + (level - 1) * SPELL_ENEMY_SPEED_PER_LEVEL;
}

export function initialStats(): GameStats {
  return {
    score: 0,
    kills: 0,
    combo: 0,
    maxCombo: 0,
    energy: 0,
    hp: GAME_MAX_HP,
    level: 1,
    correctChars: 0,
    wrongChars: 0,
    elapsed: 0,
  };
}

export function initialSpellStats(): SpellStats {
  return {
    score: 0,
    kills: 0,
    combo: 0,
    maxCombo: 0,
    energy: 0,
    hp: GAME_MAX_HP,
    level: 1,
    correctWords: 0,
    wrongWords: 0,
    elapsed: 0,
  };
}

// ========== 取词 ==========

export interface GameWords {
  bankId: string;
  bankTitle: string;
  type: 'word' | 'sentence';
  total: number; // 词库条目总数（与打字练习进度口径一致：word=单词数，sentence=句子数）
  words: GameWord[]; // 可生成敌人的单词（过滤/去重后）
}

// 从当前所选词库提取词条：word 词库直接取词（含释义/音标）；
// sentence 课程从 words[].text 提取，音标从句子的 phonetics 匹配，释义取句子翻译
// 仅保留纯字母单词（字母敌人与键盘一一对应），去重
export async function loadGameWords(): Promise<GameWords> {
  await initWordBanks();
  const sel = getSelectedLessonId();
  const content = sel ? getBankContent(sel) : undefined;
  // 未选课或所选词库加载失败时，回退到任意可用词库
  const bankId = content ? (sel ?? '') : findFirstBankId();
  const bank = content ?? getBankContent(bankId);

  const raw: GameWord[] = [];
  if (bank) {
    if (bank.type === 'word') {
      for (const w of bank.words) {
        raw.push({ text: w.word, meaning: w.meaning, phonetic: w.phonetic });
      }
    } else {
      for (const s of bank.sentences) {
        const texts =
          Array.isArray(s.words) && s.words.length > 0
            ? s.words.map((w) => w.text)
            : s.sentence.split(/\s+/);
        for (const t of texts) {
          const ph = s.phonetics?.find(
            (p) => p.text.toLowerCase() === t.toLowerCase()
          );
          raw.push({ text: t, meaning: s.translation, phonetic: ph?.phonetic ?? '' });
        }
      }
    }
  }

  const seen = new Set<string>();
  const words: GameWord[] = [];
  for (const w of raw) {
    const clean = w.text.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length < WORD_MIN_LEN || clean.length > WORD_MAX_LEN) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    words.push({ text: clean, meaning: w.meaning, phonetic: w.phonetic });
  }

  // 词库原始条目总数（与打字练习的 totalSentences 口径一致）
  const total = bank
    ? (bank.type === 'word' ? bank.words.length : bank.sentences.length)
    : words.length;

  return {
    bankId,
    bankTitle: bankTitleOf(bankId),
    type: bank?.type ?? 'word',
    total,
    words,
  };
}

function findFirstBankId(): string {
  return wordBankIndex[0]?.id ?? '';
}

function bankTitleOf(bankId: string): string {
  return wordBankIndex.find((b) => b.id === bankId)?.titleCn ?? '';
}
