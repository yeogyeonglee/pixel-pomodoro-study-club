import { describe, expect, it } from "vitest";
import {
  BREAK_MS,
  FOCUS_MS,
  advance,
  initialTimer,
  pauseTimer,
  pickNewer,
  remainingOf,
  startTimer,
} from "./timer";

describe("pomodoro timer", () => {
  it("focus lasts 25 minutes", () => {
    expect(FOCUS_MS).toBe(25 * 60 * 1000);
    expect(initialTimer().remainingMs).toBe(25 * 60 * 1000);
  });

  it("break lasts 5 minutes", () => {
    expect(BREAK_MS).toBe(5 * 60 * 1000);
  });

  it("switches to a 5 minute break when 25 minutes of focus end, counting one session", () => {
    const s = startTimer(initialTimer(), 0, "a");
    const after = advance(s, FOCUS_MS);
    expect(after.mode).toBe("break");
    expect(after.cycles).toBe(1);
    expect(remainingOf(after, FOCUS_MS)).toBe(BREAK_MS);
  });

  it("goes back to focus after the break", () => {
    const s = startTimer(initialTimer(), 0, "a");
    const after = advance(s, FOCUS_MS + BREAK_MS + 1000);
    expect(after.mode).toBe("focus");
    expect(remainingOf(after, FOCUS_MS + BREAK_MS + 1000)).toBe(FOCUS_MS - 1000);
  });

  it("pausing keeps the remaining time", () => {
    const s = startTimer(initialTimer(), 0, "a");
    const p = pauseTimer(s, 60_000, "a");
    expect(p.running).toBe(false);
    expect(remainingOf(p, 999_999)).toBe(FOCUS_MS - 60_000);
  });

  it("friends follow the most recent button press", () => {
    const a = startTimer(initialTimer(), 1000, "a");
    const b = pauseTimer(a, 5000, "b");
    expect(pickNewer(a, b)).toBe(b);
    expect(pickNewer(b, a)).toBe(b);
  });
});
