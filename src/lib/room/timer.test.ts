import { describe, expect, it } from "vitest";
import {
  advance,
  initialTimer,
  normalizeTimer,
  pauseTimer,
  pickNewer,
  remainingOf,
  setPreset,
  startTimer,
  type TimerState,
} from "./timer";

const MIN = 60_000;

describe("pomodoro timer", () => {
  it("starts on the 30 minute set: 25 minutes of focus", () => {
    const s = initialTimer();
    expect(s.preset).toBe(30);
    expect(s.remainingMs).toBe(25 * MIN);
  });

  it("30 minute set: 25 minutes focus then a 5 minute break, counting one session", () => {
    const s = startTimer(initialTimer(), 0, "a");
    const after = advance(s, 25 * MIN);
    expect(after.mode).toBe("break");
    expect(after.cycles).toBe(1);
    expect(remainingOf(after, 25 * MIN)).toBe(5 * MIN);
    expect(advance(s, 30 * MIN).mode).toBe("focus");
  });

  it("60 minute set: 50 minutes focus then a 10 minute break", () => {
    const s = setPreset(initialTimer(), 60, 0, "a");
    expect(s.remainingMs).toBe(50 * MIN);
    const run = startTimer(s, 0, "a");
    const brk = advance(run, 50 * MIN);
    expect(brk.mode).toBe("break");
    expect(remainingOf(brk, 50 * MIN)).toBe(10 * MIN);
    const back = advance(run, 60 * MIN + 1000);
    expect(back.mode).toBe("focus");
    expect(remainingOf(back, 60 * MIN + 1000)).toBe(50 * MIN - 1000);
  });

  it("changing the set stops the timer and starts over at focus", () => {
    const run = startTimer(initialTimer(), 0, "a");
    const s = setPreset(advance(run, 26 * MIN), 60, 26 * MIN, "b");
    expect(s.running).toBe(false);
    expect(s.mode).toBe("focus");
    expect(s.remainingMs).toBe(50 * MIN);
  });

  it("pausing keeps the remaining time", () => {
    const s = startTimer(initialTimer(), 0, "a");
    const p = pauseTimer(s, MIN, "a");
    expect(p.running).toBe(false);
    expect(remainingOf(p, 999_999)).toBe(24 * MIN);
  });

  it("friends follow the most recent button press", () => {
    const a = startTimer(initialTimer(), 1000, "a");
    const b = pauseTimer(a, 5000, "b");
    expect(pickNewer(a, b)).toBe(b);
    expect(pickNewer(b, a)).toBe(b);
  });

  it("treats a friend's older timer without a set as the 30 minute set", () => {
    const old = { ...initialTimer() } as Partial<TimerState>;
    delete old.preset;
    expect(normalizeTimer(old as TimerState).preset).toBe(30);
  });
});
