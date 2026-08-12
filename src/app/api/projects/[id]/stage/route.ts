import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { canUserChangeProjectStage, normalizeStageId } from "@/lib/constants";
import { verifyAuthToken } from "@/lib/firebase/admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser =
      (decodedToken ? db.getUserById(decodedToken.uid) : null) ||
      db.getUserById(body._userId || "") ||
      db.getUserById("usr-super-admin");

    if (!activeUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (!canUserChangeProjectStage(activeUser, project.currentStage)) {
      return NextResponse.json({
        success: false,
        error: `Your role (${activeUser.role}) is not authorized to advance this project stage.`,
      }, { status: 403 });
    }

    const result = db.updateProjectStage(
      params.id,
      body.nextStage || body.stage,
      activeUser,
      body.comment,
      body.confirmations
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        missingRequirements: result.missingRequirements || [],
      }, { status: 400 });
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
