import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // 🔐 Create token (1 hour)
  const token = jwt.sign(
    { admin: true },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  const response = NextResponse.json({ success: true });

  // 🍪 Set cookie
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ FIXED
    sameSite: "strict", // ✅ more secure
    path: "/",
    maxAge: 60 * 60, // ✅ 1 hour
  });

  return response;
}