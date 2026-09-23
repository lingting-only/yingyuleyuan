'use client';

// 打字战斗游戏页：支持字母模式和拼写模式两种玩法
// 字母模式：每次出现一个单词，每个字母都是敌人，输入正确字母发射子弹击杀
// 拼写模式：显示中文意思，输入完整英文单词自动攻击击杀敌人
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Library, Volume2, VolumeX } from 'lucide-react';
import { useTypingGame } from '@/hooks/use-typing-game';
import { useSpellGame } from '@/hooks/use-spell-game';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { loadGameWords, type GameWords, type GameWord, type FireEvent, type GameMode, SPELL_NEXT_WORD_DELAY } from '@/lib/game';
import { getGameBest, setGameBest, getSoundEnabled, setSoundEnabled, type GameBest } from '@/lib/storage';
import { setSoundMuted, isSoundMuted } from '@/lib/sounds';
import { GameArena } from '@/components/game/game-arena';
import { SpellArena } from '@/components/game/spell-arena';
import { GameHud } from '@/components/game/game-hud';
import { GameStart } from '@/components/game/game-start';
import { GameOver } from '@/components/game/game-over';
import { SpellGameOver } from '@/components/game/spell-game-over';
import { BulletLayer, type Bullet } from '@/components/game/bullet-layer';
import VirtualKeyboard from '@/components/typing/virtual-keyboard';
import { ParticleBurst } from '@/components/typing/particle-burst';
import { ComboBanner, ScreenFlash, ErrorCrack, getComboMilestone } from '@/components/typing/combo-effects';
import { TopBar } from '@/components/layout/header';
import { wordBankIndex } from '@/lib/wordbank';
import { getSelectedLessonId } from '@/lib/storage';
import { cn } from '@/lib/utils';

export default function GamePage() {
  const [gameWords, setGameWords] = useState<GameWords | null>(null);
  const [best, setBest] = useState<GameBest>({ score: 0, kills: 0, maxCombo: 0, survived: 0 });
  const [isNewBest, setIsNewBest] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('letter');

  // ===== 字母模式状态 =====
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [deathBursts, setDeathBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const arenaWrapRef = useRef<HTMLDivElement>(null);
  const keyboardWrapRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef<string>('idle');
  const speakingRef = useRef(false);

  // ===== 拼写模式状态 =====
  const [spellInput, setSpellInput] = useState('');
  const [spellIsError, setSpellIsError] = useState(false);

  // ===== 音频开关（默认开启） =====
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => getSoundEnabled());

  // 同步静音标志到音效模块（初始 + 切换）
  useEffect(() => {
    setSoundMuted(!soundEnabled);
  }, [soundEnabled]);

  // 切换音频开关
  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next); // 持久化
      return next;
    });
  }, []);

  // 朗读单词
  const speakWord = useCallback((text: string) => {
    if (isSoundMuted()) return; // 关闭声音时不朗读
    if (!('speechSynthesis' in window)) return;
    if (speakingRef.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speakingRef.current = true;
    const reset = () => {
      speakingRef.current = false;
    };
    utterance.onend = reset;
    utterance.onerror = reset;
    speechSynthesis.speak(utterance);
  }, []);

  // ===== 字母模式引擎 =====
  const handleFire = useCallback((e: FireEvent) => {
    const arena = arenaWrapRef.current;
    if (!arena) return;
    const ar = arena.getBoundingClientRect();
    const toX = ar.left + (e.x / 100) * ar.width;
    const toY = ar.top + (e.y / 100) * ar.height;

    let fromX = window.innerWidth / 2;
    let fromY = window.innerHeight - 120;
    const kb = keyboardWrapRef.current;
    if (kb) {
      const btn = Array.from(kb.querySelectorAll('button')).find(
        (b) => b.textContent?.trim().toLowerCase() === e.char
      );
      if (btn) {
        const r = btn.getBoundingClientRect();
        fromX = r.left + r.width / 2;
        fromY = r.top + r.height / 2;
      }
    }

    setBullets((prev) => [
      ...prev,
      { id: e.enemyId, char: e.char, fromX, fromY, toX, toY },
    ]);
  }, []);

  const letterGame = useTypingGame({ onFire: handleFire, onWrong: () => word && speakWord(word.text) });
  const { phase, word, typed, enemies, floats, stats, shakeKey, flashKey, comboBannerKey, nextChar } = letterGame.snapshot;
  const { killEnemy, removeEnemy, removeFloat } = letterGame;

  const handleBulletArrive = useCallback(
    (id: number) => {
      const pos = killEnemy(id);
      setBullets((prev) => prev.filter((b) => b.id !== id));
      if (pos) {
        const arena = arenaWrapRef.current;
        if (arena) {
          const r = arena.getBoundingClientRect();
          const x = r.left + (pos.x / 100) * r.width;
          const y = r.top + (pos.y / 100) * r.height;
          setDeathBursts((prev) => [...prev, { id, x, y }]);
        }
      }
    },
    [killEnemy]
  );

  // ===== 拼写模式引擎 =====
  const spellGame = useSpellGame({
    onKill: () => {
      // 先显示完整单词，延迟到切割动画结束再清空输入（不依赖死亡动画回调，避免竞态）
      setSpellIsError(false);
      setTimeout(() => setSpellInput(''), SPELL_NEXT_WORD_DELAY);
    },
    onWrong: (word) => {
      setSpellIsError(true);
      setTimeout(() => setSpellIsError(false), 500);
      if (word) speakWord(word); // 输错时朗读单词（受音频开关控制）
    },
  });
  const { snapshot: spellSnapshot, start: spellStart, pause: spellPause, resume: spellResume, removeEnemy: spellRemoveEnemy } = spellGame;
  const { phase: spellPhase, enemy: spellEnemy, stats: spellStats, shakeKey: spellShakeKey, burstKey: spellBurstKey } = spellSnapshot;
  // 击中特效 key 位于敌人实体上
  const spellHitKey = spellEnemy?.hitKey ?? 0;

  // 死亡动画结束：移除敌人实体（输入清空已由 onKill 延迟处理）
  const handleSpellDeathEnd = useCallback(() => {
    spellRemoveEnemy();
  }, [spellRemoveEnemy]);

  // ===== 共享状态 =====
  const [showBankPicker, setShowBankPicker] = useState(false);

  // 挂载：加载词库单词与历史纪录
  useEffect(() => {
    loadGameWords().then(setGameWords).catch(console.error);
    setBest(getGameBest());
  }, []);

  // 新单词出现时自动朗读（字母模式）
  const wordText = word?.text;
  useEffect(() => {
    if (phase === 'running' && wordText) {
      const t = setTimeout(() => speakWord(wordText), 60);
      return () => clearTimeout(t);
    }
  }, [wordText, phase, speakWord]);

  // 新敌人出现时自动朗读（拼写模式）：用 enemy.id 触发，确保每个新敌人都朗读
  const spellEnemyId = spellEnemy?.id;
  const spellWordText = spellEnemy?.word;
  useEffect(() => {
    if (spellPhase === 'running' && spellWordText) {
      const t = setTimeout(() => speakWord(spellWordText), 60);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spellEnemyId, spellPhase]);

  // 派生统计：WPM 与准确率
  const wpm = useMemo(() => {
    const minutes = stats.elapsed / 60;
    if (minutes <= 0 || stats.correctChars === 0) return 0;
    return Math.round(stats.correctChars / 5 / minutes);
  }, [stats.elapsed, stats.correctChars]);

  const accuracy = useMemo(() => {
    const total = stats.correctChars + stats.wrongChars;
    if (total === 0) return 100;
    return Math.round((stats.correctChars / total) * 100);
  }, [stats.correctChars, stats.wrongChars]);

  const spellAccuracy = useMemo(() => {
    const total = spellStats.correctWords + spellStats.wrongWords;
    if (total === 0) return 100;
    return Math.round((spellStats.correctWords / total) * 100);
  }, [spellStats.correctWords, spellStats.wrongWords]);

  // 游戏结束：写最高纪录（字母模式）
  useEffect(() => {
    if (phase === 'over' && prevPhaseRef.current !== 'over') {
      const prevBest = getGameBest();
      const next = setGameBest({
        score: stats.score,
        kills: stats.kills,
        maxCombo: stats.maxCombo,
        survived: stats.elapsed,
      });
      setBest(next);
      setIsNewBest(stats.score > prevBest.score);
    }
    prevPhaseRef.current = phase;
  }, [phase, stats.score, stats.kills, stats.maxCombo, stats.elapsed]);

  // 用指定词库启动游戏（切换词库后立即重启也走这里）
  const startGame = useCallback((target: GameWord[]) => {
    if (!target || target.length === 0) return;
    setIsNewBest(false);
    setBullets([]);
    setDeathBursts([]);
    setSpellInput('');
    setSpellIsError(false);

    if (gameMode === 'spell') {
      spellStart(target);
    } else {
      letterGame.start(target);
    }
  }, [gameMode, letterGame.start, spellStart]);

  // 开始游戏（使用当前词库）
  const handleStart = useCallback(() => {
    if (!gameWords || gameWords.words.length === 0) return;
    startGame(gameWords.words);
  }, [gameWords, startGame]);

  const handleSelectMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
  }, []);

  const handleSelectBank = useCallback(async (bankId: string) => {
    setShowBankPicker(false);
    const { setSelectedLessonId } = await import('@/lib/storage');
    setSelectedLessonId(bankId);
    const { loadGameWords: load } = await import('@/lib/game');
    const words = await load();
    setGameWords(words);
    // 切换词库后立即用新词库重新开始游戏
    if (words.words.length > 0) {
      startGame(words.words);
    }
  }, [startGame]);

  // 全局键盘输入
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentPhase = gameMode === 'spell' ? spellPhase : phase;

      if (currentPhase === 'idle' || currentPhase === 'over') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleStart();
        }
        return;
      }
      if (currentPhase === 'paused') {
        e.preventDefault();
        if (gameMode === 'spell') {
          spellResume();
        } else {
          letterGame.resume();
        }
        return;
      }
      if (gameMode === 'letter') {
        if (letterGame.handleKey(e.key)) {
          e.preventDefault();
        }
      } else if (gameMode === 'spell') {
        // 拼写模式：处理 Backspace 和字母键
        if (e.key === 'Backspace') {
          e.preventDefault();
          setSpellInput((prev) => {
            const next = prev.slice(0, -1);
            spellGame.handleInput(next);
            setSpellIsError(false);
            return next;
          });
          return;
        }
        // 只处理字母键
        if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setSpellInput((prev) => {
            const ch = e.key.toLowerCase();
            const next = prev + ch;
            const result = spellGame.handleInput(next);
            if (result === 'ignore') {
              // 无效状态（等待/死亡动画中）：忽略输入，不累积
              return prev;
            }
            if (result === 'mismatch') {
              // 输错：清空错误字母，保留已正确输入的前缀
              setSpellIsError(true);
              return prev;
            }
            if (result === 'match') {
              // 完整命中：先显示完整单词，待死亡动画结束后再清空
              setSpellIsError(false);
              return next;
            }
            // 前缀匹配：正常追加
            setSpellIsError(false);
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameMode, phase, spellPhase, handleStart, letterGame, spellResume, spellGame]);

  // 失焦/切页自动暂停
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (gameMode === 'spell') {
          spellPause();
        } else {
          letterGame.pause();
        }
      }
    };
    const onBlur = () => {
      if (gameMode === 'spell') {
        spellPause();
      } else {
        letterGame.pause();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [gameMode, letterGame.pause, spellPause]);

  // 完成单词的粒子爆发中心
  const burstScreen = useMemo(() => {
    if (flashKey === 0 || !letterGame.snapshot.burstCenter) return null;
    const el = arenaWrapRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: r.left + (letterGame.snapshot.burstCenter.x / 100) * r.width,
      y: r.top + (letterGame.snapshot.burstCenter.y / 100) * r.height,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashKey]);

  const milestone = getComboMilestone(stats.combo);

  // 当前模式的状态
  const currentStats = gameMode === 'spell' ? spellStats : stats;
  const currentWpm = gameMode === 'spell' ? 0 : wpm;

  return (
    <div className="h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#030016] dark:via-[#07071f] dark:to-[#0a0a2e] flex flex-col">
      <TopBar>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Dialog open={showBankPicker} onOpenChange={setShowBankPicker}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-1.5 py-1 transition-colors cursor-pointer">
                <Library className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {gameWords?.bankTitle || '加载中…'}
                </span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  ({currentStats.kills}/{gameWords?.total ?? 0})
                </span>
                <span className={cn(
                  'shrink-0',
                  gameMode === 'spell' ? 'text-emerald-500' : 'text-purple-400'
                )}>
                  {gameMode === 'spell' ? '拼写' : '字母'}
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>选择词库</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                {wordBankIndex.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => handleSelectBank(bank.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors',
                      getSelectedLessonId() === bank.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-foreground">{bank.titleCn}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{bank.count} {bank.type === 'word' ? '词' : '句'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{bank.description || bank.preview}</span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* 音频开关 */}
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 hover:bg-muted/50 rounded-md px-1.5 py-1 transition-colors cursor-pointer"
            title={soundEnabled ? '关闭声音' : '开启声音'}
            aria-label={soundEnabled ? '关闭声音' : '开启声音'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sky-500 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </div>
      </TopBar>

      <div className="flex-1 min-h-0 flex flex-col items-center gap-1 md:gap-2 px-2 md:px-4 pt-2 md:pt-3 pb-0 overflow-hidden">
        <GameHud stats={currentStats} wpm={currentWpm} />

        {/* 战场 */}
        <div ref={arenaWrapRef} className="w-full max-w-4xl flex-1 min-h-[320px] flex">
          {gameMode === 'spell' ? (
            // 拼写模式战场
            <SpellArena
              enemy={spellPhase === 'idle' || spellPhase === 'over' ? null : spellEnemy}
              inputValue={spellInput}
              isError={spellIsError}
              shakeKey={spellShakeKey}
              hitKey={spellHitKey}
              burstKey={spellBurstKey}
              onDeathEnd={handleSpellDeathEnd}
            >
              {spellPhase === 'idle' && (
                <GameStart
                  bankTitle={gameWords?.bankTitle ?? ''}
                  wordCount={gameWords?.total ?? 0}
                  unit={gameWords?.type === 'sentence' ? '句' : '词'}
                  gameMode="spell"
                  onStart={handleStart}
                  onSelectMode={handleSelectMode}
                />
              )}
              {spellPhase === 'paused' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 backdrop-blur-md bg-white/60 dark:bg-[#070b18]/60">
                  <p className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">按任意键继续</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">战斗已暂停</p>
                </div>
              )}
              {spellPhase === 'over' && (
                <SpellGameOver
                  stats={spellStats}
                  accuracy={spellAccuracy}
                  onRestart={handleStart}
                />
              )}
            </SpellArena>
          ) : (
            // 字母模式战场
            <GameArena
              word={phase === 'idle' || phase === 'over' ? null : word}
              typed={typed}
              enemies={enemies}
              floats={floats}
              shakeKey={shakeKey}
              onDeathEnd={removeEnemy}
              onFloatEnd={removeFloat}
            >
              {phase === 'idle' && (
                <GameStart
                  bankTitle={gameWords?.bankTitle ?? ''}
                  wordCount={gameWords?.total ?? 0}
                  unit={gameWords?.type === 'sentence' ? '句' : '词'}
                  gameMode={gameMode}
                  onStart={handleStart}
                  onSelectMode={handleSelectMode}
                />
              )}
              {phase === 'paused' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 backdrop-blur-md bg-white/60 dark:bg-[#070b18]/60">
                  <p className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">按任意键继续</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">战斗已暂停</p>
                </div>
              )}
              {phase === 'over' && (
                <GameOver
                  stats={stats}
                  wpm={wpm}
                  accuracy={accuracy}
                  best={best}
                  isNewBest={isNewBest}
                  onRestart={handleStart}
                />
              )}
            </GameArena>
          )}
        </div>

        {/* 字母模式底部虚拟键盘，仅运行时显示 */}
        {phase === 'running' && gameMode === 'letter' && (
          <div ref={keyboardWrapRef} className="w-full shrink-0">
            <VirtualKeyboard
              nextKey={nextChar}
              onKeyPress={letterGame.handleKey}
              showFingerGuide={false}
              showFingerBars
              rippleKey={milestone ? comboBannerKey : 0}
              compact
            />
          </div>
        )}
      </div>

      {/* 字母模式特效 */}
      {gameMode === 'letter' && (
        <>
          <BulletLayer bullets={bullets} onArrive={handleBulletArrive} />
          <ParticleBurst burstKey={flashKey} center={burstScreen} />
          {deathBursts.map((b) => (
            <ParticleBurst
              key={b.id}
              burstKey={1}
              center={{ x: b.x, y: b.y }}
              onFinish={() => setDeathBursts((prev) => prev.filter((x) => x.id !== b.id))}
            />
          ))}
          <ComboBanner combo={stats.combo} triggerKey={comboBannerKey} />
          <ScreenFlash triggerKey={comboBannerKey} />
          <ErrorCrack triggerKey={shakeKey} />
        </>
      )}
    </div>
  );
}
