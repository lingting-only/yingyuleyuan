// 英语学习应用的数据与类型定义
// 仅保留打字练习的类型定义与手指映射（词库/课程内容已迁入 src/lib/wordbanks/*.json）

// ========== 打字练习类型 ==========

export type FingerType = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky' | 'thumb';

export interface TypingWord {
  text: string;
  finger: FingerType;
  grammar?: string;
}

export interface WordPhonetic {
  text: string;
  phonetic: string;
  pos: string; // 词性，如 '动词'、'副词'
}

export interface TypingSentence {
  id: string;
  sentence: string;
  translation: string;
  grammar: string;
  words: TypingWord[];
  image?: string;
  phonetics?: WordPhonetic[]; // 音标列表，如 [{ text: 'Wake', phonetic: '/weɪk/', pos: '动词' }]
  grammarRole?: string; // 语法角色，如 '谓语（短语动词）'
}

// 键盘手指颜色映射
export const fingerColors: Record<FingerType, string> = {
  'left-pinky': '#A78BFA',    // 紫色
  'left-ring': '#818CF8',     // 靛蓝
  'left-middle': '#38BDF8',   // 天蓝
  'left-index': '#34D399',    // 翡翠绿
  'right-index': '#FBBF24',   // 琥珀
  'right-middle': '#FB923C',  // 橙色
  'right-ring': '#F87171',    // 红色
  'right-pinky': '#E879F9',   // 品红
  'thumb': '#94A3B8',         // 板岩
};

// 手指名称映射
export const fingerLabels: Record<FingerType, string> = {
  'left-pinky': '左小指',
  'left-ring': '左无名指',
  'left-middle': '左中指',
  'left-index': '左食指',
  'right-index': '右食指',
  'right-middle': '右中指',
  'right-ring': '右无名指',
  'right-pinky': '右小指',
  'thumb': '拇指',
};
