import { useEffect, useRef } from "react";
import { Heart, MicOff, VideoOff } from "lucide-react";
import type { Cheer, Member } from "@/hooks/useStudyRoom";
import type { Slot } from "@/lib/room/protocol";
import { cn } from "@/lib/utils";

const frameTone: Record<Slot, string> = {
  1: "bg-pink",
  2: "bg-mint",
  3: "bg-butter",
};

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.srcObject !== (member?.stream ?? null)) v.srcObject = member?.stream ?? null;
    if (member?.stream) v.play().catch(() => {});
  }, [member?.stream]);

  return (
    <div className="relative flex flex-col items-center">
      {/* hanging string */}
      <div className="h-3 w-[2px] bg-ink" aria-hidden />
      <div className={cn("relative w-full p-[6%] pixel-card", frameTone[slot])}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-screen pixel-inset">
          {member ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={member.isMe}
                className={cn(
                  "h-full w-full object-cover",
                  member.isMe && "-scale-x-100",
                  !member.camOn && "opacity-0",
                )}
              />
              {!member.camOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-screen-foreground">
                  <VideoOff className="h-5 w-5" />
                  <span className="font-tiny text-[10px]">잠시 자리비움</span>
                </div>
              )}
              {!member.stream && member.camOn && (
                <div className="absolute inset-0 flex items-center justify-center font-tiny text-[10px] text-screen-foreground">
                  연결 중<span className="animate-pixel-blink">_</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 scanlines" aria-hidden />
            </>
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
          {cheers.map((c, i) => (
            <span
              key={c.id}
              className="pointer-events-none absolute bottom-2 left-1/2 animate-float-heart text-pink-deep"
              style={{ ["--drift" as string]: `${((i % 3) - 1) * 18}px` }}
            >
              <Heart className="h-5 w-5 fill-current" />
            </span>
          ))}
        </div>
      </div>
      {/* name plate */}
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
