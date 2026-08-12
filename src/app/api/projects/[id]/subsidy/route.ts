import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAuthenticatedUser, canViewProject, canEditProject } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid authentication token required." }, { status: 401 });
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    if (!canViewProject(user, project)) {
      return NextResponse.json({ success: false, error: "Access Denied: You are not authorized to view this project." }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: project.subsidyDetail || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid authentication token required." }, { status: 401 });
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    if (!canEditProject(user, project)) {
      return NextResponse.json({ success: false, error: "Access Denied: You are not authorized to modify this project." }, { status: 403 });
    }

    const body = await req.json();
    const subsidy = db.updateSubsidyDetail(params.id, body, user);
    return NextResponse.json({ success: true, data: subsidy });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
