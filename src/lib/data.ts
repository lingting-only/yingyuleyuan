// Mock data for the English learning application

export interface Course {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  icon: string;
  lessons: number;
  completedLessons: number;
  duration: string;
  students: number;
  rating: number;
  tags: string[];
  thumbnail: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  titleEn: string;
  type: 'video' | 'audio' | 'text';
  duration: string;
  completed: boolean;
  content?: string;
}

export interface PracticeItem {
  id: string;
  type: 'vocabulary' | 'grammar' | 'speaking';
  question: string;
  questionEn?: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
  audioUrl?: string;
  explanation?: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  tags: string[];
  isChallenge?: boolean;
}

export interface LearningStats {
  totalStudyTime: number;
  todayStudyTime: number;
  coursesCompleted: number;
  wordsLearned: number;
  streakDays: number;
  weeklyData: { day: string; minutes: number }[];
  testScores: { date: string; score: number; type: string }[];
}

export const courses: Course[] = [
  {
    id: '1',
    title: '日常口语入门',
    titleEn: 'Daily Conversation Starter',
    description: '从零开始学习日常英语对话，掌握最基本的问候、介绍、购物等场景用语。',
    level: 'beginner',
    category: '口语',
    icon: '💬',
    lessons: 20,
    completedLessons: 12,
    duration: '10小时',
    students: 3420,
    rating: 4.8,
    tags: ['口语', '日常', '入门'],
    thumbnail: 'conversation',
  },
  {
    id: '2',
    title: '商务英语精进',
    titleEn: 'Business English Mastery',
    description: '提升职场英语能力，学习会议、谈判、邮件写作等商务场景核心表达。',
    level: 'advanced',
    category: '商务',
    icon: '💼',
    lessons: 30,
    completedLessons: 8,
    duration: '20小时',
    students: 2150,
    rating: 4.9,
    tags: ['商务', '职场', '高级'],
    thumbnail: 'business',
  },
  {
    id: '3',
    title: '语法基础巩固',
    titleEn: 'Grammar Foundation',
    description: '系统梳理英语语法体系，从时态到从句，打好坚实的语法基础。',
    level: 'beginner',
    category: '语法',
    icon: '📝',
    lessons: 25,
    completedLessons: 25,
    duration: '15小时',
    students: 5680,
    rating: 4.7,
    tags: ['语法', '基础', '系统'],
    thumbnail: 'grammar',
  },
  {
    id: '4',
    title: '雅思听力突破',
    titleEn: 'IELTS Listening Breakthrough',
    description: '针对雅思听力考试的技巧训练，包含各类题型解析和真题演练。',
    level: 'advanced',
    category: '考试',
    icon: '🎧',
    lessons: 18,
    completedLessons: 5,
    duration: '12小时',
    students: 4200,
    rating: 4.9,
    tags: ['雅思', '听力', '考试'],
    thumbnail: 'listening',
  },
  {
    id: '5',
    title: '旅行英语指南',
    titleEn: 'Travel English Guide',
    description: '出国旅行必备英语，覆盖机场、酒店、餐厅、景点等实用场景。',
    level: 'intermediate',
    category: '旅行',
    icon: '✈️',
    lessons: 15,
    completedLessons: 0,
    duration: '8小时',
    students: 1890,
    rating: 4.6,
    tags: ['旅行', '实用', '中级'],
    thumbnail: 'travel',
  },
  {
    id: '6',
    title: '英语词汇拓展',
    titleEn: 'Vocabulary Expansion',
    description: '通过词根词缀、联想记忆等方法，高效扩展英语词汇量。',
    level: 'intermediate',
    category: '词汇',
    icon: '📚',
    lessons: 40,
    completedLessons: 15,
    duration: '25小时',
    students: 6700,
    rating: 4.8,
    tags: ['词汇', '记忆', '中级'],
    thumbnail: 'vocabulary',
  },
  {
    id: '7',
    title: '英文写作提升',
    titleEn: 'English Writing Improvement',
    description: '从段落结构到篇章布局，全面提升英语写作能力与表达技巧。',
    level: 'intermediate',
    category: '写作',
    icon: '✍️',
    lessons: 22,
    completedLessons: 3,
    duration: '14小时',
    students: 2800,
    rating: 4.7,
    tags: ['写作', '表达', '中级'],
    thumbnail: 'writing',
  },
  {
    id: '8',
    title: '英语发音矫正',
    titleEn: 'Pronunciation Correction',
    description: '系统学习英语音标，纠正发音问题，练就地道英语口音。',
    level: 'beginner',
    category: '发音',
    icon: '🎤',
    lessons: 16,
    completedLessons: 10,
    duration: '9小时',
    students: 3900,
    rating: 4.8,
    tags: ['发音', '音标', '入门'],
    thumbnail: 'pronunciation',
  },
];

export const lessons: Lesson[] = [
  { id: '1-1', courseId: '1', title: '问候与介绍', titleEn: 'Greetings & Introductions', type: 'video', duration: '15分钟', completed: true },
  { id: '1-2', courseId: '1', title: '数字与时间', titleEn: 'Numbers & Time', type: 'video', duration: '20分钟', completed: true },
  { id: '1-3', courseId: '1', title: '购物对话', titleEn: 'Shopping Dialogue', type: 'audio', duration: '18分钟', completed: true },
  { id: '1-4', courseId: '1', title: '餐厅点餐', titleEn: 'Ordering at Restaurant', type: 'text', duration: '12分钟', completed: false },
  { id: '1-5', courseId: '1', title: '问路与交通', titleEn: 'Asking for Directions', type: 'video', duration: '22分钟', completed: false },
  { id: '1-6', courseId: '1', title: '天气与季节', titleEn: 'Weather & Seasons', type: 'audio', duration: '16分钟', completed: false },
];

export const practiceItems: PracticeItem[] = [
  {
    id: 'p1',
    type: 'vocabulary',
    question: '选择正确的单词完成句子：She ___ to the school every day.',
    options: ['walk', 'walks', 'walking', 'walked'],
    correctAnswer: 'walks',
    hint: '注意主语是第三人称单数',
    explanation: '主语 She 是第三人称单数，一般现在时中动词需要加 s/es。',
  },
  {
    id: 'p2',
    type: 'grammar',
    question: '填入正确的介词：I am interested ___ learning English.',
    options: ['in', 'on', 'at', 'for'],
    correctAnswer: 'in',
    hint: 'be interested 后面跟哪个介词？',
    explanation: 'be interested in 是固定搭配，表示"对...感兴趣"。',
  },
  {
    id: 'p3',
    type: 'vocabulary',
    question: '听音选词：选择你听到的单词',
    questionEn: 'The weather is very ___ today.',
    options: ['beautiful', 'beauty', 'beautify', 'beautifully'],
    correctAnswer: 'beautiful',
    hint: '这里需要一个形容词来修饰 weather',
    explanation: 'is 后面需要形容词作表语，beautiful 是形容词形式。',
  },
  {
    id: 'p4',
    type: 'grammar',
    question: '选择正确的时态：By the time we arrived, the movie ___.',
    options: ['started', 'has started', 'had started', 'was starting'],
    correctAnswer: 'had started',
    hint: '注意"By the time"引导的过去时间',
    explanation: '"By the time + 过去时" 主句用过去完成时 had done，表示"到...为止已经..."。',
  },
  {
    id: 'p5',
    type: 'speaking',
    question: '请用英语描述你今天的早餐',
    questionEn: 'Describe your breakfast today in English.',
    correctAnswer: 'I had bread and milk for breakfast this morning.',
    hint: '尝试使用 I had/ate... for breakfast 的句型',
    explanation: '描述饮食常用句型：I had/ate + 食物 + for breakfast/lunch/dinner.',
  },
  {
    id: 'p6',
    type: 'vocabulary',
    question: '选择与划线词意思最接近的选项：The task is quite difficult.',
    options: ['easy', 'hard', 'simple', 'quick'],
    correctAnswer: 'hard',
    hint: 'difficult 的同义词是什么？',
    explanation: 'difficult 和 hard 都表示"困难的"，是最常见的同义词替换。',
  },
  {
    id: 'p7',
    type: 'grammar',
    question: '选择正确的连词：___ it was raining, we went out for a walk.',
    options: ['Because', 'Although', 'Since', 'Therefore'],
    correctAnswer: 'Although',
    hint: '前后句是转折关系',
    explanation: 'Although 表示"虽然"，引导让步状语从句，前后句构成转折关系。',
  },
  {
    id: 'p8',
    type: 'speaking',
    question: '请用英语介绍你最喜欢的季节及原因',
    questionEn: 'Introduce your favorite season and explain why.',
    correctAnswer: 'My favorite season is spring because the weather is warm and the flowers are beautiful.',
    hint: '使用 My favorite... is... because... 的句型',
    explanation: '介绍喜好时可以用 My favorite... is... because... 结构，给出具体原因。',
  },
];

export const communityPosts: CommunityPost[] = [
  {
    id: 'c1',
    author: 'Sarah_Learner',
    avatar: '🧑‍🎓',
    title: '分享我的30天英语听力提升经验',
    content: '坚持每天听30分钟BBC，一个月后发现自己能听懂80%的内容了！关键是选择适合自己水平的材料，不要一开始就听太难的。',
    likes: 128,
    comments: 34,
    time: '2小时前',
    tags: ['听力', '经验分享'],
  },
  {
    id: 'c2',
    author: 'EnglishMaster2024',
    avatar: '👨‍🏫',
    title: '【挑战】7天词汇打卡活动',
    content: '每天学习20个新单词并造句，坚持7天的同学可以获得"词汇达人"徽章！快来参加吧~',
    likes: 256,
    comments: 89,
    time: '5小时前',
    tags: ['词汇', '挑战活动'],
    isChallenge: true,
  },
  {
    id: 'c3',
    author: 'GrammarNerd',
    avatar: '🤓',
    title: '求助：虚拟语气总是搞混，有什么好的记忆方法吗？',
    content: '每次做到虚拟语气的题目都会错，特别是与过去事实相反的情况，if had done 和 would have done 总是记不住顺序...',
    likes: 45,
    comments: 22,
    time: '1天前',
    tags: ['语法', '求助'],
  },
  {
    id: 'c4',
    author: 'TravelWithEnglish',
    avatar: '🌍',
    title: '在伦敦用英语点餐的有趣经历',
    content: '第一次在英国餐厅点餐，把"soup"说成了"soap"，服务员愣了一下然后很友善地确认了我的订单。语言错误其实是最好的学习机会！',
    likes: 312,
    comments: 56,
    time: '2天前',
    tags: ['口语', '趣事'],
  },
  {
    id: 'c5',
    author: 'BookWorm_EN',
    avatar: '📖',
    title: '推荐5本适合中级学习者的英文原版书',
    content: '1. Charlotte\'s Web 2. Wonder 3. The Giver 4. Holes 5. The House on Mango Street. 这些书词汇量适中，故事引人入胜，非常适合用来提升阅读能力。',
    likes: 189,
    comments: 41,
    time: '3天前',
    tags: ['阅读', '推荐'],
  },
];

export const learningStats: LearningStats = {
  totalStudyTime: 2680,
  todayStudyTime: 45,
  coursesCompleted: 1,
  wordsLearned: 580,
  streakDays: 12,
  weeklyData: [
    { day: '周一', minutes: 35 },
    { day: '周二', minutes: 50 },
    { day: '周三', minutes: 25 },
    { day: '周四', minutes: 60 },
    { day: '周五', minutes: 40 },
    { day: '周六', minutes: 75 },
    { day: '周日', minutes: 45 },
  ],
  testScores: [
    { date: '第1周', score: 72, type: '词汇测试' },
    { date: '第2周', score: 78, type: '词汇测试' },
    { date: '第3周', score: 85, type: '语法测试' },
    { date: '第4周', score: 82, type: '听力测试' },
    { date: '第5周', score: 90, type: '词汇测试' },
    { date: '第6周', score: 88, type: '综合测试' },
  ],
};

export const recommendedCourses = ['4', '5', '2'];

export const levelLabels: Record<string, string> = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '高级',
};

export const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-sky-100 text-sky-700',
  advanced: 'bg-orange-100 text-orange-700',
};

// ========== Typing Practice Data ==========

export type FingerType = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky' | 'thumb';

export interface TypingWord {
  text: string;
  finger: FingerType;
  grammar?: string;
}

export interface WordPhonetic {
  text: string;
  phonetic: string;
  pos: string; // part of speech, e.g. '动词', '副词'
}

export interface TypingSentence {
  id: string;
  sentence: string;
  translation: string;
  grammar: string;
  words: TypingWord[];
  image?: string;
  phonetics?: WordPhonetic[]; // e.g. [{ text: 'Wake', phonetic: '/weɪk/', pos: '动词' }]
  grammarRole?: string; // e.g. '谓语（短语动词）'
}

export interface TypingLesson {
  id: string;
  title: string;
  titleEn: string;
  titleCn: string;
  sentences: TypingSentence[];
}

export const typingLessons: TypingLesson[] = [
  {
    id: 't1',
    title: 'Lesson 1: Morning Wake-Up',
    titleEn: 'Morning Wake-Up',
    titleCn: '第一课：早晨起床',
    sentences: [
      {
        id: 't1-1',
        sentence: 'I wake up early.',
        translation: '我早起。',
        grammar: '/主语/+/谓语/+/副词/',
        grammarRole: '谓语（短语动词）',
        phonetics: [
          { text: 'I', phonetic: '/aɪ/', pos: '代词' },
          { text: 'wake', phonetic: '/weɪk/', pos: '动词' },
          { text: 'up', phonetic: '/p/', pos: '副词' },
          { text: 'early', phonetic: '/ˈɜːrli/', pos: '副词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'wake', finger: 'left-index', grammar: '谓语' },
          { text: 'up', finger: 'left-middle', grammar: '副词' },
          { text: 'early.', finger: 'right-index', grammar: '副词' },
        ],
      },
      {
        id: 't1-2',
        sentence: 'I wash my face.',
        translation: '我洗脸。',
        grammar: '/主语/+/谓语/+/宾语/',
        grammarRole: '谓语（及物动词）',
        phonetics: [
          { text: 'I', phonetic: '/aɪ/', pos: '代词' },
          { text: 'wash', phonetic: '/wɑːʃ/', pos: '动词' },
          { text: 'my', phonetic: '/maɪ/', pos: '代词' },
          { text: 'face', phonetic: '/feɪs/', pos: '名词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'wash', finger: 'left-index', grammar: '谓语' },
          { text: 'my', finger: 'right-index', grammar: '定语' },
          { text: 'face.', finger: 'left-middle', grammar: '宾语' },
        ],
      },
      {
        id: 't1-3',
        sentence: 'I brush my teeth.',
        translation: '我刷牙。',
        grammar: '/主语/+/谓语/+/宾语/',
        grammarRole: '谓语（及物动词）',
        phonetics: [
          { text: 'I', phonetic: '/aɪ/', pos: '代词' },
          { text: 'brush', phonetic: '/brʌʃ/', pos: '动词' },
          { text: 'my', phonetic: '/maɪ/', pos: '代词' },
          { text: 'teeth', phonetic: '/tiːθ/', pos: '名词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'brush', finger: 'left-index', grammar: '谓语' },
          { text: 'my', finger: 'right-index', grammar: '定语' },
          { text: 'teeth.', finger: 'right-middle', grammar: '宾语' },
        ],
      },
      {
        id: 't1-4',
        sentence: 'I eat my breakfast.',
        translation: '我吃早餐。',
        grammar: '/主语/+/谓语/+/宾语/',
        grammarRole: '谓语（及物动词）',
        phonetics: [
          { text: 'I', phonetic: '/a/', pos: '代词' },
          { text: 'eat', phonetic: '/iːt/', pos: '动词' },
          { text: 'my', phonetic: '/maɪ/', pos: '代词' },
          { text: 'breakfast', phonetic: '/ˈbrekfəst/', pos: '名词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'eat', finger: 'left-middle', grammar: '谓语' },
          { text: 'my', finger: 'right-index', grammar: '定语' },
          { text: 'breakfast.', finger: 'right-ring', grammar: '宾语' },
        ],
      },
      {
        id: 't1-5',
        sentence: 'I go to school.',
        translation: '我去上学。',
        grammar: '/主语/+/谓语/+/介词短语/',
        grammarRole: '谓语（不及物动词）',
        phonetics: [
          { text: 'I', phonetic: '/aɪ/', pos: '代词' },
          { text: 'go', phonetic: '/ɡoʊ/', pos: '动词' },
          { text: 'to', phonetic: '/tuː/', pos: '介词' },
          { text: 'school', phonetic: '/skuːl/', pos: '名词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'go', finger: 'left-middle', grammar: '谓语' },
          { text: 'to', finger: 'right-index', grammar: '介词' },
          { text: 'school.', finger: 'left-index', grammar: '宾语' },
        ],
      },
    ],
  },
  {
    id: 't2',
    title: 'Lesson 2: At School',
    titleEn: 'At School',
    titleCn: '第二课：在学校',
    sentences: [
      {
        id: 't2-1',
        sentence: 'I read a book.',
        translation: '我读一本书。',
        grammar: '/主语/+/谓语/+/宾语/',
        grammarRole: '谓语（及物动词）',
        phonetics: [
          { text: 'I', phonetic: '/aɪ/', pos: '代词' },
          { text: 'read', phonetic: '/riːd/', pos: '动词' },
          { text: 'a', phonetic: '/ə/', pos: '冠词' },
          { text: 'book', phonetic: '/bʊk/', pos: '名词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'read', finger: 'left-index', grammar: '谓语' },
          { text: 'a', finger: 'left-pinky', grammar: '冠词' },
          { text: 'book.', finger: 'left-index', grammar: '宾语' },
        ],
      },
      {
        id: 't2-2',
        sentence: 'I write my name.',
        translation: '我写我的名字。',
        grammar: '/主语/+/谓语/+/宾语/',
        grammarRole: '谓语（及物动词）',
        phonetics: [
          { text: 'I', phonetic: '/aɪ/', pos: '代词' },
          { text: 'write', phonetic: '/raɪt/', pos: '动词' },
          { text: 'my', phonetic: '/maɪ/', pos: '代词' },
          { text: 'name', phonetic: '/neɪm/', pos: '名词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'write', finger: 'right-index', grammar: '谓语' },
          { text: 'my', finger: 'right-middle', grammar: '定语' },
          { text: 'name.', finger: 'left-middle', grammar: '宾语' },
        ],
      },
      {
        id: 't2-3',
        sentence: 'I listen to the teacher.',
        translation: '我听老师讲课。',
        grammar: '/主语/+/谓语/+/介词短语/',
        grammarRole: '谓语（不及物动词）',
        phonetics: [
          { text: 'I', phonetic: '/aɪ/', pos: '代词' },
          { text: 'listen', phonetic: '/ˈlɪsn/', pos: '动词' },
          { text: 'to', phonetic: '/tuː/', pos: '介词' },
          { text: 'the', phonetic: '/ðə/', pos: '冠词' },
          { text: 'teacher', phonetic: '/ˈtiːtʃər/', pos: '名词' },
        ],
        words: [
          { text: 'I', finger: 'left-pinky', grammar: '主语' },
          { text: 'listen', finger: 'left-index', grammar: '谓语' },
          { text: 'to', finger: 'right-index', grammar: '介词' },
          { text: 'the', finger: 'left-middle', grammar: '冠词' },
          { text: 'teacher.', finger: 'right-ring', grammar: '宾语' },
        ],
      },
    ],
  },
  {
    id: 't3',
    title: 'Lesson 3: Daily Activities',
    titleEn: 'Daily Activities',
    titleCn: '第三课：日常活动',
    sentences: [
      {
        id: 't3-1',
        sentence: 'She plays the piano.',
        translation: '她弹钢琴。',
        grammar: '/主语/+/谓语/+/宾语/',
        grammarRole: '谓语（及物动词）',
        phonetics: [
          { text: 'She', phonetic: '/ʃiː/', pos: '代词' },
          { text: 'plays', phonetic: '/pleɪz/', pos: '动词' },
          { text: 'the', phonetic: '/ðə/', pos: '冠词' },
          { text: 'piano', phonetic: '/piˈænoʊ/', pos: '名词' },
        ],
        words: [
          { text: 'She', finger: 'left-middle', grammar: '主语' },
          { text: 'plays', finger: 'left-index', grammar: '谓语' },
          { text: 'the', finger: 'left-middle', grammar: '冠词' },
          { text: 'piano.', finger: 'right-ring', grammar: '宾语' },
        ],
      },
      {
        id: 't3-2',
        sentence: 'He runs very fast.',
        translation: '他跑得很快。',
        grammar: '/主语/+/谓语/+/副词/',
        grammarRole: '谓语（不及物动词）',
        phonetics: [
          { text: 'He', phonetic: '/hiː/', pos: '代词' },
          { text: 'runs', phonetic: '/rʌnz/', pos: '动词' },
          { text: 'very', phonetic: '/ˈveri/', pos: '副词' },
          { text: 'fast', phonetic: '/fæst/', pos: '副词' },
        ],
        words: [
          { text: 'He', finger: 'left-middle', grammar: '主语' },
          { text: 'runs', finger: 'left-index', grammar: '谓语' },
          { text: 'very', finger: 'right-index', grammar: '副词' },
          { text: 'fast.', finger: 'left-index', grammar: '副词' },
        ],
      },
      {
        id: 't3-3',
        sentence: 'We study English together.',
        translation: '我们一起学英语。',
        grammar: '/主语/+/谓语/+/宾语/+/副词/',
        grammarRole: '谓语（及物动词）',
        phonetics: [
          { text: 'We', phonetic: '/wiː/', pos: '代词' },
          { text: 'study', phonetic: '/ˈstʌdi/', pos: '动词' },
          { text: 'English', phonetic: '/ˈŋɡlɪʃ/', pos: '名词' },
          { text: 'together', phonetic: '/təˈɡeðər/', pos: '副词' },
        ],
        words: [
          { text: 'We', finger: 'right-index', grammar: '主语' },
          { text: 'study', finger: 'left-index', grammar: '谓语' },
          { text: 'English', finger: 'right-middle', grammar: '宾语' },
          { text: 'together.', finger: 'right-ring', grammar: '副词' },
        ],
      },
    ],
  },
];

// Finger color mapping for keyboard
export const fingerColors: Record<FingerType, string> = {
  'left-pinky': '#A78BFA',    // purple
  'left-ring': '#818CF8',     // indigo
  'left-middle': '#38BDF8',   // sky blue
  'left-index': '#34D399',    // emerald
  'right-index': '#FBBF24',   // amber
  'right-middle': '#FB923C',  // orange
  'right-ring': '#F87171',    // red
  'right-pinky': '#E879F9',   // fuchsia
  'thumb': '#94A3B8',         // slate
};

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
