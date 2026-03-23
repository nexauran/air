import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // 🔥 All admins list
  const admins = [
    {
      username: process.env.ADMIN_1_USERNAME,
      password: process.env.ADMIN_1_PASSWORD,
    },
    {
      username: process.env.ADMIN_2_USERNAME,
      password: process.env.ADMIN_2_PASSWORD,
    },
    {
      username: process.env.ADMIN_3_USERNAME,
      password: process.env.ADMIN_3_PASSWORD,
    },
  ];

  // ✅ check match
  const admin = admins.find(
    (a) => a.username === username && a.password === password
  );

  if (!admin) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // 🔐 create token (store username)
  const token = jwt.sign(
    {
      admin: true,
      username: admin.username, // 🔥 useful later
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}