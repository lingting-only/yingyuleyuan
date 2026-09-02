// 词库加载器：统一入口，供 gallery / 首页 / 错题本 / 进度页共享
// index.json 为词库清单（打包内置），各词库内容 JSON 位于 public/wordbanks/ 下，运行时按需 fetch
// 新增词库：在 public/wordbanks/ 放 <id>.json（含 words[] 或 sentences[]）+ 在 index.json 登记一条即可
// 注意：文件名用单数 wordbank，避免与同名的 wordbanks/ 数据目录发生解析歧义

import indexJson from './wordbanks/index.json';
import type { FingerType, TypingSentence } from './data';

// 单词条目（PEP 单词词库）
export interface WordBankItem {
  id: string;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
}

// 词库/课程元信息（gallery 列表数据源）
export interface WordBankMeta {
  id: string;
  type: 'word' | 'sentence';
  grade: string;
  titleCn: string;
  titleEn: string;
  description?: string;
  count: number;
  preview?: string;
}

type BankContent =
  | { type: 'word'; words: WordBankItem[] }
  | { type: 'sentence'; sentences: TypingSentence[] };

type RawBank = Partial<{ words: WordBankItem[]; sentences: TypingSentence[] }>;

// 运行时内容缓存（initWordBanks 填充后才有数据）
const contentMap: Record<string, BankContent> = {};

// 词库索引：initWordBanks 完成后填充；count/preview 由内容实时计算避免漂移
export let wordBankIndex: WordBankMeta[] = [];

let initPromise: Promise<void> | null = null;

// 初始化：拉取 index.json 登记的所有词库内容（幂等，多页面共享一次加载）
export function initWordBanks(): Promise<void> {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

async function doInit(): Promise<void> {
  const results = await Promise.all(
    indexJson.map(async (meta): Promise<[string, RawBank | null]> => {
      try {
        const res = await fetch(`/wordbanks/${meta.id}.json`);
        if (!res.ok) return [meta.id, null];
        return [meta.id, (await res.json()) as RawBank];
      } catch {
        return [meta.id, null];
      }
    })
  );
  for (const [id, r] of results) {
    if (!r) continue;
    if (Array.isArray(r.words)) contentMap[id] = { type: 'word', words: r.words };
    else if (Array.isArray(r.sentences))
      contentMap[id] = { type: 'sentence', sentences: r.sentences };
  }
  wordBankIndex = indexJson
    .filter((meta) => Boolean(contentMap[meta.id]))
    .map((meta) => {
      const content = contentMap[meta.id];
      const type = meta.type as 'word' | 'sentence';
      const count = content.type === 'word' ? content.words.length : content.sentences.length;
      let preview = '';
      if (content.type === 'word') {
        preview = content.words.slice(0, 3).map((w) => w.word).join('、');
      } else {
        preview = content.sentences[0]?.sentence ?? '';
      }
      return { ...meta, type, count, preview };
    });
}

// 获取词库/课程内容（需先 initWordBanks）
export function getBankContent(id: string): BankContent | undefined {
  return contentMap[id];
}

// 是否为单词词库 id（pep-*）
export function isWordBankId(id: string): boolean {
  return indexJson.some((m) => m.id === id && m.type === 'word');
}

// 该 id 是否属于某个单词词库（错题模式判断用）
export function isWordItemId(id: string): boolean {
  for (const meta of indexJson) {
    const content = contentMap[meta.id];
    if (content && content.type === 'word' && content.words.some((w) => w.id === id)) return true;
  }
  return false;
}

// 26 字母 → 触打手指（标准指法，与 virtual-keyboard 键盘布局一致）
const LETTER_FINGER: Record<string, FingerType> = {
  q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
  w: 'left-ring', s: 'left-ring', x: 'left-ring',
  e: 'left-middle', d: 'left-middle', c: 'left-middle',
  r: 'left-index', t: 'left-index', f: 'left-index', g: 'left-index', v: 'left-index', b: 'left-index',
  y: 'right-index', u: 'right-index', h: 'right-index', j: 'right-index', n: 'right-index', m: 'right-index',
  i: 'right-middle', k: 'right-middle',
  o: 'right-ring', l: 'right-ring',
  p: 'right-pinky',
};

// 单词 → 单字句：复用句子练习管线，产出「音标+词性+中文释义」完成卡片
export function wordToSentence(item: WordBankItem): TypingSentence {
  return {
    id: item.id,
    sentence: item.word,
    translation: item.meaning,
    grammar: '',
    grammarRole: item.pos,
    phonetics: [{ text: item.word, phonetic: item.phonetic, pos: item.pos }],
    words: [
      {
        text: item.word,
        finger: LETTER_FINGER[item.word[0]?.toLowerCase()] ?? 'thumb',
        grammar: item.pos,
      },
    ],
  };
}

// 获取某词库/课程的练习队列（word 词库逐词转单字句；需先 initWordBanks）
export function bankToPracticeQueue(id: string): TypingSentence[] | undefined {
  const content = contentMap[id];
  if (!content) return undefined;
  if (content.type === 'sentence') return content.sentences;
  return content.words.map(wordToSentence);
}

// 按 id 查找练习项：句子课程查句、单词词库查词并转单字句（错题本/统计反查用；需先 initWordBanks）
export function findPracticeById(id: string): TypingSentence | undefined {
  for (const meta of indexJson) {
    const content = contentMap[meta.id];
    if (content && content.type === 'sentence') {
      const s = content.sentences.find((x) => x.id === id);
      if (s) return s;
    }
  }
  for (const meta of indexJson) {
    const content = contentMap[meta.id];
    if (content && content.type === 'word') {
      const w = content.words.find((x) => x.id === id);
      if (w) return wordToSentence(w);
    }
  }
  return undefined;
}

// 按练习项 id 反查所属词库/课程 id（写入用户统计时用；需先 initWordBanks）
export function findBankIdByItem(id: string): string {
  for (const meta of indexJson) {
    const content = contentMap[meta.id];
    if (!content) continue;
    if (content.type === 'sentence') {
      if (content.sentences.some((x) => x.id === id)) return meta.id;
    } else if (content.words.some((x) => x.id === id)) {
      return meta.id;
    }
  }
  return '';
}
