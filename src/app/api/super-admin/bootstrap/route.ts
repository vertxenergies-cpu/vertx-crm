import { NextRequest, NextResponse } from "next/server";
import { adminAuth, setSuperAdminClaim } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, email, password, name } = body;

    const expectedSecret = process.env.SUPER_ADMIN_BOOTSTRAP_SECRET || "vertx-superadmin-setup-2026";
    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid bootstrap authorization secret." },
        { status: 403 }
      );
    }

    const superAdminEmail = email || "vertxenergies@gmail.com";
    const superAdminName = name || "Vertx Energies Super Admin";
    let uid = "usr-super-admin";

    // Create or retrieve in Firebase Auth if available
    try {
      let fbUser;
      try {
        fbUser = await adminAuth.getUserByEmail(superAdminEmail);
      } catch (notFound) {
        if (password) {
          fbUser = await adminAuth.createUser({
            email: superAdminEmail,
            password,
            displayName: superAdminName,
          });
        }
      }

      if (fbUser) {
        uid = fbUser.uid;
        // Authoritative security grant: Firebase Custom Claim
        await setSuperAdminClaim(uid, true);
      }
    } catch (fbErr: any) {
      console.warn("Firebase Auth bootstrap notice:", fbErr?.message);
    }

    // Ensure database profile has superAdmin: true and status: ACTIVE
    const existing = storage.getUserById(uid);
    if (!existing) {
      storage.createUser({
        id: uid,
        uid,
        employeeCode: "EMP-000",
        name: superAdminName,
        email: superAdminEmail,
        phone: "+91 98470 00000",
        role: "SUPER_ADMIN",
        roleId: "SUPER_ADMIN",
        superAdmin: true,
        department: "Executive & Global Security",
        designation: "Chief Information Security Officer",
        active: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
    }

    return NextResponse.json({
      success: true,
      message: `Super Administrator successfully bootstrapped with Firebase Custom Claims.`,
      uid,
      email: superAdminEmail,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to bootstrap Super Admin." },
      { status: 500 }
    );
  }
}
