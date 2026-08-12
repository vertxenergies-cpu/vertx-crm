import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { canUserDeleteProject } from "@/lib/constants";
import { getAuthenticatedUser, canViewProject } from "@/lib/auth/authorization";
import { ProjectDeletionReason } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid authentication token required." }, { status: 401 });
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (!canViewProject(user, project)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You are not authorized to access this project." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid authentication token required." }, { status: 401 });
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    if (!canViewProject(user, project) || !canUserDeleteProject(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. Only Super Admins and authorized Administrators with 'project.delete' permission can delete projects.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const reason = body.reason as ProjectDeletionReason;
    const details = body.details?.trim();
    const duplicateOfProjectId = body.duplicateOfProjectId?.trim();

    if (!reason) {
      return NextResponse.json({ success: false, error: "A valid deletion reason is required." }, { status: 400 });
    }

    if (reason === "DUPLICATE_ENTRY" && !duplicateOfProjectId) {
      return NextResponse.json({ success: false, error: "Duplicate Project ID is required when Deletion Reason is Duplicate Entry." }, { status: 400 });
    }

    if (reason === "OTHER" && (!details || details.length < 5)) {
      return NextResponse.json({ success: false, error: "Please provide a detailed explanation when selecting Other." }, { status: 400 });
    }

    const updated = db.deleteProject(
      params.id,
      {
        reason,
        details,
        duplicateOfProjectId,
      },
      user
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Project ${updated.projectNumber} removed from active workflow.`,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
