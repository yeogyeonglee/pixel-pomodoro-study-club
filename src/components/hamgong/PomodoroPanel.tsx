import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";
import {
  advance,
  durationOf,
  formatClock,
  remainingOf,
  type TimerMode,
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

export function PomodoroPanel({
  timer,
  onAction,
}: {
  timer: TimerState;
  onAction: (kind: "start" | "pause" | "reset" | TimerMode) => void;
}) {
  const { view, remaining } = useTimerView(timer);
  const total = durationOf(view.mode);
  const progress = 1 - remaining / total;
  const blocks = 12;
  const filled = Math.round(progress * blocks);

  // chime + toast when a phase rolls over
  const prev = useRef<{ mode: TimerMode; cycles: number } | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (p && view.running && (p.mode !== view.mode || p.cycles !== view.cycles)) {
      playChime(view.mode);
      toast(view.mode === "break" ? "🍅 25분 집중 끝! 5분 쉬어가요" : "✏️ 다시 25분 집중 시작!");
    }
    prev.current = { mode: view.mode, cycles: view.cycles };
  }, [view.mode, view.cycles, view.running]);

  useEffect(() => {
    const label = view.mode === "focus" ? "공부중" : "쉬는중";
    document.title = view.running ? `${formatClock(remaining)} ${label} · 함공` : "함공 · 3인 캠스터디";
  }, [remaining, view.mode, view.running]);

  return (
    <PixelPanel id="timer" title="뽀모도로 타이머" icon={<Timer className="h-4 w-4" />}>
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
            {m === "focus" ? "공부 25분" : "휴식 5분"}
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
            <Play className="h-4 w-4" /> 다같이 시작
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
