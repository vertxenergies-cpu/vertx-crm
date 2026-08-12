import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAuthenticatedUser, canViewFinancialData, canEditProject } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

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

    if (!canEditProject(user, project) || !canViewFinancialData(user, project)) {
      return NextResponse.json({ success: false, error: "Access Denied: You are not authorized to modify payment milestones." }, { status: 403 });
    }

    const body = await req.json();

    let updated;
    if (body.paymentMode) {
      updated = db.updateProjectPaymentMode(params.id, body.paymentMode, user);
    } else if (body.milestoneId) {
      const { milestoneId, ...updates } = body;
      updated = db.updateProjectPaymentMilestone(params.id, milestoneId, updates, user);
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: "Project or milestone not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
