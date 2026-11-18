import type { TimerState } from "./timer";
import type { PresenceKey } from "./presence";
import type { RoomTheme } from "./theme";

export type Slot = 1 | 2 | 3;
export const SLOTS: Slot[] = [1, 2, 3];

const PREFIX = "hamgong-v1";
export const peerIdFor = (room: string, slot: Slot) => `${PREFIX}-${room}-${slot}`;

export function slotFromPeerId(id: string): Slot | null {
  const n = Number(id.slice(-1));
  return n === 1 || n === 2 || n === 3 ? n : null;
}

export function normalizeRoomCode(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

export function randomRoomCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export type GuestEntry = {
  id: string;
  name: string;
  slot: Slot;
  mood: string;
  text: string;
  createdAt: number;
};

export type BgmState = { videoId: string | null; setBy: string; version: number };

export type PeerMsg =
  | {
      type: "hello";
      name: string;
      camOn: boolean;
      micOn: boolean;
      presence?: PresenceKey | null;
      theme?: RoomTheme | null;
      themeExplicit?: boolean;
    }
  | { type: "status"; camOn: boolean; micOn: boolean; presence?: PresenceKey | null }
  | { type: "timer"; state: TimerState }
  | { type: "guestbook"; entries: GuestEntry[] }
  | { type: "bgm"; state: BgmState }
  | { type: "cheer"; to: Slot; from: string };

export function mergeGuestbook(a: GuestEntry[], b: GuestEntry[]): GuestEntry[] {
  const map = new Map<string, GuestEntry>();
  for (const e of [...a, ...b]) map.set(e.id, e);
  return [...map.values()].sort((x, y) => y.createdAt - x.createdAt).slice(0, 200);
}
export const NAME_KEY = "hamgong-name";
