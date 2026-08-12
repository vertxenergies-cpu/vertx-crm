import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { verifyAuthToken } from "@/lib/firebase/admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = db.getLeadById(params.id);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: lead });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser = (decodedToken ? db.getUserById(decodedToken.uid) : null) || db.getUserById(body._userId || "");

    const actor = activeUser
      ? { uid: activeUser.uid, name: activeUser.name, role: activeUser.role || undefined }
      : { uid: body._userId || "system", name: body._userName || "System", role: undefined };

    let updated;
    if (body.assignedToUid !== undefined) {
      updated = db.assignLead(params.id, body.assignedToUid, actor);
    }

    if (Object.keys(body).some((k) => k !== "assignedToUid" && !k.startsWith("_"))) {
      updated = db.updateLead(params.id, body, activeUser || undefined);
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
