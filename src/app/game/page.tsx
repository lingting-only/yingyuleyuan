'use client';

// 打字战斗游戏页：每次出现一个单词（显示中文并朗读），字母即敌人；
// 输入正确字母时从对应键位发射光波子弹击杀字母敌人，集齐全词完成击杀
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Library, X } from 'lucide-react';
import { useTypingGame } from '@/hooks/use-typing-game';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { loadGameWords, type GameWords, type FireEvent } from '@/lib/game';
import { getGameBest, setGameBest, type GameBest } from '@/lib/storage';
import { GameArena } from '@/components/game/game-arena';
import { GameHud } from '@/components/game/game-hud';
import { GameStart } from '@/components/game/game-start';
import { GameOver } from '@/components/game/game-over';
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
  const [bullets, setBullets] = useState<Bullet[]>([]);
  // 每个字母死亡时的粒子爆发点（屏幕坐标），完成后自动移除
  const [deathBursts, setDeathBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const arenaWrapRef = useRef<HTMLDivElement>(null);
  const keyboardWrapRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef<string>('idle');
  // 朗读并发控制
  const speakingRef = useRef(false);

  // 朗读单词（静默降级，播放中忽略重复触发）
  const speakWord = useCallback((text: string) => {
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

  // 引擎开火 → 从键位向敌人发射光波子弹
  const handleFire = useCallback((e: FireEvent) => {
    const arena = arenaWrapRef.current;
    if (!arena) return;
    const ar = arena.getBoundingClientRect();
    const toX = ar.left + (e.x / 100) * ar.width;
    const toY = ar.top + (e.y / 100) * ar.height;

    // 在虚拟键盘中找到对应字母键（按钮文本即大写字母）
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

  const { snapshot, start, pause, resume, handleKey, killEnemy, removeEnemy, removeFloat } =
    useTypingGame({ onFire: handleFire });
  const { phase, word, typed, enemies, floats, stats, shakeKey, flashKey, comboBannerKey, nextChar } =
    snapshot;

  // 子弹到达：触发敌人死亡动画，并在敌人位置做粒子爆发，同时移除子弹
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

  // 挂载：加载词库单词与历史纪录
  useEffect(() => {
    loadGameWords().then(setGameWords).catch(console.error);
    setBest(getGameBest());
  }, []);

  // 新单词出现时自动朗读
  const wordText = word?.text;
  useEffect(() => {
    if (phase === 'running' && wordText) {
      const t = setTimeout(() => speakWord(wordText), 60);
      return () => clearTimeout(t);
    }
  }, [wordText, phase, speakWord]);

  // 派生统计：WPM（按 5 字符一词）与准确率
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

  // 游戏结束：写最高纪录（只触发一次）
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

  const handleStart = useCallback(() => {
    if (!gameWords || gameWords.words.length === 0) return;
    setIsNewBest(false);
    setBullets([]);
    setDeathBursts([]);
    start(gameWords.words);
  }, [gameWords, start]);

  const handleSelectBank = useCallback(async (bankId: string) => {
    setShowBankPicker(false);
    const { setSelectedLessonId } = await import('@/lib/storage');
    setSelectedLessonId(bankId);
    const { loadGameWords: load } = await import('@/lib/game');
    const words = await load();
    setGameWords(words);
  }, []);

  // 全局键盘输入
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (phase === 'idle' || phase === 'over') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleStart();
        }
        return;
      }
      if (phase === 'paused') {
        // 暂停时按任意键恢复（该键不作为输入）
        e.preventDefault();
        resume();
        return;
      }
      if (handleKey(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handleKey, handleStart, resume]);

  // 失焦/切页自动暂停
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    const onBlur = () => pause();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [pause]);

  // 完成单词的粒子爆发中心：战场百分比 → 视口坐标（随 flashKey 记忆，避免每帧重算触发特效重启）
  const burstScreen = useMemo(() => {
    if (flashKey === 0 || !snapshot.burstCenter) return null;
    const el = arenaWrapRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: r.left + (snapshot.burstCenter.x / 100) * r.width,
      y: r.top + (snapshot.burstCenter.y / 100) * r.height,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashKey]);

  const milestone = getComboMilestone(stats.combo);

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
                  ({stats.kills}/{gameWords?.total ?? 0})
                </span>
                <span className="text-muted-foreground shrink-0">打字战斗</span>
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
        </div>
      </TopBar>

      <div className="flex-1 min-h-0 flex flex-col items-center gap-1 md:gap-2 px-2 md:px-4 pt-2 md:pt-3 pb-0 overflow-hidden">
        <GameHud stats={stats} wpm={wpm} />

        {/* 战场（包裹层用于换算子弹/粒子坐标） */}
        <div ref={arenaWrapRef} className="w-full max-w-4xl flex-1 min-h-[320px] flex">
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
                onStart={handleStart}
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
        </div>

        {/* 虚拟键盘：紧凑模式整体缩小 */}
        <div ref={keyboardWrapRef} className="w-full shrink-0">
          <VirtualKeyboard
            nextKey={phase === 'running' ? nextChar : ''}
            onKeyPress={handleKey}
            showFingerGuide={false}
            showFingerBars
            rippleKey={milestone ? comboBannerKey : 0}
            compact
          />
        </div>
      </div>

      {/* 光波子弹层 */}
      <BulletLayer bullets={bullets} onArrive={handleBulletArrive} />

      {/* 完成单词的粒子爆发 */}
      <ParticleBurst burstKey={flashKey} center={burstScreen} />

      {/* 每个字母死亡的粒子消散（与最后一个字母同款 canvas 爆发） */}
      {deathBursts.map((b) => (
        <ParticleBurst
          key={b.id}
          burstKey={1}
          center={{ x: b.x, y: b.y }}
          onFinish={() => setDeathBursts((prev) => prev.filter((x) => x.id !== b.id))}
        />
      ))}

      {/* 连击里程碑特效 */}
      <ComboBanner combo={stats.combo} triggerKey={comboBannerKey} />
      <ScreenFlash triggerKey={comboBannerKey} />

      {/* 受伤红屏 */}
      <ErrorCrack triggerKey={shakeKey} />
    </div>
  );
}
