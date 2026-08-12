import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { verifyAuthToken } from "@/lib/firebase/admin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser = (decodedToken ? db.getUserById(decodedToken.uid) : null) || db.getUserById(body._userId || "");

    let updated;
    if (body.paymentMode) {
      updated = db.updateProjectPaymentMode(params.id, body.paymentMode, activeUser || undefined);
    } else if (body.milestoneId) {
      const { milestoneId, ...updates } = body;
      updated = db.updateProjectPaymentMilestone(params.id, milestoneId, updates, activeUser || undefined);
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: "Project or milestone not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
