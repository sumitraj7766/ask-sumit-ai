import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string };

    const { conversationId, title } = await req.json();

    await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        userId: decoded.userId,
      },
      {
        title,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Conversation renamed",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Rename failed",
      },
      { status: 500 }
    );
  }
}