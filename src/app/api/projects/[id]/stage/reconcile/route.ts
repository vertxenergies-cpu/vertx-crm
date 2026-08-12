import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAuthenticatedUser, canOverrideProjectStage } from "@/lib/auth/authorization";
import { validateCompletedStages } from "@/lib/constants";
import { ProjectStage } from "@/types";

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
        error: "Forbidden: Only Super Admin is authorized to execute stage history reconciliation.",
      }, { status: 403 });
    }

    const body = await req.json();
    const { confirmedStages, reason } = body;

    if (!Array.isArray(confirmedStages)) {
      return NextResponse.json({
        success: false,
        error: "confirmedStages must be an array of completed stages.",
      }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: "A mandatory reconciliation reason (minimum 5 characters) is required.",
      }, { status: 400 });
    }

    const validation = validateCompletedStages(confirmedStages as ProjectStage[]);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error || "Selected completed stages must be contiguous starting from Booking.",
      }, { status: 400 });
    }

    const result = db.reconcileProjectStageHistory(
      params.id,
      confirmedStages as ProjectStage[],
      user,
      reason
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Project stage history successfully reconciled for ${result.project?.projectNumber}`,
      data: result.project,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
