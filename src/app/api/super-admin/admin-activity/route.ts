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
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const res = storage.getAdminActivity({ page, limit, startDate, endDate });
    return NextResponse.json({ success: true, data: res.logs, total: res.total, hasMore: res.hasMore });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch admin activity." },
      { status: 500 }
    );
  }
}
