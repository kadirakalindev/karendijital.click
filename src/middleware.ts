import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "karendijital.click";

export default async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;

  // Determine subdomain
  const currentHost = hostname
    .replace(`.${ROOT_DOMAIN}`, "")
    .replace(`:${url.port}`, "");

  const isRootDomain =
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === "localhost:3000" ||
    hostname === "localhost";

  // Static files and API routes - skip
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Dashboard routes - require auth
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/appointments") ||
      pathname.startsWith("/customers") || pathname.startsWith("/services") ||
      pathname.startsWith("/products") || pathname.startsWith("/packages") ||
      pathname.startsWith("/staff") || pathname.startsWith("/invoices") ||
      pathname.startsWith("/reports") || pathname.startsWith("/expenses") ||
      pathname.startsWith("/settings")) {
    const session = await auth();

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  // If not root domain, rewrite to business public profile
  if (!isRootDomain && currentHost !== "www") {
    return NextResponse.rewrite(
      new URL(`/${currentHost}${pathname}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
