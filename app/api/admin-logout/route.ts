import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ success: true });

  res.cookies.set("admin_token", "", {
    maxAge: 0, // ❌ delete cookie
    path: "/",
  });

  return res;
}