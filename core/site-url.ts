const DEVELOPMENT_SITE_URL = "http://localhost:3000";

export function resolveSiteUrl(
  value: string | undefined,
  environment: string | undefined,
): string | null {
  const candidate = value?.trim();

  if (!candidate) {
    return environment === "development" ? DEVELOPMENT_SITE_URL : null;
  }

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return null;
  }

  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}
