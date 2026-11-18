import { Heart, MicOff } from "lucide-react";
import type { Cheer, Member } from "@/hooks/useStudyRoom";
import type { Slot } from "@/lib/room/protocol";
import { cn } from "@/lib/utils";
import { CamVideo } from "./CamVideo";

const frameTone: Record<Slot, string> = {
  1: "bg-pink",
  2: "bg-mint",
  3: "bg-butter",
};

/** 미니홈피 theme: a cam hung on the wall like a picture frame. */
export function CamFrame({
  slot,
  member,
  cheers,
  onCheer,
  onInvite,
}: {
  slot: Slot;
  member?: Member | undefined;
  cheers: Cheer[];
  onCheer: (slot: Slot) => void;
  onInvite: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="h-3 w-[2px] bg-ink" aria-hidden />
      <div className={cn("relative w-full p-[6%] pixel-card", frameTone[slot])}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-screen pixel-inset">
          {member ? (
            <CamVideo member={member} cheers={cheers} />
          ) : (
            <button
              type="button"
              onClick={onInvite}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-screen-foreground hover:bg-ink-soft"
            >
              <span className="font-display text-lg">+</span>
              <span className="font-tiny text-[10px] leading-tight">
                빈자리
                <br />
                초대링크 복사
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 flex max-w-full items-center gap-1 bg-paper px-2 py-0.5 pixel-border">
        <span className="font-tiny text-[10px] text-ink-soft">No.{slot}</span>
        <span className="truncate font-pixel text-[11px] text-ink">
          {member ? member.name : "비어있음"}
          {member?.isMe && " (나)"}
        </span>
        {member && !member.micOn && <MicOff className="h-3 w-3 shrink-0 text-ink-soft" />}
        {member && !member.isMe && (
          <button
            type="button"
            onClick={() => onCheer(slot)}
            aria-label={`${member.name}에게 하트 보내기`}
            className="shrink-0 text-pink-deep hover:scale-110"
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}
