import { Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import minimi from "@/assets/pixel-minimi.png";
import type { StudyRoom } from "@/hooks/useStudyRoom";
import { advance } from "@/lib/room/timer";
import { BgmPlayer } from "../BgmPlayer";
import { CamProblemBanner } from "../CamProblemBanner";
import { Guestbook } from "../Guestbook";
import { MiniRoom } from "../MiniRoom";
import { MyControls, STATUS_TEXT } from "../MyControls";
import { PixelButton } from "../PixelButton";
import { PomodoroPanel } from "../PomodoroPanel";
import { PresencePicker } from "../PresencePicker";

export function MinihompyRoom({
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

  return (
    <main className="mx-auto max-w-6xl px-3 py-5 sm:px-5">
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

      <div className="bg-binder p-2 pixel-card sm:p-3">
        <div className="relative grid grid-cols-1 gap-3 bg-sky-deep/30 p-2 sm:p-3 lg:grid-cols-[280px_1fr]">
          <aside className="flex min-w-0 flex-col gap-4 bg-paper p-3 pixel-border">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-tiny text-ink-soft">MINIROOM #{room}</span>
              <span className="flex items-center gap-1">
                <span
                  className={sr.status === "ready" ? "h-2 w-2 bg-mint-deep" : "h-2 w-2 animate-pixel-blink bg-cy"}
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
                <div className="mt-2">
                  <MyControls sr={sr} />
                </div>
              </div>
            </div>

            <PresencePicker value={me?.presence ?? null} onChange={sr.setPresence} />

            <PomodoroPanel timer={sr.timer} onAction={sr.timerAction} onPreset={sr.setTimerPreset} />

            {sr.status === "error" && (
              <p className="bg-pink p-2 text-[11px] pixel-border">
                연결에 문제가 생겼어요: {sr.error}. 새로고침 해주세요.
              </p>
            )}
          </aside>

          <section id="miniroom" className="flex min-w-0 flex-col bg-paper p-3 pixel-border">
            <div className="mb-2 flex items-center justify-between border-b-2 border-dashed border-ink-soft pb-2">
              <h1 className="font-display text-base">
                <span className="text-cy">✿</span> 우리들의 미니룸
              </h1>
              <span className="text-[11px] text-ink-soft">액자 속 하트를 눌러 응원해요</span>
            </div>
            <CamProblemBanner sr={sr} />
            <MiniRoom
              members={sr.members}
              cheers={sr.cheers}
              mode={timerView.mode}
              running={timerView.running}
              onCheer={sr.sendCheer}
              onInvite={onInvite}
            />
          </section>

          <nav className="absolute -right-[3.4rem] top-6 hidden flex-col gap-1 xl:flex" aria-label="바로가기">
            {[
              ["#miniroom", "미니룸", "bg-paper"],
              ["#timer", "타이머", "bg-pink"],
              ["#guestbook", "방명록", "bg-mint"],
              ["#bgm", "BGM", "bg-butter"],
            ].map(([href, label, tone]) => (
              <a
                key={href}
                href={href}
                className={`${tone} w-12 whitespace-nowrap px-1 py-2 text-center text-[11px] pixel-border hover:translate-x-0.5`}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Guestbook entries={sr.guestbook} onAdd={sr.addGuestEntry} />
        <BgmPlayer bgm={sr.bgm} onSet={sr.setBgm} />
      </div>

      <p className="mt-6 text-center font-tiny text-[10px] text-ink-soft">
        ⓒ 함공 · 영상은 친구들끼리 직접 연결돼요. 회사·학교 와이파이에선 연결이 안 될 수도 있어요.
      </p>
    </main>
  );
}
