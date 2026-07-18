import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ChatHistory from "@/models/ChatHistory";
import Conversation from "@/models/Conversation";

export async function GET(
  req: NextRequest,
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

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const totalChats = await ChatHistory.countDocuments({
      userId: id,
    });

    const totalConversations = await Conversation.countDocuments({
      userId: id,
    });

    const conversations = await Conversation.find({
      userId: id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const chats = await ChatHistory.find({
      userId: id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      user,
      totalChats,
      totalConversations,
      conversations,
      chats,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user details",
      },
      { status: 500 }
    );
  }
}