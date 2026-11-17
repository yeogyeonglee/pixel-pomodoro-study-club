export const FOCUS_MS = 25 * 60 * 1000;
export const BREAK_MS = 5 * 60 * 1000;

export type TimerMode = "focus" | "break";

export type TimerState = {
  mode: TimerMode;
  running: boolean;
  /** Absolute end time (ms epoch) while running, otherwise null. */
  endsAt: number | null;
  /** Remaining ms while paused. */
  remainingMs: number;
  /** Completed focus sessions. */
  cycles: number;
  /** Last manual change time; the newest version wins when peers sync. */
  version: number;
  by: string;
};

export const durationOf = (mode: TimerMode) => (mode === "focus" ? FOCUS_MS : BREAK_MS);

export function initialTimer(): TimerState {
  return {
    mode: "focus",
    running: false,
    endsAt: null,
    remainingMs: FOCUS_MS,
    cycles: 0,
    version: 0,
    by: "",
  };
}

/** Roll a running timer forward through any phases that already finished. Deterministic per peer. */
export function advance(s: TimerState, now: number): TimerState {
  let cur = s;
  let guard = 0;
  while (cur.running && cur.endsAt !== null && now >= cur.endsAt && guard < 500) {
    const next: TimerMode = cur.mode === "focus" ? "break" : "focus";
    cur = {
      ...cur,
      mode: next,
      endsAt: cur.endsAt + durationOf(next),
      remainingMs: durationOf(next),
      cycles: cur.mode === "focus" ? cur.cycles + 1 : cur.cycles,
    };
    guard++;
  }
  return cur;
}

export function remainingOf(s: TimerState, now: number): number {
  if (s.running && s.endsAt !== null) return Math.max(0, s.endsAt - now);
  return s.remainingMs;
}

const nextVersion = (s: TimerState, now: number) => Math.max(now, s.version + 1);

export function startTimer(s: TimerState, now: number, by: string): TimerState {
  const cur = advance(s, now);
  if (cur.running) return cur;
  return { ...cur, running: true, endsAt: now + cur.remainingMs, version: nextVersion(cur, now), by };
}

export function pauseTimer(s: TimerState, now: number, by: string): TimerState {
  const cur = advance(s, now);
  if (!cur.running) return cur;
  return {
    ...cur,
    running: false,
    remainingMs: remainingOf(cur, now),
    endsAt: null,
    version: nextVersion(cur, now),
    by,
  };
}

export function resetTimer(s: TimerState, now: number, by: string): TimerState {
  const cur = advance(s, now);
  return {
    ...cur,
    running: false,
    endsAt: null,
    remainingMs: durationOf(cur.mode),
    version: nextVersion(cur, now),
    by,
  };
}

export function switchMode(s: TimerState, mode: TimerMode, now: number, by: string): TimerState {
  const cur = advance(s, now);
  return {
    ...cur,
    mode,
    running: false,
    endsAt: null,
    remainingMs: durationOf(mode),
    version: nextVersion(cur, now),
    by,
  };
}

/** Pick the state everyone should follow: the most recent manual change. */
export function pickNewer(a: TimerState, b: TimerState): TimerState {
  if (b.version > a.version) return b;
  if (b.version === a.version && b.by > a.by) return b;
  return a;
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
