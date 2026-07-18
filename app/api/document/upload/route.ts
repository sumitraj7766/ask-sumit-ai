import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
    };

    // Read uploaded file
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file uploaded",
        },
        {
          status: 400,
        }
      );
    }

    // Allow only PDFs
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          message: "Only PDF files are allowed",
        },
        {
          status: 400,
        }
      );
    }

    // Save metadata only
    const document = await Document.create({
      userId: decoded.userId,
      filename: file.name,
      originalName: file.name,
      fileType: file.type,
      extractedText: "", // We'll implement parsing later
      status: "processing",
    });

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      documentId: document._id,
    });
  } catch (error) {
    console.error("DOCUMENT_UPLOAD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}