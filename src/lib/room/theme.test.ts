import { describe, expect, it } from "vitest";
import { shouldAdoptTheme } from "./theme";

const base = { mine: "minihompy", mineExplicit: false, mySlot: 2, theirs: "crazy", theirsExplicit: true, theirSlot: 1 } as const;

describe("room theme sync", () => {
  it("a friend who joined by code takes the room maker's theme", () => {
    expect(shouldAdoptTheme(base)).toBe(true);
  });
  it("the room maker keeps their theme when a later friend differs", () => {
    expect(shouldAdoptTheme({ ...base, mineExplicit: true, mySlot: 1, theirSlot: 2 })).toBe(false);
  });
  it("ignores a friend who never picked a theme", () => {
    expect(shouldAdoptTheme({ ...base, theirsExplicit: false })).toBe(false);
  });
});
