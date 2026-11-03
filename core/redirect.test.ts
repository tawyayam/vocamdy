import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it.each(["/", "/today", "/today?tab=1#top", "/caf%C3%A9"])(
    "accepts the relative path %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe(value);
    },
  );

  it("normalizes dot segments without changing the origin", () => {
    expect(safeRedirectPath("/foo/../bar")).toBe("/bar");
  });

  it.each([
    "https://evil.example",
    "http://evil.example",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "/foo\\bar",
    "/%2F%2Fevil.example",
    "/%2f%2fevil.example",
    "/%5Cevil.example",
    "/%5cevil.example",
    "/%255Cevil.example",
    "/%252F%252Fevil.example",
    "/a%2Fb",
    "/foo%2F..%2F..%2F%2Fevil.example",
    "/..//evil.example",
    "/foo/..//evil.example",
    "/%2e%2e//evil.example",
    "",
    "   ",
    null,
    undefined,
    42,
    true,
    {},
    [],
  ])("falls back for %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });
});
