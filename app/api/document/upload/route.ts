import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";


import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import pdfParse from "pdf-parse";

console.log("STEP 1: Request received");

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    console.log("STEP 2: MongoDB connected");

    // Verify user
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
    ) as {
      userId: string;
    };

    const formData = await req.formData();

    console.log("STEP 3: FormData received");

    const file = formData.get("file") as File;
    console.log("STEP 4: File:", file?.name);

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          message: "Only PDF files are allowed",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

console.log("STEP 5: Buffer created");
console.log("STEP 6: Starting PDF extraction");

const pdf = await pdfParse(buffer);

const extractedText = pdf.text;

console.log("STEP 7: PDF extracted");
    const document = await Document.create({
      userId: decoded.userId,
      filename: file.name,
      originalName: file.name,
      fileType: file.type,
      extractedText,
      status: "ready",
    });

    return NextResponse.json({
      success: true,
      message: "PDF uploaded successfully",
      documentId: document._id,
    });
  } catch (error) {
    console.error("DOCUMENT_UPLOAD_ERROR:", error);

    console.log("STEP 9: Document saved");

    return NextResponse.json(
      {
        success: false,
        message: "Upload failed",
      },
      { status: 500 }
    );
  }
}
