const FALLBACK_PATH = "/";
const LOCAL_ORIGIN = "http://vocamdy.local";
const MAX_DECODE_PASSES = 3;

function decodePathname(pathname: string): string | null {
  let decoded = pathname;

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    try {
      const next = decodeURIComponent(decoded);

      if (next === decoded) {
        return decoded;
      }

      decoded = next;
    } catch {
      return null;
    }
  }

  return /%(?:2f|5c)/i.test(decoded) ? null : decoded;
}

function isUnsafePath(pathname: string): boolean {
  return (
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\")
  );
}

export function safeRedirectPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return FALLBACK_PATH;
  }

  let url: URL;

  try {
    url = new URL(value, LOCAL_ORIGIN);
  } catch {
    return FALLBACK_PATH;
  }

  if (url.origin !== LOCAL_ORIGIN) {
    return FALLBACK_PATH;
  }

  if (/%(?:2f|5c)/i.test(url.pathname)) {
    return FALLBACK_PATH;
  }

  const decodedPathname = decodePathname(url.pathname);

  if (!decodedPathname || isUnsafePath(decodedPathname)) {
    return FALLBACK_PATH;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
