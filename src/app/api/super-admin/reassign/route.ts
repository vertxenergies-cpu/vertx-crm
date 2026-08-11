import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifySuperAdminToken(authHeader);

  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator authorization required." },
      { status: 403 }
    );
  }

  const userAgent = req.headers.get("user-agent") || undefined;
  const ip = req.headers.get("x-forwarded-for") || req.ip || undefined;
  const actor = {
    uid: verified.uid,
    name: "Super Administrator",
    role: "SUPER_ADMIN",
    ip,
    userAgent,
  };

  try {
    const body = await req.json();
    const { type, entityId, newOwnerId, reason } = body;

    if (!type || !entityId || !newOwnerId) {
      return NextResponse.json(
        { success: false, error: "type ('PROJECT' | 'LEAD' | 'DUTY'), entityId, and newOwnerId are required." },
        { status: 400 }
      );
    }

    const res = storage.reassignWorkAsSuperAdmin(type, entityId, newOwnerId, reason, actor);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Reassigned ${type} to employee ${newOwnerId}.` });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to reassign work." },
      { status: 500 }
    );
  }
}
