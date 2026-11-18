import { Link } from "@tanstack/react-router";
import { Home, Mic, MicOff, Video, VideoOff } from "lucide-react";
import type { StudyRoom } from "@/hooks/useStudyRoom";
import { PixelButton } from "./PixelButton";

export function MyControls({ sr }: { sr: StudyRoom }) {
  const me = sr.mySlot ? sr.members[sr.mySlot] : undefined;
  return (
    <div className="flex gap-1.5">
      <PixelButton
        size="icon"
        tone={me?.camOn ? "mint" : "paper"}
        onClick={sr.camProblem ? () => void sr.retryCamera() : sr.toggleCam}
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
  );
}

export const STATUS_TEXT: Record<StudyRoom["status"], string> = {
  idle: "준비 중",
  media: "카메라 켜는 중",
  connecting: "방 연결 중",
  ready: "접속 중",
  full: "방이 꽉 찼어요",
  error: "연결 오류",
};
