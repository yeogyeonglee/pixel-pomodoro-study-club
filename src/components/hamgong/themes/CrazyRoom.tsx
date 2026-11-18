import { Link } from "@tanstack/react-router";
import { Copy, Heart, MicOff, UserPlus } from "lucide-react";
import balloon from "@/assets/arcade-balloon.png";
import hero from "@/assets/arcade-hero.png";
import arcadeMap from "@/assets/arcade-map.jpg";
import type { Cheer, Member, StudyRoom } from "@/hooks/useStudyRoom";
import { SLOTS, type Slot } from "@/lib/room/protocol";
import { advance, type TimerState } from "@/lib/room/timer";
import { cn } from "@/lib/utils";
import { BgmPlayer } from "../BgmPlayer";
import { CamProblemBanner } from "../CamProblemBanner";
import { CamVideo } from "../CamVideo";
import { Guestbook } from "../Guestbook";
import { MyControls, STATUS_TEXT } from "../MyControls";
import { PixelButton } from "../PixelButton";
import { PomodoroPanel } from "../PomodoroPanel";
import { PresencePicker } from "../PresencePicker";

const TEAM: Record<Slot, { tone: string; label: string }> = {
  1: { tone: "bg-pink", label: "1P" },
  2: { tone: "bg-sky", label: "2P" },
  3: { tone: "bg-mint", label: "3P" },
};

function stampOf(t: TimerState) {
  if (!t.running) return { text: "READY", tone: "bg-butter" };
  return t.mode === "focus" ? { text: "공부중!", tone: "bg-pink" } : { text: "휴식", tone: "bg-mint" };
}

function PlayerSlot({
  slot,
  member,
  cheers,
  stamp,
  onCheer,
  onInvite,
}: {
  slot: Slot;
  member?: Member | undefined;
  cheers: Cheer[];
  stamp: { text: string; tone: string };
  onCheer: (slot: Slot) => void;
  onInvite: () => void;
}) {
  const team = TEAM[slot];
  return (
    <div className="flex min-w-0 flex-col bg-paper p-1.5 pixel-card">
      <div className={cn("flex items-center justify-between px-2 py-0.5 font-display text-sm pixel-border", team.tone)}>
        <span>{team.label}</span>
        {member?.isMe && <span className="text-[11px]">나</span>}
      </div>
      <div className="relative mt-1.5 aspect-[4/3] overflow-hidden pixel-inset">
        {member ? (
          <>
            <CamVideo member={member} cheers={cheers} scanlines={false} />
            <span
              className={cn(
                "absolute bottom-1 right-1 -rotate-6 px-1.5 py-0.5 font-display text-[11px] text-ink pixel-border",
                stamp.tone,
              )}
            >
              {stamp.text}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={onInvite}
            className="flex h-full w-full flex-col items-center justify-center gap-1 bg-screen text-screen-foreground hover:brightness-125"
          >
            <img src={balloon} alt="" width={256} height={256} className="w-1/4 animate-wobble" />
            <span className="font-display text-sm">빈자리</span>
            <span className="flex items-center gap-1 text-[10px]">
              <UserPlus className="h-3 w-3" /> 친구 초대
            </span>
          </button>
        )}
      </div>
      <div className="mt-1.5 flex min-w-0 items-center gap-1 bg-screen px-2 py-1 text-screen-foreground pixel-inset">
        <span className="min-w-0 flex-1 truncate font-display text-xs">{member ? member.name : "대기중…"}</span>
        {member && !member.micOn && <MicOff className="h-3 w-3 shrink-0 opacity-70" />}
        {member && !member.isMe && (
          <button
            type="button"
            onClick={() => onCheer(slot)}
            aria-label={`${member.name}에게 하트 보내기`}
            className="shrink-0 text-pink hover:scale-110"
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}

export function CrazyRoom({
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
  const stamp = stampOf(timerView);

  return (
    <main className="mx-auto max-w-6xl px-3 py-5 sm:px-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-end gap-2">
          <span className="ca-logo text-4xl leading-none">함공</span>
          <span className="mb-1 bg-pink px-2 py-0.5 font-display text-xs pixel-border">ARCADE</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-paper px-2.5 py-1 font-display text-xs pixel-border">방 번호 {room}</span>
          <span className="bg-paper px-2.5 py-1 font-display text-xs pixel-border">
            인원 <b className="text-pink-deep">{online}</b>/3
          </span>
          <PixelButton size="sm" tone="butter" onClick={onInvite}>
            <Copy className="h-3.5 w-3.5" /> 초대 링크
          </PixelButton>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* waiting room */}
        <section id="lobby" className="min-w-0 bg-binder p-2 pixel-card">
          <div className="ca-title-bar flex items-center justify-between gap-2 px-3 py-1.5 pixel-border">
            <h1 className="truncate font-display text-base">★ 함공 대기방 — 같이 공부할 사람 모여라!</h1>
            <span className="shrink-0 text-[11px]">{STATUS_TEXT[sr.status]}</span>
          </div>

          <div className="relative mt-2 overflow-hidden p-2 pixel-inset sm:p-3">
            <img
              src={arcadeMap}
              alt=""
              width={1536}
              height={1024}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-screen/30" aria-hidden />
            <div className="relative">
              <CamProblemBanner sr={sr} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SLOTS.map((s) => (
                  <PlayerSlot
                    key={s}
                    slot={s}
                    member={sr.members[s]}
                    cheers={sr.cheers.filter((c) => c.to === s)}
                    stamp={stamp}
                    onCheer={sr.sendCheer}
                    onInvite={onInvite}
                  />
                ))}
              </div>
              <div className="mt-3 hidden grid-cols-5 gap-2 sm:grid" aria-hidden>
                {[4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="flex aspect-[5/3] items-end justify-center ca-closed pb-1 pixel-border">
                    <span className="bg-screen px-1.5 font-display text-[10px] text-paper">{n}P 닫힘</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 px-1 text-[11px] text-paper">
            최대 3명까지 입장할 수 있어요 · 친구 칸의 하트를 눌러 응원해요
          </p>
        </section>

        {/* side panel */}
        <aside className="flex min-w-0 flex-col gap-4">
          <div className="bg-paper p-2 pixel-card">
            <div className="relative aspect-[3/2] overflow-hidden pixel-inset">
              <img src={arcadeMap} alt="공부의 숲 맵" width={1536} height={1024} className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 bg-butter px-2 py-0.5 font-display text-xs pixel-border">
                맵: 공부의 숲
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <img src={hero} alt="" width={512} height={768} className="w-14 shrink-0 animate-bob" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight">{name}</p>
                <p className="text-[11px] text-ink-soft">
                  {me ? `${TEAM[me.slot].label} 자리` : "입장 중"} ·{" "}
                  {timerView.running ? (timerView.mode === "focus" ? "공부 게임 중" : "쉬는 시간") : "READY"}
                </p>
                <div className="mt-1.5">
                  <MyControls sr={sr} />
                </div>
              </div>
            </div>
            <div className="mt-3 border-t-2 border-dashed border-ink-soft pt-2">
              <PresencePicker value={me?.presence ?? null} onChange={sr.setPresence} />
            </div>
          </div>

          <PomodoroPanel
            timer={sr.timer}
            onAction={sr.timerAction}
            onPreset={sr.setTimerPreset}
            title="게임 타이머"
            startLabel="게임 시작!"
          />

          {sr.status === "error" && (
            <p className="bg-pink p-2 text-[11px] pixel-border">
              연결에 문제가 생겼어요: {sr.error}. 새로고침 해주세요.
            </p>
          )}
        </aside>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Guestbook entries={sr.guestbook} onAdd={sr.addGuestEntry} variant="chat" />
        <BgmPlayer bgm={sr.bgm} onSet={sr.setBgm} />
      </div>

      <p className="mt-6 text-center text-[10px] text-paper">
        ⓒ 함공 · 영상은 친구들끼리 직접 연결돼요. 회사·학교 와이파이에선 연결이 안 될 수도 있어요.
      </p>
    </main>
  );
}
