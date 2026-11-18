import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";
import {
  advance,
  durationOf,
  formatClock,
  PRESETS,
  remainingOf,
  type TimerMode,
  type TimerPreset,
  type TimerState,
} from "@/lib/room/timer";
import { playChime } from "@/lib/room/chime";
import { cn } from "@/lib/utils";
import { PixelButton } from "./PixelButton";
import { PixelPanel } from "./PixelPanel";

export function useTimerView(timer: TimerState) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);
  const view = advance(timer, now);
  return { view, remaining: remainingOf(view, now) };
}

const minutes = (ms: number) => Math.round(ms / 60000);

export function PomodoroPanel({
  timer,
  onAction,
  onPreset,
  title = "뽀모도로 타이머",
  startLabel = "다같이 시작",
}: {
  timer: TimerState;
  onAction: (kind: "start" | "pause" | "reset" | TimerMode) => void;
  onPreset: (preset: TimerPreset) => void;
  title?: string;
  startLabel?: string;
}) {
  const { view, remaining } = useTimerView(timer);
  const total = durationOf(view.mode, view.preset);
  const set = PRESETS[view.preset];
  const progress = 1 - remaining / total;
  const blocks = 12;
  const filled = Math.round(progress * blocks);

  // chime + toast when a phase rolls over
  const prev = useRef<{ mode: TimerMode; cycles: number } | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (p && view.running && (p.mode !== view.mode || p.cycles !== view.cycles)) {
      playChime(view.mode);
      toast(
        view.mode === "break"
          ? `🍅 ${minutes(set.focus)}분 집중 끝! ${minutes(set.break)}분 쉬어가요`
          : `✏️ 다시 ${minutes(set.focus)}분 집중 시작!`,
      );
    }
    prev.current = { mode: view.mode, cycles: view.cycles };
  }, [view.mode, view.cycles, view.running, set.focus, set.break]);

  useEffect(() => {
    const label = view.mode === "focus" ? "공부중" : "쉬는중";
    document.title = view.running ? `${formatClock(remaining)} ${label} · 함공` : "함공 · 3인 캠스터디";
  }, [remaining, view.mode, view.running]);

  return (
    <PixelPanel id="timer" title={title} icon={<Timer className="h-4 w-4" />}>
      <div className="mb-2 grid grid-cols-2 gap-1.5" role="group" aria-label="뽀모도로 세트">
        {([30, 60] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={view.preset === p}
            onClick={() => view.preset !== p && onPreset(p)}
            className={cn(
              "flex flex-col items-center py-1.5 leading-tight pixel-border",
              view.preset === p ? "bg-butter" : "bg-paper text-ink-soft hover:bg-muted",
            )}
          >
            <span className="font-display text-sm">{p}분 세트</span>
            <span className="text-[10px]">
              공부 {minutes(PRESETS[p].focus)} + 휴식 {minutes(PRESETS[p].break)}
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {(["focus", "break"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onAction(m)}
            className={cn(
              "flex-1 py-1 font-pixel text-xs pixel-border",
              view.mode === m ? (m === "focus" ? "bg-pink" : "bg-mint") : "bg-muted text-ink-soft",
            )}
          >
            {m === "focus" ? `공부 ${minutes(set.focus)}분` : `휴식 ${minutes(set.break)}분`}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mt-3 flex flex-col items-center bg-screen py-4 pixel-inset",
          view.mode === "focus" ? "text-pink" : "text-screen-foreground",
        )}
      >
        <span className="font-tiny text-[10px] tracking-widest">
          {view.mode === "focus" ? "♥ STUDY ♥" : "☕ BREAK ☕"}
        </span>
        <span className="font-display text-5xl leading-none tabular-nums" aria-live="polite">
          {formatClock(remaining)}
        </span>
        <div className="mt-3 flex gap-[3px]" aria-hidden>
          {Array.from({ length: blocks }).map((_, i) => (
            <span
              key={i}
              className={cn("h-2.5 w-2.5", i < filled ? "bg-butter" : "bg-ink-soft")}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {view.running ? (
          <PixelButton tone="butter" className="flex-1" onClick={() => onAction("pause")}>
            <Pause className="h-4 w-4" /> 일시정지
          </PixelButton>
        ) : (
          <PixelButton tone="cy" className="flex-1" onClick={() => onAction("start")}>
            <Play className="h-4 w-4" /> {startLabel}
          </PixelButton>
        )}
        <PixelButton tone="paper" size="icon" className="h-9 w-9" onClick={() => onAction("reset")} aria-label="리셋">
          <RotateCcw className="h-4 w-4" />
        </PixelButton>
      </div>

      <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-ink-soft pt-2 text-[11px]">
        <span>
          오늘 완료 <span className="text-pink-deep">{"🍅".repeat(Math.min(view.cycles, 8)) || "-"}</span>
          {view.cycles > 8 && ` x${view.cycles}`}
        </span>
        {timer.by && <span className="truncate text-ink-soft">by {timer.by}</span>}
      </div>
    </PixelPanel>
  );
}
