import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAuthenticatedUser } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid authentication token required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const stage = searchParams.get("stage") || undefined;
    const status = searchParams.get("status") || undefined;
    const salespersonId = searchParams.get("salespersonId") || undefined;
    const projectManagerId = searchParams.get("projectManagerId") || undefined;
    const district = searchParams.get("district") || undefined;

    const onlyDeleted = searchParams.get("onlyDeleted") === "true";
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result = db.getProjectsWithCounts(
      {
        search,
        stage,
        status,
        salespersonId,
        projectManagerId,
        district,
        onlyDeleted,
        includeDeleted,
      },
      user
    );

    return NextResponse.json({
      success: true,
      data: result.projects,
      total: result.total,
      stageCounts: result.stageCounts,
      healthCounts: result.healthCounts,
      deletedCount: result.deletedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
