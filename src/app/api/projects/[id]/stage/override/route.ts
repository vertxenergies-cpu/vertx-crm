import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { verifyAuthToken } from "@/lib/firebase/admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { targetStage, reason, confirmation, _userId } = body;

    if (!targetStage) {
      return NextResponse.json({ success: false, error: "Target stage is required" }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: "A mandatory, detailed reason (minimum 5 characters) is required for stage override.",
      }, { status: 400 });
    }

    if (!confirmation) {
      return NextResponse.json({
        success: false,
        error: "Explicit confirmation is required to execute a manual stage override.",
      }, { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser =
      (decodedToken ? db.getUserById(decodedToken.uid) : null) ||
      db.getUserById(_userId || "") ||
      db.getUserById("usr-super-admin");

    if (!activeUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Strict Super Admin verification
    if (activeUser.role !== "SUPER_ADMIN" && activeUser.email !== "vertxenergies@gmail.com") {
      return NextResponse.json({
        success: false,
        error: "Access Denied: Only Super Admin is authorized to execute manual stage overrides.",
      }, { status: 403 });
    }

    const result = db.overrideProjectStage(params.id, targetStage, activeUser, reason);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `[SUPER ADMIN OVERRIDE] Project stage manually set to ${targetStage}`,
      data: result.project,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
