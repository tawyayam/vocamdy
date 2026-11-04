import { cookies } from "next/headers";
import { parseTheme, THEME_COOKIE_NAME, type Theme } from "./theme";

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  return parseTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);
}
