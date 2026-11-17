import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Copy, Home, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import minimi from "@/assets/pixel-minimi.png";
import { BgmPlayer } from "@/components/hamgong/BgmPlayer";
import { Guestbook } from "@/components/hamgong/Guestbook";
import { MiniRoom } from "@/components/hamgong/MiniRoom";
import { PixelButton } from "@/components/hamgong/PixelButton";
import { PomodoroPanel } from "@/components/hamgong/PomodoroPanel";
import { useStudyRoom, type StudyRoom } from "@/hooks/useStudyRoom";
import { NAME_KEY, normalizeRoomCode } from "@/lib/room/protocol";
import { advance } from "@/lib/room/timer";

export const Route = createFileRoute("/room/$roomId")({
  head: ({ params }) => ({
    meta: [
      { title: `함공 미니룸 #${params.roomId} · 3인 캠스터디` },
      { name: "description", content: "친구가 함공 미니룸에 초대했어요. 웹캠 켜고 같이 공부해요!" },
      { property: "og:title", content: `함공 미니룸 #${params.roomId}` },
      { property: "og:description", content: "친구가 함공 미니룸에 초대했어요. 웹캠 켜고 같이 공부해요!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  const room = normalizeRoomCode(roomId);
  const [name, setName] = useState("");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY) ?? "");
  }, []);

  const sr = useStudyRoom(room, name.trim() || "익명의 공부러", entered);

  const inviteUrl = () => (typeof window === "undefined" ? "" : `${window.location.origin}/room/${room}`);
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl());
      toast("초대 링크를 복사했어요! 친구에게 보내주세요 ✿");
    } catch {
      toast(inviteUrl());
    }
  };

  if (!entered) {
    return (
      <EnterGate
        room={room}
        name={name}
        setName={setName}
        onEnter={() => {
          localStorage.setItem(NAME_KEY, name.trim() || "익명의 공부러");
          setEntered(true);
        }}
      />
    );
  }

  return <RoomView room={room} sr={sr} name={name.trim() || "익명의 공부러"} onInvite={copyInvite} />;
}

function EnterGate({
  room,
  name,
  setName,
  onEnter,
}: {
  room: string;
  name: string;
  setName: (v: string) => void;
  onEnter: () => void;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onEnter();
  };
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-paper p-6 text-center pixel-card">
        <p className="font-tiny text-[11px] tracking-widest text-ink-soft">MINIROOM #{room}</p>
        <h1 className="mt-1 font-display text-3xl">
          함공<span className="text-pink-deep">♥</span>
        </h1>
        <img src={minimi} alt="" width={672} height={992} className="mx-auto mt-3 w-20 animate-bob pixelated" />
        <p className="mt-2 text-sm text-ink-soft">미니룸에 들어가기 전에 닉네임을 정해주세요</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 12))}
          placeholder="예) 도토리부자"
          autoFocus
          className="mt-4 h-10 w-full bg-paper px-3 text-center font-pixel text-sm text-ink placeholder:text-ink-soft focus:outline-none pixel-border"
        />
        <PixelButton type="submit" tone="cy" size="lg" className="mt-4 w-full">
          캠 켜고 입장하기
        </PixelButton>
        <p className="mt-3 text-[10px] text-ink-soft">카메라 권한을 허용해주세요. 마이크는 꺼진 채로 들어가요.</p>
      </form>
    </main>
  );
}

const STATUS_TEXT: Record<StudyRoom["status"], string> = {
  idle: "준비 중",
  media: "카메라 켜는 중",
  connecting: "미니룸 연결 중",
  ready: "접속 중",
  full: "방이 꽉 찼어요",
  error: "연결 오류",
};

function RoomView({
  room,
  sr,
  name,
  onInvite,
}: {
  room: string;
  sr: StudyRoom;
  name: string;
  onInvite: () => void;
}) {
  const me = sr.mySlot ? sr.members[sr.mySlot] : undefined;
  const online = Object.keys(sr.members).length;
  const timerView = advance(sr.timer, Date.now());

  if (sr.status === "full") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm bg-paper p-6 text-center pixel-card">
          <h1 className="font-display text-2xl">방이 꽉 찼어요 (3/3)</h1>
          <p className="mt-2 text-sm text-ink-soft">이 미니룸에는 이미 3명이 공부 중이에요.</p>
          <Link to="/" className="mt-4 inline-block">
            <PixelButton tone="cy">새 방 만들러 가기</PixelButton>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-5 sm:px-5">
      {/* top bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl text-ink">
            함공<span className="text-pink-deep">♥</span>
          </span>
          <span className="hidden text-xs text-ink-soft sm:inline">3인 캠스터디 미니홈피</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="bg-paper px-2 py-1 font-tiny text-[11px] pixel-border">
            TODAY <b className="text-pink-deep">{online}</b> / 3
          </span>
          <PixelButton size="sm" tone="butter" onClick={onInvite}>
            <Copy className="h-3.5 w-3.5" /> 초대 링크
          </PixelButton>
        </div>
      </div>

      {/* minihompy binder */}
      <div className="bg-binder p-2 pixel-card sm:p-3">
        <div className="relative grid gap-3 bg-sky-deep/30 p-2 sm:p-3 lg:grid-cols-[280px_1fr]">
          {/* left page */}
          <aside className="flex flex-col gap-4 bg-paper p-3 pixel-border">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-tiny text-ink-soft">MINIROOM #{room}</span>
              <span className="flex items-center gap-1">
                <span
                  className={
                    sr.status === "ready" ? "h-2 w-2 bg-mint-deep" : "h-2 w-2 animate-pixel-blink bg-cy"
                  }
                />
                {STATUS_TEXT[sr.status]}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 shrink-0 items-end justify-center overflow-hidden bg-butter pixel-inset">
                <img src={minimi} alt="" width={672} height={992} className="w-14 pixelated" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-base">{name}</p>
                <p className="text-[11px] text-ink-soft">
                  {timerView.running
                    ? timerView.mode === "focus"
                      ? "지금은 집중 모드 ✏️"
                      : "잠깐 쉬는 중 ☕"
                    : "오늘도 화이팅 ✿"}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <PixelButton
                    size="icon"
                    tone={me?.camOn ? "mint" : "paper"}
                    onClick={sr.toggleCam}
                    aria-label={me?.camOn ? "카메라 끄기" : "카메라 켜기"}
                  >
                    {me?.camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </PixelButton>
                  <PixelButton
                    size="icon"
                    tone={me?.micOn ? "mint" : "paper"}
                    onClick={sr.toggleMic}
                    aria-label={me?.micOn ? "마이크 끄기" : "마이크 켜기"}
                  >
                    {me?.micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </PixelButton>
                  <Link to="/" aria-label="나가기">
                    <PixelButton size="icon" tone="pink" tabIndex={-1}>
                      <Home className="h-4 w-4" />
                    </PixelButton>
                  </Link>
                </div>
              </div>
            </div>

            <PomodoroPanel timer={sr.timer} onAction={sr.timerAction} />

            {sr.status === "error" && (
              <p className="bg-pink p-2 text-[11px] pixel-border">
                연결에 문제가 생겼어요: {sr.error}. 새로고침 해주세요.
              </p>
            )}
          </aside>

          {/* right page */}
          <section id="miniroom" className="flex flex-col bg-paper p-3 pixel-border">
            <div className="mb-2 flex items-center justify-between border-b-2 border-dashed border-ink-soft pb-2">
              <h1 className="font-display text-base">
                <span className="text-cy">✿</span> 우리들의 미니룸
              </h1>
              <span className="text-[11px] text-ink-soft">액자 속 하트를 눌러 응원해요</span>
            </div>
            <MiniRoom
              members={sr.members}
              cheers={sr.cheers}
              mode={timerView.mode}
              running={timerView.running}
              onCheer={sr.sendCheer}
              onInvite={onInvite}
            />
          </section>

          {/* side tabs */}
          <nav className="absolute -right-[3.4rem] top-6 hidden flex-col gap-1 xl:flex" aria-label="바로가기">
            {[
              ["#miniroom", "미니룸", "bg-paper"],
              ["#timer", "타이머", "bg-pink"],
              ["#guestbook", "방명록", "bg-mint"],
              ["#bgm", "BGM", "bg-butter"],
            ].map(([href, label, tone]) => (
              <a key={href} href={href} className={`${tone} w-12 whitespace-nowrap px-1 py-2 text-center text-[11px] pixel-border hover:translate-x-0.5`}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* bottom */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Guestbook entries={sr.guestbook} onAdd={sr.addGuestEntry} />
        <BgmPlayer bgm={sr.bgm} onSet={sr.setBgm} />
      </div>

      <p className="mt-6 text-center font-tiny text-[10px] text-ink-soft">
        ⓒ 함공 · 영상은 친구들끼리 직접 연결돼요. 회사·학교 와이파이에선 연결이 안 될 수도 있어요.
      </p>
    </main>
  );
}
