import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/db/session";

const publicPaths = new Set(["/login", "/auth/callback"]);

function redirectToLogin(request: NextRequest, response: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { response, claims } = await updateSession(request);

  if (publicPaths.has(request.nextUrl.pathname)) {
    return response;
  }

  if (!claims) {
    return redirectToLogin(request, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
