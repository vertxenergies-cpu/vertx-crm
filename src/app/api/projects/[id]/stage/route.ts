import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { canUserChangeProjectStage } from "@/lib/constants";
import { getAuthenticatedUser, canViewProject, canChangeProjectStage } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid authentication token required." }, { status: 401 });
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (!canViewProject(user, project) || !canChangeProjectStage(user, project)) {
      return NextResponse.json(
        { success: false, error: `Access Denied: You are not authorized to change the stage for this project.` },
        { status: 403 }
      );
    }

    if (!canUserChangeProjectStage(user, project.currentStage)) {
      return NextResponse.json(
        {
          success: false,
          error: `Your role (${user.role}) is not authorized to advance this project stage.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const result = db.updateProjectStage(
      params.id,
      body.nextStage || body.stage,
      user,
      body.comment,
      body.confirmations
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          missingRequirements: result.missingRequirements || [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Project stage successfully advanced to ${result.project?.currentStage}`,
      data: result.project,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
