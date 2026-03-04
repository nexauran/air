import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

interface AddressDoc {
  _id: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      default: isDefault,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const created: { _id: string } = await client.create({
      _type: "address",
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      default: !!isDefault,
      createdAt: new Date().toISOString(),
    });

    // If default = true → unset others
    if (isDefault) {
      const others = await client.fetch<AddressDoc[]>(
        `*[_type == "address" && email == $email && _id != $id && default == true]{ _id }`,
        { email, id: created._id }
      );

      await Promise.all(
        others.map((addr: AddressDoc) =>
          client
            .patch(addr._id)
            .set({ default: false })
            .commit({ autoGenerateArrayKeys: true })
        )
      );
    }

    return NextResponse.json({ success: true, address: created });

  } catch (err) {
    console.error("Address create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}