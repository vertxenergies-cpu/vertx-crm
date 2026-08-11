import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const users = db.getUsers().filter((u) => u.approvalStatus === "APPROVED" || u.superAdmin === true || u.role === "SUPER_ADMIN");
    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
