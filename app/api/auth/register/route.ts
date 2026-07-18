import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { name, email, password } = await req.json();

    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists"
        },
        {
          status: 400
        }
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: user._id
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Server Error"
      },
      {
        status: 500
      }
    );
  }
}