import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
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

  return NextResponse.json({
    success: true,
    message: "Admin verified",
  });
}