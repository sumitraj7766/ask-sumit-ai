import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ChatHistory from "@/models/ChatHistory";
import Conversation from "@/models/Conversation";

export async function DELETE() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const userId = decoded.userId;

    await ChatHistory.deleteMany({ userId });
    await Conversation.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });

    response.cookies.set("token", "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}