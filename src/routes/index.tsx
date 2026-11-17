import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { BookHeart, Music, Timer, Video } from "lucide-react";
import minimi from "@/assets/pixel-minimi.png";
import { PixelButton } from "@/components/hamgong/PixelButton";
import { NAME_KEY, normalizeRoomCode, randomRoomCode } from "@/lib/room/protocol";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "함공 · 친구 3명과 함께하는 캠스터디 미니홈피" },
      {
        name: "description",
        content: "싸이월드 미니룸 감성으로 친구 3명이 웹캠을 켜고 뽀모도로 타이머에 맞춰 함께 공부해요.",
      },
      { property: "og:title", content: "함공 · 친구 3명과 함께하는 캠스터디 미니홈피" },
      {
        property: "og:description",
        content: "싸이월드 미니룸 감성으로 친구 3명이 웹캠을 켜고 뽀모도로 타이머에 맞춰 함께 공부해요.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lobby,
});

const FEATURES = [
  { icon: Video, label: "미니룸 캠 3개", tone: "bg-pink" },
  { icon: Timer, label: "같이 뽀모도로", tone: "bg-mint" },
  { icon: BookHeart, label: "응원 방명록", tone: "bg-butter" },
  { icon: Music, label: "같이 듣는 BGM", tone: "bg-sky" },
];

function Lobby() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY) ?? "");
  }, []);

  const go = (room: string) => {
    const n = name.trim() || "익명의 공부러";
    localStorage.setItem(NAME_KEY, n);
    navigate({ to: "/room/$roomId", params: { roomId: room } });
  };

  const join = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeRoomCode(code.includes("/room/") ? (code.split("/room/")[1] ?? "") : code);
    if (c) go(c);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-binder p-3 pixel-card sm:p-5">
        <div className="grid gap-4 bg-paper p-5 pixel-border sm:grid-cols-[1fr_1.1fr] sm:p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="font-tiny text-[11px] tracking-widest text-ink-soft">TODAY 3 | TOTAL 1,004</p>
            <h1 className="mt-2 font-display text-6xl text-ink">
              함공<span className="text-pink-deep">♥</span>
            </h1>
            <p className="mt-2 text-sm text-ink-soft">친구 3명이 함께 켜는 캠스터디 미니홈피</p>
            <img
              src={minimi}
              alt="손 흔드는 미니미"
              width={672}
              height={992}
              className="mt-4 w-28 animate-bob pixelated"
            />
            <div className="mt-4 grid w-full grid-cols-2 gap-2">
              {FEATURES.map(({ icon: Icon, label, tone }) => (
                <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] pixel-border ${tone}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-5 bg-muted p-4 bg-dashed-page pixel-inset sm:p-6">
            <label className="block">
              <span className="mb-1.5 block font-display text-sm">내 닉네임</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 12))}
                placeholder="예) 도토리부자"
                className="h-10 w-full bg-paper px-3 font-pixel text-sm text-ink placeholder:text-ink-soft focus:outline-none pixel-border"
              />
            </label>

            <PixelButton tone="cy" size="lg" onClick={() => go(randomRoomCode())}>
              ✿ 새 미니룸 만들기
            </PixelButton>

            <div className="flex items-center gap-2 text-[11px] text-ink-soft">
              <span className="h-[2px] flex-1 bg-ink-soft" />
              또는 친구 방 놀러가기
              <span className="h-[2px] flex-1 bg-ink-soft" />
            </div>

            <form onSubmit={join} className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="방 코드 또는 초대 링크"
                className="h-10 min-w-0 flex-1 bg-paper px-3 font-pixel text-sm text-ink placeholder:text-ink-soft focus:outline-none pixel-border"
              />
              <PixelButton type="submit" tone="mint" className="h-10">
                입장
              </PixelButton>
            </form>

            <p className="text-[10px] leading-relaxed text-ink-soft">
              한 방에는 최대 3명까지 들어올 수 있어요. 캠과 마이크 권한을 허용해주세요. 마이크는 처음엔 꺼져 있어요.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
