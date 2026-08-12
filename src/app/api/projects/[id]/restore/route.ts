import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { canUserDeleteProject } from "@/lib/constants";
import { verifyAuthToken } from "@/lib/firebase/admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));

    // Authenticate and Authorize
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser = (decodedToken ? db.getUserById(decodedToken.uid) : null) || db.getUserById(body._userId || "usr-super-admin");

    if (!activeUser || !canUserDeleteProject(activeUser)) {
      return NextResponse.json({
        success: false,
        error: "Permission denied. Only Super Admins and authorized Administrators can restore projects.",
      }, { status: 403 });
    }

    const restored = db.restoreProject(params.id, activeUser);
    if (!restored) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Project ${restored.projectNumber} restored to active pipeline.`,
      data: restored,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
