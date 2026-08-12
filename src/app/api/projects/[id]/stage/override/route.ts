import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAuthenticatedUser, canOverrideProjectStage } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid authentication token required." }, { status: 401 });
    }

    if (!canOverrideProjectStage(user)) {
      return NextResponse.json({
        success: false,
        error: "Access Denied: Only Super Admin is authorized to execute manual stage overrides.",
      }, { status: 403 });
    }

    const body = await req.json();
    const { targetStage, reason, confirmation } = body;

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

    const result = db.overrideProjectStage(params.id, targetStage, user, reason);
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
