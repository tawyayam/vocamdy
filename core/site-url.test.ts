import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("normalizes a valid URL and removes trailing slashes", () => {
    expect(resolveSiteUrl("https://vocamdy.app/", "production")).toBe(
      "https://vocamdy.app",
    );
    expect(resolveSiteUrl("https://vocamdy.app/subpath/", "production")).toBe(
      "https://vocamdy.app/subpath",
    );
  });

  it("uses localhost in development when the value is missing", () => {
    expect(resolveSiteUrl(undefined, "development")).toBe(
      "http://localhost:3000",
    );
    expect(resolveSiteUrl("", "development")).toBe("http://localhost:3000");
    expect(resolveSiteUrl("   ", "development")).toBe("http://localhost:3000");
  });

  it("uses a valid value in development", () => {
    expect(resolveSiteUrl("http://localhost:4000/", "development")).toBe(
      "http://localhost:4000",
    );
  });

  it.each([undefined, "", "   "] as const)(
    "fails closed in production when the value is missing",
    (value) => {
      expect(resolveSiteUrl(value, "production")).toBeNull();
    },
  );

  it.each([
    "example.com",
    "not a url",
    "ftp://vocamdy.app",
    "https://",
    "https://vocamdy.app?query=1",
    "https://vocamdy.app#fragment",
    "https://user:pass@vocamdy.app",
  ])("fails closed in production for malformed value %s", (value) => {
    expect(resolveSiteUrl(value, "production")).toBeNull();
  });

  it("fails closed in development for a malformed value", () => {
    expect(resolveSiteUrl("example.com", "development")).toBeNull();
  });

  it("does not fall back outside development", () => {
    expect(resolveSiteUrl(undefined, "test")).toBeNull();
    expect(resolveSiteUrl(undefined, undefined)).toBeNull();
  });
});
