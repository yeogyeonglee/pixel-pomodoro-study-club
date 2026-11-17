const ID = /^[A-Za-z0-9_-]{11}$/;

/** Extract an 11-char YouTube video id from common link shapes, or null. */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (ID.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\.|^music\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  return id && ID.test(id) ? id : null;
}
