import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import {
  verifySuperAdminToken,
  adminAuth,
  saveUserToFirestore,
  getUserFromFirestore,
} from "@/lib/firebase/admin";
import { Role } from "@/types";

export async function POST(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    const verified = await verifySuperAdminToken(authHeader);

    if (!verified || !verified.superAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Super Administrator credentials required." },
        { status: 403 }
      );
    }

    const { uid } = params;
    const body = await req.json();
    const { role, employeeCode } = body;

    if (!role) {
      return NextResponse.json({ success: false, error: "Please specify a valid employee role." }, { status: 400 });
    }

    if (role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "SUPER_ADMIN role cannot be assigned through standard registration approval." },
        { status: 403 }
      );
    }

    // Ensure user exists in local storage if only present in Firestore
    let localUser = storage.getUserById(uid);
    if (!localUser) {
      const fUser = await getUserFromFirestore(uid);
      if (fUser) {
        storage.createUser(fUser);
        localUser = fUser;
      }
    }

    // Set Firebase Auth Custom Claims for the approved employee
    try {
      await adminAuth.setCustomUserClaims(uid, {
        role,
        superAdmin: false,
      });
    } catch (authErr: any) {
      console.warn("Notice updating Firebase Auth claims on approve:", authErr?.message);
    }

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = storage.approveEmployeeRegistration(uid, role as Role, employeeCode, {
      uid: verified.uid,
      name: verified.email || "Super Administrator",
      role: "SUPER_ADMIN",
      ip,
      userAgent,
    });

    if (!result.success || !result.user) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Persist approved user directly to Firestore
    await saveUserToFirestore(result.user);

    console.info(`[APPROVE] Successfully approved employee ${result.user.email} (Role: ${role}, Status: APPROVED)`);

    return NextResponse.json({
      success: true,
      message: `Employee ${result.user?.name} approved with role ${role}.`,
      data: result.user,
    });
  } catch (error: any) {
    console.error("Approve Employee Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to approve employee." }, { status: 500 });
  }
}
