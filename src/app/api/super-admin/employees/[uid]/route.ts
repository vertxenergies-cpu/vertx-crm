import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export async function GET(
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
  try {
    const detail = storage.getEmployeeWorkloadDetail(uid);
    if (!detail) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: detail });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch employee details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const res = storage.updateEmployeeProfile(uid, body, actor);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: res.user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update employee." },
      { status: 500 }
    );
  }
}
