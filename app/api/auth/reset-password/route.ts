import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Otp from "@/models/Otp";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and new password are required"
        },
        { status: 400 }
      );
    }

    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord || !otpRecord.isVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP verification required"
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    await Otp.deleteMany({ email });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Password reset failed"
      },
      { status: 500 }
    );
  }
}