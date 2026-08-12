import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAuthenticatedUser, canViewProject } from "@/lib/auth/authorization";

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
      return NextResponse.json({ success: false, error: "Access Denied: You are not authorized to view this project's documents." }, { status: 403 });
    }

    const docs = db.getDocuments(params.id);
    return NextResponse.json({ success: true, data: docs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
