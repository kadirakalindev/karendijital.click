import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "karendijital.click";

const protectedPaths = [
  "/dashboard",
  "/appointments",
  "/customers",
  "/services",
  "/products",
  "/packages",
  "/staff",
  "/invoices",
  "/reports",
  "/expenses",
  "/settings",
];

export function middleware(request: NextRequest) {
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
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Dashboard routes - require auth
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
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
