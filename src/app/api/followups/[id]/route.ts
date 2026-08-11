import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = db.updateFollowUp(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Follow-up not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
