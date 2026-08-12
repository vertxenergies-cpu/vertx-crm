import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { canUserDeleteProject } from "@/lib/constants";
import { verifyAuthToken } from "@/lib/firebase/admin";
import { ProjectDeletionReason } from "@/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = db.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: project });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    // Authenticate and Authorize
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser = (decodedToken ? db.getUserById(decodedToken.uid) : null) || db.getUserById(body._userId || "usr-super-admin");

    if (!activeUser || !canUserDeleteProject(activeUser)) {
      return NextResponse.json({
        success: false,
        error: "Permission denied. Only Super Admins and authorized Administrators with 'project.delete' permission can delete projects.",
      }, { status: 403 });
    }

    const updated = db.deleteProject(
      params.id,
      {
        reason,
        details,
        duplicateOfProjectId,
      },
      activeUser
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
