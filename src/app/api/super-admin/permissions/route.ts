import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";
import { ROLES_CONFIG } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifySuperAdminToken(authHeader);

  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator authorization required." },
      { status: 403 }
    );
  }

  try {
    const employees = storage.getEmployeesWithWorkload();
    return NextResponse.json({
      success: true,
      data: {
        rolesConfig: ROLES_CONFIG,
        employees,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch permissions matrix." },
      { status: 500 }
    );
  }
}

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
    const { uid, customPermissions } = body;

    if (!uid || !customPermissions) {
      return NextResponse.json(
        { success: false, error: "UID and customPermissions (grants/denials) are required." },
        { status: 400 }
      );
    }

    const res = storage.updateEmployeePermissions(uid, customPermissions, actor);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update permissions." },
      { status: 500 }
    );
  }
}
