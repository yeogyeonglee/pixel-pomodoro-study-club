const MIN = 60 * 1000;

export type TimerMode = "focus" | "break";
/** A Pomodoro set: 30 = 25 min focus + 5 min break, 60 = 50 min focus + 10 min break. */
export type TimerPreset = 30 | 60;

export const PRESETS: Record<TimerPreset, { focus: number; break: number }> = {
  30: { focus: 25 * MIN, break: 5 * MIN },
  60: { focus: 50 * MIN, break: 10 * MIN },
};

export type TimerState = {
  mode: TimerMode;
  running: boolean;
  /** Absolute end time (ms epoch) while running, otherwise null. */
  endsAt: number | null;
  /** Remaining ms while paused. */
  remainingMs: number;
  /** Completed focus sessions. */
  cycles: number;
  /** Which Pomodoro set the room uses. */
  preset: TimerPreset;
  /** Last manual change time; the newest version wins when peers sync. */
  version: number;
  by: string;
};

const presetOf = (s: { preset?: TimerPreset }): TimerPreset => (s.preset === 60 ? 60 : 30);

export const durationOf = (mode: TimerMode, preset: TimerPreset = 30) => PRESETS[preset][mode];

export function initialTimer(): TimerState {
  return {
    mode: "focus",
    running: false,
    endsAt: null,
    remainingMs: PRESETS[30].focus,
    cycles: 0,
    preset: 30,
    version: 0,
    by: "",
  };
}

/** Accept states from peers that may predate the preset field. */
export function normalizeTimer(s: TimerState): TimerState {
  return s.preset === 30 || s.preset === 60 ? s : { ...s, preset: presetOf(s) };
}

/** Roll a running timer forward through any phases that already finished. Deterministic per peer. */
export function advance(s: TimerState, now: number): TimerState {
  let cur = normalizeTimer(s);
  let guard = 0;
  while (cur.running && cur.endsAt !== null && now >= cur.endsAt && guard < 500) {
    const next: TimerMode = cur.mode === "focus" ? "break" : "focus";
    cur = {
      ...cur,
      mode: next,
      endsAt: cur.endsAt + durationOf(next, cur.preset),
      remainingMs: durationOf(next, cur.preset),
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
    remainingMs: durationOf(cur.mode, cur.preset),
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
    remainingMs: durationOf(mode, cur.preset),
    version: nextVersion(cur, now),
    by,
  };
}

/** Change the set length; starts over from a fresh focus session. */
export function setPreset(s: TimerState, preset: TimerPreset, now: number, by: string): TimerState {
  const cur = advance(s, now);
  return {
    ...cur,
    preset,
    mode: "focus",
    running: false,
    endsAt: null,
    remainingMs: durationOf("focus", preset),
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
