import { useState, type FormEvent } from "react";
import { BookHeart } from "lucide-react";
import type { GuestEntry } from "@/lib/room/protocol";
import { cn } from "@/lib/utils";
import { PixelButton } from "./PixelButton";
import { PixelPanel } from "./PixelPanel";

const MOODS = ["🌱", "🔥", "💖", "☕", "⭐", "🍀"];
const slotTone = { 1: "bg-pink", 2: "bg-mint", 3: "bg-butter" } as const;

function formatDate(ts: number) {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function Guestbook({
  entries,
  onAdd,
}: {
  entries: GuestEntry[];
  onAdd: (text: string, mood: string) => void;
}) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string>("🌱");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onAdd(t, mood);
    setText("");
  };

  return (
    <PixelPanel
      id="guestbook"
      title="방명록"
      icon={<BookHeart className="h-4 w-4" />}
      right={<span className="font-tiny text-[10px] text-ink-soft">TOTAL {entries.length}</span>}
    >
      <form onSubmit={submit} className="bg-muted p-2 pixel-inset">
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[11px] text-ink-soft">오늘의 기분</span>
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={cn(
                "h-7 w-7 text-sm pixel-border",
                mood === m ? "bg-butter" : "bg-paper opacity-70 hover:opacity-100",
              )}
              aria-pressed={mood === m}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit(e as unknown as FormEvent);
              }
            }}
            rows={2}
            placeholder="친구들에게 응원 한마디 남겨주세요 ✿"
            className="min-h-[52px] flex-1 resize-none bg-paper px-2 py-1.5 font-pixel text-sm text-ink placeholder:text-ink-soft focus:outline-none pixel-border"
          />
          <PixelButton type="submit" tone="cy" className="h-auto self-stretch">
            확인
          </PixelButton>
        </div>
      </form>

      <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
        {entries.length === 0 && (
          <li className="py-6 text-center text-xs text-ink-soft">
            아직 방명록이 비어있어요. 첫 응원을 남겨볼까요?
          </li>
        )}
        {entries.map((e, i) => (
          <li key={e.id} className="pixel-border">
            <div className={cn("flex items-center justify-between gap-2 px-2 py-1 text-[11px]", slotTone[e.slot])}>
              <span className="truncate">
                No.{entries.length - i} <b className="font-display">{e.name}</b>
              </span>
              <span className="shrink-0 font-tiny text-[10px] text-ink-soft">{formatDate(e.createdAt)}</span>
            </div>
            <div className="flex gap-3 bg-paper p-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-muted text-2xl pixel-inset">
                {e.mood}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{e.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </PixelPanel>
  );
}
