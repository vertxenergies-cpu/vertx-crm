import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/authorization";
import { storage } from "@/lib/storage";
import { saveUserToFirestore, adminAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Missing identity token." },
      { status: 401 }
    );
  }

  const authenticatedUser = await getAuthenticatedUser(req);
  if (!authenticatedUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid identity token." },
      { status: 401 }
    );
  }

  if (authenticatedUser.superAdmin !== true && authenticatedUser.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator authorization required." },
      { status: 403 }
    );
  }

  const uid = params.id;
  const userAgent = req.headers.get("user-agent") || undefined;
  const ip = req.headers.get("x-forwarded-for") || req.ip || undefined;
  const actor = {
    uid: authenticatedUser.uid,
    name: authenticatedUser.name || "Super Administrator",
    role: "SUPER_ADMIN",
    ip,
    userAgent,
  };

  try {
    const body = await req.json();
    const res = storage.updateEmployeeProfile(uid, body, actor);
    if (!res.success || !res.user) {
      return NextResponse.json({ success: false, error: res.error || "Failed to update employee profile." }, { status: 400 });
    }

    await saveUserToFirestore(res.user);

    if (body.email && body.email.trim().toLowerCase() !== res.user.email?.trim().toLowerCase()) {
      try {
        if (adminAuth) {
          await adminAuth.updateUser(uid, { email: body.email.trim() });
        }
      } catch (authErr: any) {
        console.warn("[Firebase Auth] Notice updating email in Auth SDK:", authErr?.message);
      }
    }

    return NextResponse.json({ success: true, data: res.user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update employee profile." },
      { status: 500 }
    );
  }
}
