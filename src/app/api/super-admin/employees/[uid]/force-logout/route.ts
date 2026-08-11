import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken, revokeUserSessions } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifySuperAdminToken(authHeader);

  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator authorization required." },
      { status: 403 }
    );
  }

  const { uid } = params;
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
    // Revoke Firebase Auth refresh tokens
    try {
      await revokeUserSessions(uid);
    } catch (fbErr: any) {
      console.warn("Could not revoke Firebase sessions:", fbErr?.message);
    }

    const res = storage.forceLogoutUser(uid, actor);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Forced logout and revoked sessions for user ${uid}.` });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to force logout user." },
      { status: 500 }
    );
  }
}
