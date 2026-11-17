export type CamProblem = "blocked-frame" | "denied" | "busy" | "missing" | "unsupported" | "unknown";

export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 640 },
  height: { ideal: 480 },
  facingMode: "user",
};

export function isInFrame(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function classifyCamError(err: unknown, inFrame: boolean): CamProblem {
  const name = err instanceof Error || (err && typeof err === "object" && "name" in err) ? String((err as { name: string }).name) : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError")
    return inFrame ? "blocked-frame" : "denied";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "busy";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") return "missing";
  if (name === "TypeError") return "unsupported";
  return "unknown";
}

export const CAM_PROBLEM_TEXT: Record<CamProblem, string> = {
  "blocked-frame": "미리보기 창 안에서는 브라우저가 카메라를 막고 있어요. 새 탭으로 열면 캠이 켜져요.",
  denied: "브라우저에서 카메라가 차단돼 있어요. 주소창 왼쪽 자물쇠 아이콘 → 카메라 '허용'으로 바꾼 뒤 다시 시도해주세요.",
  busy: "다른 앱(줌, 디스코드, 다른 탭 등)이 카메라를 쓰고 있어요. 그 앱을 끄고 다시 시도해주세요.",
  missing: "연결된 카메라를 찾지 못했어요. 카메라를 연결한 뒤 다시 시도해주세요.",
  unsupported: "이 브라우저에서는 카메라를 쓸 수 없어요. 크롬이나 사파리 최신 버전으로 열어주세요.",
  unknown: "카메라를 켜지 못했어요. 다시 시도해주세요.",
};
