import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

function customMiddleware(_: any, req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ allow login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 🔒 protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_token")?.value;

    console.log("TOKEN IN MIDDLEWARE:", token);

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export default clerkMiddleware(customMiddleware);

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)", // ✅ run on ALL routes
  ],
};