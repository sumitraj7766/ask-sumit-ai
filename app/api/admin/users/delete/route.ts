import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ChatHistory from "@/models/ChatHistory";
import Conversation from "@/models/Conversation";

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;

    if (adminToken !== "admin_verified") {
      return NextResponse.json(
        { success: false, message: "Admin access denied" },
        { status: 401 }
      );
    }

    await connectDB();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await ChatHistory.deleteMany({ userId });
    await Conversation.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}