import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifySuperAdminToken(authHeader);

  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator authorization required." },
      { status: 403 }
    );
  }

  const { uid } = params;
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
    const { status } = body;

    if (!status || !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid status ('ACTIVE' | 'INACTIVE' | 'SUSPENDED') is required." },
        { status: 400 }
      );
    }

    const res = storage.updateEmployeeStatus(uid, status, actor);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update employee status." },
      { status: 500 }
    );
  }
}
