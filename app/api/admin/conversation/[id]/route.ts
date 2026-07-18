import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import ChatHistory from "@/models/ChatHistory";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;

    if (adminToken !== "admin_verified") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access denied",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found",
        },
        { status: 404 }
      );
    }

    const chats = await ChatHistory.find({
      conversationId: id,
    }).sort({
      createdAt: 1,
    });

    return NextResponse.json({
      success: true,
      conversation,
      chats,
    });
  } catch (error) {
    console.error("CONVERSATION_DETAILS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch conversation",
      },
      { status: 500 }
    );
  }
}