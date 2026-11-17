import { useState, type FormEvent } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import type { BgmState } from "@/lib/room/protocol";
import { parseYouTubeId } from "@/lib/room/youtube";
import { PixelButton } from "./PixelButton";
import { PixelPanel } from "./PixelPanel";

const PRESETS = [
  { label: "로파이", id: "jfKfPfyJRdk" },
  { label: "빗소리", id: "mPZkdNFkNps" },
  { label: "재즈카페", id: "Dx5qFachd3A" },
];

export function BgmPlayer({ bgm, onSet }: { bgm: BgmState; onSet: (id: string | null) => void }) {
  const [link, setLink] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [localOff, setLocalOff] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = parseYouTubeId(link);
    if (!id) {
      setErr("유튜브 링크를 확인해주세요");
      return;
    }
    setErr(null);
    setLocalOff(false);
    onSet(id);
    setLink("");
  };

  const src = bgm.videoId
    ? `https://www.youtube.com/embed/${bgm.videoId}?autoplay=1&loop=1&playlist=${bgm.videoId}&controls=1&modestbranding=1&rel=0`
    : null;

  return (
    <PixelPanel
      id="bgm"
      title="BGM 플레이어"
      icon={<Music className="h-4 w-4" />}
      right={
        bgm.videoId ? (
          <button
            type="button"
            onClick={() => setLocalOff((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-ink hover:text-pink-deep"
          >
            {localOff ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {localOff ? "나만 꺼짐" : "듣는 중"}
          </button>
        ) : null
      }
    >
      <div className="overflow-hidden bg-screen px-2 py-1 pixel-inset">
        <div className="whitespace-nowrap font-tiny text-[11px] text-screen-foreground">
          <div className="inline-block animate-marquee">
            {bgm.videoId
              ? `♬ Now Playing ♬  ${bgm.setBy}님이 고른 노래  ♪`
              : "♪ 아직 BGM이 없어요 · 유튜브 링크를 넣어주세요 ♪"}
          </div>
        </div>
      </div>

      <div className="mt-2 aspect-video w-full bg-screen pixel-inset">
        {src && !localOff ? (
          <iframe
            key={`${bgm.videoId}-${bgm.version}`}
            src={src}
            title="BGM"
            allow="autoplay; encrypted-media"
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-screen-foreground">
            ♫
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-2 flex gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="유튜브 링크 붙여넣기"
          className="h-9 min-w-0 flex-1 bg-paper px-2 font-pixel text-xs text-ink placeholder:text-ink-soft focus:outline-none pixel-border"
        />
        <PixelButton type="submit" tone="mint">
          재생
        </PixelButton>
      </form>
      {err && <p className="mt-1 text-[11px] text-destructive">{err}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">추천</span>
        {PRESETS.map((p) => (
          <PixelButton
            key={p.id}
            size="sm"
            tone="butter"
            onClick={() => {
              setLocalOff(false);
              onSet(p.id);
            }}
          >
            {p.label}
          </PixelButton>
        ))}
        {bgm.videoId && (
          <PixelButton size="sm" tone="paper" onClick={() => onSet(null)}>
            모두 끄기
          </PixelButton>
        )}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">
        노래를 바꾸면 방에 있는 친구들 모두에게 같이 틀어져요.
      </p>
    </PixelPanel>
  );
}
