import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAuthenticatedUser, canEditProject } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ success: false, error: "Access Denied: You are not authorized to update next actions." }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.ownerId || !body.dueDate) {
      return NextResponse.json({ success: false, error: "Title, owner and due date are required" }, { status: 400 });
    }

    const updated = db.updateProjectNextAction(
      params.id,
      {
        title: body.title,
        ownerId: body.ownerId,
        dueDate: body.dueDate,
        status: body.status || "PENDING",
      },
      user
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
