import { useEffect, useRef } from "react";
import { Heart, VideoOff } from "lucide-react";
import type { Cheer, Member } from "@/hooks/useStudyRoom";
import { AWAY_PRESENCES, presenceOf } from "@/lib/room/presence";
import { cn } from "@/lib/utils";

/** The live cam screen with status badge, cam-off cover and cheer hearts. Shared by every theme. */
export function CamVideo({
  member,
  cheers,
  className,
  scanlines = true,
}: {
  member: Member;
  cheers: Cheer[];
  className?: string;
  scanlines?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.srcObject !== member.stream) v.srcObject = member.stream;
    if (member.stream) v.play().catch(() => {});
  }, [member.stream]);

  const presence = presenceOf(member.presence);
  const away = presence ? AWAY_PRESENCES.has(presence.key) : false;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-screen", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={member.isMe}
        className={cn(
          "h-full w-full object-cover",
          member.isMe && "-scale-x-100",
          !member.camOn && "opacity-0",
          away && "opacity-40 grayscale",
        )}
      />
      {!member.camOn && !away && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-screen-foreground">
          <VideoOff className="h-5 w-5" />
          <span className="font-tiny text-[10px]">캠 꺼짐</span>
        </div>
      )}
      {!member.stream && member.camOn && (
        <div className="absolute inset-0 flex items-center justify-center font-tiny text-[10px] text-screen-foreground">
          연결 중<span className="animate-pixel-blink">_</span>
        </div>
      )}
      {away && presence && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-screen-foreground">
          <span className="text-3xl leading-none">{presence.emoji}</span>
          <span className="mt-1 font-display text-xs">{presence.label}</span>
        </div>
      )}
      {scanlines && <div className="pointer-events-none absolute inset-0 scanlines" aria-hidden />}
      {presence && (
        <span className="absolute left-1 top-1 flex max-w-[calc(100%-0.5rem)] items-center gap-0.5 bg-paper px-1.5 py-0.5 text-[10px] leading-none text-ink pixel-border">
          <span aria-hidden>{presence.emoji}</span>
          <span className="truncate">{presence.label}</span>
        </span>
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
  );
}
