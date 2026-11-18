import { useState } from "react";
import { toast } from "sonner";
import type { StudyRoom } from "@/hooks/useStudyRoom";
import { CAM_PROBLEM_TEXT } from "@/lib/room/camera";
import { PixelButton } from "./PixelButton";

export function CamProblemBanner({ sr }: { sr: StudyRoom }) {
  const [busy, setBusy] = useState(false);
  const problem = sr.camProblem;
  if (!problem) return null;
  const retry = async () => {
    setBusy(true);
    const ok = await sr.retryCamera();
    setBusy(false);
    if (ok) toast("캠이 켜졌어요! 📷");
  };
  return (
    <div role="alert" className="mb-3 flex flex-col gap-2 bg-butter p-3 text-ink pixel-border sm:flex-row sm:items-center">
      <p className="flex-1 text-xs leading-relaxed">
        <b className="font-display">📷 내 캠이 안 켜졌어요.</b> {CAM_PROBLEM_TEXT[problem]}
      </p>
      <div className="flex shrink-0 gap-2">
        {problem === "blocked-frame" && (
          <PixelButton size="sm" tone="cy" onClick={() => window.open(window.location.href, "_blank", "noopener")}>
            새 탭에서 열기
          </PixelButton>
        )}
        <PixelButton size="sm" tone={problem === "blocked-frame" ? "paper" : "cy"} onClick={retry} disabled={busy}>
          {busy ? "켜는 중…" : "캠 다시 켜기"}
        </PixelButton>
      </div>
    </div>
  );
}
