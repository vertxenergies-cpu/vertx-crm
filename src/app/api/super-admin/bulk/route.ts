import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifySuperAdminToken(authHeader);

  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator authorization required." },
      { status: 403 }
    );
  }

  const userAgent = req.headers.get("user-agent") || undefined;
  const ip = req.headers.get("x-forwarded-for") || req.ip || undefined;
  const actor = {
    uid: verified.uid,
    name: "Super Administrator",
    role: "SUPER_ADMIN",
    ip,
    userAgent,
  };

  try {
    const body = await req.json();
    const { operation, userIds, newRole } = body;

    if (!operation || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Valid operation and non-empty userIds array required." },
        { status: 400 }
      );
    }

    const result = storage.bulkEmployeeOperation(operation, userIds, newRole, actor);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to execute bulk operation." },
      { status: 500 }
    );
  }
}
