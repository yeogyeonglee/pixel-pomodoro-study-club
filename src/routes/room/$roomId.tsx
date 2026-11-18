import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import minimi from "@/assets/pixel-minimi.png";
import { PixelButton } from "@/components/hamgong/PixelButton";
import { CrazyRoom } from "@/components/hamgong/themes/CrazyRoom";
import { MinihompyRoom } from "@/components/hamgong/themes/MinihompyRoom";
import { useStudyRoom } from "@/hooks/useStudyRoom";
import { NAME_KEY, normalizeRoomCode } from "@/lib/room/protocol";
import { DEFAULT_THEME, parseTheme, themeKey, type RoomTheme } from "@/lib/room/theme";

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
  validateSearch: (search: Record<string, unknown>): { theme?: RoomTheme } => {
    const theme = parseTheme(search.theme);
    return theme ? { theme } : {};
  },
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  const room = normalizeRoomCode(roomId);
  const [name, setName] = useState("");
  const [entered, setEntered] = useState(false);
  const { theme: urlTheme } = Route.useSearch();
  const [initialTheme, setInitialTheme] = useState<{ theme: RoomTheme; explicit: boolean }>({
    theme: urlTheme ?? DEFAULT_THEME,
    explicit: !!urlTheme,
  });

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY) ?? "");
    if (!urlTheme) {
      const saved = parseTheme(localStorage.getItem(themeKey(room)));
      if (saved) setInitialTheme({ theme: saved, explicit: true });
    }
  }, [room, urlTheme]);

  const sr = useStudyRoom(room, name.trim() || "익명의 공부러", entered, initialTheme);
  const theme = sr.theme;

  useEffect(() => {
    if (initialTheme.explicit || theme !== initialTheme.theme) localStorage.setItem(themeKey(room), theme);
  }, [room, theme, initialTheme]);

  const inviteUrl = () =>
    typeof window === "undefined" ? "" : `${window.location.origin}/room/${room}?theme=${theme}`;
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl());
      toast("초대 링크를 복사했어요! 친구에게 보내주세요 ✿");
    } catch {
      toast(inviteUrl());
    }
  };

  const display = name.trim() || "익명의 공부러";
  let body;
  if (!entered) {
    body = (
      <EnterGate
        room={room}
        name={name}
        setName={setName}
        onEnter={() => {
          localStorage.setItem(NAME_KEY, display);
          setEntered(true);
        }}
      />
    );
  } else if (sr.status === "full") {
    body = (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm bg-paper p-6 text-center pixel-card">
          <h1 className="font-display text-2xl">방이 꽉 찼어요 (3/3)</h1>
          <p className="mt-2 text-sm text-ink-soft">이 방에는 이미 3명이 공부 중이에요.</p>
          <Link to="/" className="mt-4 inline-block">
            <PixelButton tone="cy">새 방 만들러 가기</PixelButton>
          </Link>
        </div>
      </main>
    );
  } else if (theme === "crazy") {
    body = <CrazyRoom room={room} sr={sr} name={display} onInvite={copyInvite} />;
  } else {
    body = <MinihompyRoom room={room} sr={sr} name={display} onInvite={copyInvite} />;
  }

  return (
    <div data-theme={theme} className="min-h-screen theme-page">
      {body}
    </div>
  );
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
