import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ChatHistory from "@/models/ChatHistory";
import Conversation from "@/models/Conversation";

export async function GET() {
  try {
    await connectDB();

    const totalUsers = await User.countDocuments();
    const totalChats = await ChatHistory.countDocuments();
    const totalConversations = await Conversation.countDocuments();

    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalChats,
        totalConversations,
        recentUsers
      }
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin stats"
      },
      { status: 500 }
    );
  }
}