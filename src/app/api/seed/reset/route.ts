import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    db.resetDemoData();
    return NextResponse.json({ success: true, message: "Demo database reset to initial Kerala solar dataset." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
