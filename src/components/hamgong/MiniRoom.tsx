import desk from "@/assets/pixel-desk.png";
import plant from "@/assets/pixel-plant.png";
import sofa from "@/assets/pixel-sofa.png";
import minimi from "@/assets/pixel-minimi.png";
import { SLOTS, type Slot } from "@/lib/room/protocol";
import type { Cheer, Member } from "@/hooks/useStudyRoom";
import type { TimerMode } from "@/lib/room/timer";
import { CamFrame } from "./CamFrame";

export function MiniRoom({
  members,
  cheers,
  mode,
  running,
  onCheer,
  onInvite,
}: {
  members: Partial<Record<Slot, Member>>;
  cheers: Cheer[];
  mode: TimerMode;
  running: boolean;
  onCheer: (slot: Slot) => void;
  onInvite: () => void;
}) {
  const sign = !running ? "READY?" : mode === "focus" ? "FOCUS TIME" : "BREAK TIME";
  return (
    <div className="relative w-full overflow-hidden pixel-border">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        {/* wall */}
        <div className="absolute inset-x-0 top-0 h-[66%] miniroom-wall" />
        <div className="absolute inset-x-0 top-[66%] h-[3%] border-y-[3px] border-ink miniroom-baseboard" />
        {/* floor */}
        <div className="absolute inset-x-0 bottom-0 h-[31%] miniroom-floor" />

        {/* sign */}
        <div className="absolute left-1/2 top-[3%] -translate-x-1/2 bg-ink px-2 py-0.5 font-tiny text-[10px] tracking-widest text-butter pixel-border">
          {running && <span className="mr-1 animate-pixel-blink text-pink">●</span>}
          {sign}
        </div>

        {/* frames */}
        <div className="absolute inset-x-[4%] top-[9%] grid grid-cols-3 gap-[4%]">
          {SLOTS.map((s) => (
            <CamFrame
              key={s}
              slot={s}
              member={members[s]}
              cheers={cheers.filter((c) => c.to === s)}
              onCheer={onCheer}
              onInvite={onInvite}
            />
          ))}
        </div>

        {/* furniture */}
        <img
          src={sofa}
          alt=""
          width={992}
          height={672}
          className="pointer-events-none absolute bottom-[1%] left-[1%] w-[27%] pixelated"
        />
        <img
          src={desk}
          alt=""
          width={816}
          height={816}
          className="pointer-events-none absolute bottom-[0%] left-[40%] w-[24%] pixelated"
        />
        <img
          src={minimi}
          alt="미니미"
          width={672}
          height={992}
          className="pointer-events-none absolute bottom-[2%] left-[63%] w-[10%] animate-bob pixelated"
        />
        <img
          src={plant}
          alt=""
          width={672}
          height={992}
          className="pointer-events-none absolute bottom-[1%] right-[2%] w-[12%] pixelated"
        />
      </div>
    </div>
  );
}
