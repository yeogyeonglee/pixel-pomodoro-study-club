export type RoomTheme = "minihompy" | "crazy";

export const THEMES: { key: RoomTheme; label: string; desc: string }[] = [
  { key: "minihompy", label: "미니홈피", desc: "파스텔 도트 미니룸" },
  { key: "crazy", label: "크아 대기방", desc: "물풍선 아케이드 대기방" },
];

export const DEFAULT_THEME: RoomTheme = "minihompy";

export function parseTheme(v: unknown): RoomTheme | null {
  return v === "minihompy" || v === "crazy" ? v : null;
}

export const themeKey = (room: string) => `hamgong-theme-${room}`;

/**
 * Should I switch to a friend's theme? Only when the friend picked theirs on purpose and
 * either I didn't, or they took an earlier seat (seat 1 is usually the room maker).
 */
export function shouldAdoptTheme(opts: {
  mine: RoomTheme;
  mineExplicit: boolean;
  mySlot: number;
  theirs: RoomTheme | null;
  theirsExplicit: boolean;
  theirSlot: number;
}): boolean {
  if (!opts.theirs || opts.theirs === opts.mine || !opts.theirsExplicit) return false;
  return !opts.mineExplicit || opts.theirSlot < opts.mySlot;
}
