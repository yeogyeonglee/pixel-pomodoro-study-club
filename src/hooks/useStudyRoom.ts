import { useCallback, useEffect, useRef, useState } from "react";
import type Peer from "peerjs";
import type { DataConnection, MediaConnection } from "peerjs";
import {
  SLOTS,
  mergeGuestbook,
  peerIdFor,
  slotFromPeerId,
  type BgmState,
  type GuestEntry,
  type PeerMsg,
  type Slot,
} from "@/lib/room/protocol";
import {
  advance,
  initialTimer,
  pauseTimer,
  pickNewer,
  normalizeTimer,
  resetTimer,
  setPreset,
  startTimer,
  switchMode,
  type TimerMode,
  type TimerPreset,
  type TimerState,
} from "@/lib/room/timer";
import type { PresenceKey } from "@/lib/room/presence";
import { parseTheme, shouldAdoptTheme, type RoomTheme } from "@/lib/room/theme";
import { classifyCamError, isInFrame, VIDEO_CONSTRAINTS, type CamProblem } from "@/lib/room/camera";

export type RoomStatus = "idle" | "media" | "connecting" | "ready" | "full" | "error";

export type Member = {
  slot: Slot;
  name: string;
  stream: MediaStream | null;
  camOn: boolean;
  micOn: boolean;
  presence: PresenceKey | null;
  isMe: boolean;
};

export type Cheer = { id: string; to: Slot; from: string };

type PeerCtor = typeof Peer;

const guestKey = (room: string) => `hamgong-guestbook-${room}`;

function claimSlot(PeerClass: PeerCtor, id: string): Promise<Peer | null> {
  return new Promise((resolve, reject) => {
    const p = new PeerClass(id, { debug: 0 });
    const cleanup = () => {
      clearTimeout(timer);
      p.off("open", onOpen);
      p.off("error", onError);
    };
    const onOpen = () => {
      cleanup();
      resolve(p);
    };
    // Only for the claim phase: later errors (e.g. an empty seat) must not destroy the peer.
    const onError = (err: { type?: string }) => {
      cleanup();
      p.destroy();
      if (err?.type === "unavailable-id") resolve(null);
      else reject(err);
    };
    const timer = setTimeout(() => {
      cleanup();
      p.destroy();
      reject(new Error("연결 서버 응답이 없어요"));
    }, 12000);
    p.on("open", onOpen);
    p.on("error", onError);
  });
}

function placeholderStream(name: string): MediaStream {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");
  const draw = () => {
    if (!ctx) return;
    ctx.fillStyle = "#f6dce6";
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = "#4a5378";
    ctx.font = "20px Galmuri11, monospace";
    ctx.textAlign = "center";
    ctx.fillText("카메라 없음", 160, 112);
    ctx.font = "14px Galmuri11, monospace";
    ctx.fillText(name, 160, 140);
  };
  draw();
  const stream = canvas.captureStream(2);
  const iv = setInterval(draw, 1000);
  stream.getVideoTracks()[0]?.addEventListener("ended", () => clearInterval(iv));
  return stream;
}

async function requestCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new TypeError("no mediaDevices");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: true });
    stream.getAudioTracks().forEach((t) => (t.enabled = false));
    return stream;
  } catch (first) {
    // Mic may be the blocked/busy device; try camera alone before giving up.
    try {
      return await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS });
    } catch {
      throw first;
    }
  }
}

async function getLocalMedia(
  name: string,
): Promise<{ stream: MediaStream; hasCam: boolean; problem: CamProblem | null }> {
  try {
    return { stream: await requestCamera(), hasCam: true, problem: null };
  } catch (err) {
    console.warn("[함공] camera failed", err);
    return { stream: placeholderStream(name), hasCam: false, problem: classifyCamError(err, isInFrame()) };
  }
}

export function useStudyRoom(
  room: string,
  name: string,
  enabled: boolean,
  initialTheme: { theme: RoomTheme; explicit: boolean },
) {
  const [theme, setTheme] = useState<RoomTheme>(initialTheme.theme);
  const themeRef = useRef(initialTheme);
  useEffect(() => {
    themeRef.current = initialTheme;
    setTheme(initialTheme.theme);
  }, [initialTheme.theme, initialTheme.explicit]);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mySlot, setMySlot] = useState<Slot | null>(null);
  const [members, setMembers] = useState<Partial<Record<Slot, Member>>>({});
  const [timer, setTimerState] = useState<TimerState>(initialTimer);
  const [guestbook, setGuestbook] = useState<GuestEntry[]>([]);
  const [bgm, setBgmState] = useState<BgmState>({ videoId: null, setBy: "", version: 0 });
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [camProblem, setCamProblem] = useState<CamProblem | null>(null);
  const callsRef = useRef(new Map<Slot, MediaConnection>());

  const timerRef = useRef(timer);
  const guestRef = useRef(guestbook);
  const bgmRef = useRef(bgm);
  const connsRef = useRef(new Map<Slot, DataConnection>());
  const localRef = useRef<{
    stream: MediaStream | null;
    camOn: boolean;
    micOn: boolean;
    hasCam: boolean;
    presence: PresenceKey | null;
  }>({
    stream: null,
    camOn: false,
    micOn: false,
    hasCam: false,
    presence: null,
  });
  const mySlotRef = useRef<Slot | null>(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  // Load saved guestbook for this room
  useEffect(() => {
    try {
      const raw = localStorage.getItem(guestKey(room));
      if (raw) {
        const saved = JSON.parse(raw) as GuestEntry[];
        guestRef.current = mergeGuestbook(guestRef.current, saved);
        setGuestbook(guestRef.current);
      }
    } catch {
      /* ignore broken storage */
    }
  }, [room]);

  const applyTimer = useCallback((s: TimerState) => {
    timerRef.current = s;
    setTimerState(s);
  }, []);

  const applyGuestbook = useCallback(
    (entries: GuestEntry[]) => {
      guestRef.current = mergeGuestbook(guestRef.current, entries);
      setGuestbook(guestRef.current);
      try {
        localStorage.setItem(guestKey(room), JSON.stringify(guestRef.current));
      } catch {
        /* storage full */
      }
    },
    [room],
  );

  const applyBgm = useCallback((s: BgmState) => {
    bgmRef.current = s;
    setBgmState(s);
  }, []);

  const pushCheer = useCallback((to: Slot, from: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCheers((c) => [...c.slice(-20), { id, to, from }]);
    setTimeout(() => setCheers((c) => c.filter((x) => x.id !== id)), 1800);
  }, []);

  const broadcast = useCallback((msg: PeerMsg) => {
    connsRef.current.forEach((c) => {
      if (c.open) c.send(msg);
    });
  }, []);

  const updateMember = useCallback((slot: Slot, patch: Partial<Member>) => {
    setMembers((m) => {
      const prev = m[slot] ?? {
        slot,
        name: "친구",
        stream: null,
        camOn: true,
        micOn: false,
        presence: null,
        isMe: false,
      };
      return { ...m, [slot]: { ...prev, ...patch } };
    });
  }, []);

  const removeMember = useCallback((slot: Slot) => {
    setMembers((m) => {
      const next = { ...m };
      delete next[slot];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !room) return;
    let cancelled = false;
    let peer: Peer | null = null;
    const conns = connsRef.current;
    const calls = callsRef.current;

    const handleMsg = (slot: Slot, msg: PeerMsg) => {
      switch (msg.type) {
        case "hello": {
          updateMember(slot, {
            name: msg.name,
            camOn: msg.camOn,
            micOn: msg.micOn,
            presence: msg.presence ?? null,
          });
          const theirs = parseTheme(msg.theme);
          if (
            theirs &&
            shouldAdoptTheme({
              mine: themeRef.current.theme,
              mineExplicit: themeRef.current.explicit,
              mySlot: mySlotRef.current ?? 9,
              theirs,
              theirsExplicit: !!msg.themeExplicit,
              theirSlot: slot,
            })
          ) {
            themeRef.current = { theme: theirs, explicit: true };
            setTheme(theirs);
          }
          break;
        }
        case "status":
          updateMember(slot, { camOn: msg.camOn, micOn: msg.micOn, presence: msg.presence ?? null });
          break;
        case "timer": {
          const now = Date.now();
          const merged = pickNewer(advance(timerRef.current, now), advance(normalizeTimer(msg.state), now));
          if (merged !== timerRef.current) applyTimer(merged);
          break;
        }
        case "guestbook":
          applyGuestbook(msg.entries);
          break;
        case "bgm":
          if (msg.state.version > bgmRef.current.version) applyBgm(msg.state);
          break;
        case "cheer":
          pushCheer(msg.to, msg.from);
          break;
      }
    };

    const setupConn = (conn: DataConnection, slot: Slot) => {
      const onOpen = () => {
        const l = localRef.current;
        conn.send({
          type: "hello",
          name: nameRef.current,
          camOn: l.camOn,
          micOn: l.micOn,
          presence: l.presence,
          theme: themeRef.current.theme,
          themeExplicit: themeRef.current.explicit,
        } satisfies PeerMsg);
        conn.send({ type: "timer", state: timerRef.current } satisfies PeerMsg);
        conn.send({ type: "guestbook", entries: guestRef.current } satisfies PeerMsg);
        if (bgmRef.current.version > 0) conn.send({ type: "bgm", state: bgmRef.current } satisfies PeerMsg);
      };
      if (conn.open) onOpen();
      else conn.on("open", onOpen);
      conn.on("data", (d) => handleMsg(slot, d as PeerMsg));
      conn.on("close", () => {
        if (conns.get(slot) === conn) {
          conns.delete(slot);
          calls.get(slot)?.close();
          calls.delete(slot);
          removeMember(slot);
        }
      });
      conn.on("error", () => {});
    };

    const setupCall = (call: MediaConnection, slot: Slot) => {
      call.on("stream", (remote) => updateMember(slot, { stream: remote }));
      call.on("close", () => {
        if (calls.get(slot) === call) {
          calls.delete(slot);
          updateMember(slot, { stream: null });
        }
      });
      call.on("error", () => {});
    };

    // When both sides dial at once, keep the link started by the lower slot.
    const preferIncoming = (remote: Slot) => (mySlotRef.current ?? 0) > remote;

    (async () => {
      try {
        setStatus("media");
        const { stream, hasCam, problem } = await getLocalMedia(nameRef.current);
        setCamProblem(problem);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localRef.current = { stream, camOn: hasCam, micOn: false, hasCam, presence: localRef.current.presence };

        setStatus("connecting");
        const { default: PeerClass } = await import("peerjs");
        let slot: Slot | null = null;
        for (let attempt = 0; attempt < 2 && !peer; attempt++) {
          for (const s of SLOTS) {
            if (cancelled) return;
            const p = await claimSlot(PeerClass, peerIdFor(room, s));
            if (p) {
              peer = p;
              slot = s;
              break;
            }
          }
          if (!peer && attempt === 0) await new Promise((r) => setTimeout(r, 2500));
        }
        if (cancelled) {
          peer?.destroy();
          return;
        }
        if (!peer || !slot) {
          setStatus("full");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const me = slot;
        mySlotRef.current = me;
        setMySlot(me);
        updateMember(me, {
          name: nameRef.current,
          stream,
          camOn: hasCam,
          micOn: false,
          presence: localRef.current.presence,
          isMe: true,
        });

        peer.on("connection", (conn) => {
          const s = slotFromPeerId(conn.peer);
          if (!s || s === me) return conn.close();
          const existing = conns.get(s);
          if (existing && existing.open && !preferIncoming(s)) return conn.close();
          conns.set(s, conn);
          if (existing && existing !== conn) existing.close();
          setupConn(conn, s);
        });
        peer.on("call", (call) => {
          const s = slotFromPeerId(call.peer);
          if (!s || s === me) return call.close();
          const existing = calls.get(s);
          if (existing && existing.open && !preferIncoming(s)) return call.close();
          call.answer(localRef.current.stream ?? undefined);
          calls.set(s, call);
          if (existing && existing !== call) existing.close();
          setupCall(call, s);
        });
        peer.on("error", (err: { type?: string }) => {
          if (err?.type === "peer-unavailable") return;
          console.warn("[함공] peer error", err);
        });
        peer.on("disconnected", () => {
          if (!cancelled && peer && !peer.destroyed) peer.reconnect();
        });

        for (const s of SLOTS) {
          if (s === me) continue;
          const id = peerIdFor(room, s);
          const conn = peer.connect(id, { reliable: true });
          conns.set(s, conn);
          setupConn(conn, s);
          const call = peer.call(id, stream);
          if (call) {
            calls.set(s, call);
            setupCall(call, s);
          }
        }
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError(e instanceof Error ? e.message : "연결에 실패했어요");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      conns.forEach((c) => c.close());
      conns.clear();
      calls.forEach((c) => c.close());
      calls.clear();
      peer?.destroy();
      localRef.current.stream?.getTracks().forEach((t) => t.stop());
      localRef.current = { stream: null, camOn: false, micOn: false, hasCam: false, presence: localRef.current.presence };
      mySlotRef.current = null;
      setMembers({});
      setMySlot(null);
    };
  }, [enabled, room, updateMember, removeMember, applyTimer, applyGuestbook, applyBgm, pushCheer]);

  // ---- actions ----
  const timerAction = useCallback(
    (kind: "start" | "pause" | "reset" | TimerMode) => {
      const now = Date.now();
      const by = nameRef.current;
      const cur = timerRef.current;
      const next =
        kind === "start"
          ? startTimer(cur, now, by)
          : kind === "pause"
            ? pauseTimer(cur, now, by)
            : kind === "reset"
              ? resetTimer(cur, now, by)
              : switchMode(cur, kind, now, by);
      applyTimer(next);
      broadcast({ type: "timer", state: next });
    },
    [applyTimer, broadcast],
  );

  const setTimerPreset = useCallback(
    (preset: TimerPreset) => {
      const next = setPreset(timerRef.current, preset, Date.now(), nameRef.current);
      applyTimer(next);
      broadcast({ type: "timer", state: next });
    },
    [applyTimer, broadcast],
  );

  const addGuestEntry = useCallback(
    (text: string, mood: string) => {
      const entry: GuestEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: nameRef.current,
        slot: mySlotRef.current ?? 1,
        mood,
        text: text.slice(0, 200),
        createdAt: Date.now(),
      };
      applyGuestbook([entry]);
      broadcast({ type: "guestbook", entries: [entry] });
    },
    [applyGuestbook, broadcast],
  );

  const setBgm = useCallback(
    (videoId: string | null) => {
      const s: BgmState = {
        videoId,
        setBy: nameRef.current,
        version: Math.max(Date.now(), bgmRef.current.version + 1),
      };
      applyBgm(s);
      broadcast({ type: "bgm", state: s });
    },
    [applyBgm, broadcast],
  );

  const sendStatus = useCallback(() => {
    const l = localRef.current;
    const me = mySlotRef.current;
    if (me) updateMember(me, { camOn: l.camOn, micOn: l.micOn, presence: l.presence });
    broadcast({ type: "status", camOn: l.camOn, micOn: l.micOn, presence: l.presence });
  }, [broadcast, updateMember]);

  const setPresence = useCallback(
    (key: PresenceKey | null) => {
      localRef.current.presence = key;
      sendStatus();
    },
    [sendStatus],
  );

  const toggleCam = useCallback(() => {
    const l = localRef.current;
    if (!l.stream || !l.hasCam) return;
    l.camOn = !l.camOn;
    l.stream.getVideoTracks().forEach((t) => (t.enabled = l.camOn));
    sendStatus();
  }, [sendStatus]);

  /** Try the camera again and swap the new tracks into every live call without reconnecting. */
  const retryCamera = useCallback(async () => {
    let fresh: MediaStream;
    try {
      fresh = await requestCamera();
    } catch (err) {
      setCamProblem(classifyCamError(err, isInFrame()));
      return false;
    }
    const l = localRef.current;
    const old = l.stream;
    const v = fresh.getVideoTracks()[0];
    const a = fresh.getAudioTracks()[0];
    callsRef.current.forEach((call) => {
      call.peerConnection?.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video" && v) void sender.replaceTrack(v);
        if (sender.track?.kind === "audio" && a) void sender.replaceTrack(a);
      });
    });
    old?.getTracks().forEach((t) => t.stop());
    l.stream = fresh;
    l.hasCam = true;
    l.camOn = true;
    l.micOn = false;
    const me = mySlotRef.current;
    if (me) updateMember(me, { stream: fresh });
    setCamProblem(null);
    sendStatus();
    return true;
  }, [sendStatus, updateMember]);

  const toggleMic = useCallback(() => {
    const l = localRef.current;
    if (!l.stream || l.stream.getAudioTracks().length === 0) return;
    l.micOn = !l.micOn;
    l.stream.getAudioTracks().forEach((t) => (t.enabled = l.micOn));
    sendStatus();
  }, [sendStatus]);

  const sendCheer = useCallback(
    (to: Slot) => {
      pushCheer(to, nameRef.current);
      broadcast({ type: "cheer", to, from: nameRef.current });
    },
    [broadcast, pushCheer],
  );

  return {
    status,
    error,
    mySlot,
    members,
    timer,
    guestbook,
    bgm,
    cheers,
    timerAction,
    addGuestEntry,
    setBgm,
    toggleCam,
    toggleMic,
    sendCheer,
    camProblem,
    retryCamera,
    theme,
    setPresence,
    setTimerPreset,
  };
}

export type StudyRoom = ReturnType<typeof useStudyRoom>;
