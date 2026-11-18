export const PRESENCES = [
  { key: "study", emoji: "✏️", label: "공부중" },
  { key: "focus", emoji: "🔥", label: "초집중" },
  { key: "toilet", emoji: "🚽", label: "화장실" },
  { key: "meal", emoji: "🍚", label: "밥먹는중" },
  { key: "rest", emoji: "☕", label: "잠깐 휴식" },
  { key: "phone", emoji: "📞", label: "전화중" },
  { key: "sleepy", emoji: "😴", label: "졸려요" },
] as const;

export type PresenceKey = (typeof PRESENCES)[number]["key"];

/** Statuses that mean "away from the desk" — the cam gets dimmed behind the badge. */
export const AWAY_PRESENCES: ReadonlySet<PresenceKey> = new Set(["toilet", "meal", "phone"]);

export function presenceOf(key: string | null | undefined) {
  return PRESENCES.find((p) => p.key === key) ?? null;
}
