import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "./youtube";

describe("parseYouTubeId", () => {
  it("reads watch links", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=jfKfPfyJRdk")).toBe("jfKfPfyJRdk");
  });
  it("reads short links", () => {
    expect(parseYouTubeId("https://youtu.be/jfKfPfyJRdk?si=abc")).toBe("jfKfPfyJRdk");
  });
  it("reads shorts and live links", () => {
    expect(parseYouTubeId("youtube.com/shorts/jfKfPfyJRdk")).toBe("jfKfPfyJRdk");
    expect(parseYouTubeId("https://www.youtube.com/live/jfKfPfyJRdk")).toBe("jfKfPfyJRdk");
  });
  it("rejects other links", () => {
    expect(parseYouTubeId("https://example.com/watch?v=jfKfPfyJRdk")).toBeNull();
    expect(parseYouTubeId("hello")).toBeNull();
  });
});
