import bcrypt from "bcryptjs";
import { client } from "@/sanity/lib/client";

export async function createAdmin() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await client.create({
    _type: "adminUser",
    username: "snipe",
    passwordHash,
    role: "superadmin",
    permissions: ["orders", "messages", "products", "posters", "categories"],
  });
}