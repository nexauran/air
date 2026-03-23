import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies(); // ✅ FIX

  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({});
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    return NextResponse.json({
      username: decoded.username,
    });
  } catch {
    return NextResponse.json({});
  }
}