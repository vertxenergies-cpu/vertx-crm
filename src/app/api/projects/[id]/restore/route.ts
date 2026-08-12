import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { canUserDeleteProject } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !canUserDeleteProject(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. Only Super Admins and authorized Administrators can restore projects.",
        },
        { status: 403 }
      );
    }

    const restored = db.restoreProject(params.id, user);
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
