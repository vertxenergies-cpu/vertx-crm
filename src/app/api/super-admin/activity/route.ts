import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifySuperAdminToken(authHeader);

  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator authorization required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const userId = searchParams.get("userId") || undefined;
  const role = searchParams.get("role") || undefined;
  const action = searchParams.get("action") || undefined;
  const actionCategory = searchParams.get("actionCategory") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const res = storage.getGlobalActivity({
      page,
      limit,
      userId,
      role,
      action,
      actionCategory,
      entityType,
      startDate,
      endDate,
    });
    return NextResponse.json({ success: true, data: res.logs, total: res.total, hasMore: res.hasMore });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch audit activity." },
      { status: 500 }
    );
  }
}
