import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken, setUserRoleClaim, setSuperAdminClaim } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";
import { Role } from "@/types";

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
    const { role } = body;

    if (!role) {
      return NextResponse.json({ success: false, error: "Role is required." }, { status: 400 });
    }

    const res = storage.changeEmployeeRole(uid, role as Role, actor);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    // Update Firebase Custom Claims
    try {
      if (role === "SUPER_ADMIN") {
        await setSuperAdminClaim(uid, true);
      } else {
        await setUserRoleClaim(uid, role as Role);
      }
    } catch (fbErr: any) {
      console.warn("Could not update Firebase Custom Claim:", fbErr?.message);
    }

    return NextResponse.json({ success: true, data: res.user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update employee role." },
      { status: 500 }
    );
  }
}
