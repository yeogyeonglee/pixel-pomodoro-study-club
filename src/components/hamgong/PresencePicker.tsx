import { PRESENCES, type PresenceKey } from "@/lib/room/presence";
import { cn } from "@/lib/utils";

/** Pick a status to show on my cam. Tapping the active one clears it. */
export function PresencePicker({
  value,
  onChange,
}: {
  value: PresenceKey | null;
  onChange: (key: PresenceKey | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] text-ink-soft">내 캠에 상태 띄우기</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="내 상태">
        {PRESENCES.map((p) => {
          const active = value === p.key;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : p.key)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-[11px] pixel-border",
                active ? "bg-butter" : "bg-paper hover:bg-muted",
              )}
            >
              <span aria-hidden>{p.emoji}</span>
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
