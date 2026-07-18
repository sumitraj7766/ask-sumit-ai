import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP not found"
        },
        { status: 404 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP expired"
        },
        { status: 400 }
      );
    }

    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP"
        },
        { status: 400 }
      );
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully"
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "OTP verification failed"
      },
      { status: 500 }
    );
  }
}