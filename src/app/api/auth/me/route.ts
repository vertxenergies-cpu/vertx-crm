import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import {
  verifyAuthToken,
  getUserFromFirestore,
  getUserByEmailFromFirestore,
  saveUserToFirestore,
} from "@/lib/firebase/admin";
import { User } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const verified = await verifyAuthToken(authHeader);

    if (!verified || !verified.uid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Missing or invalid Firebase ID token.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { uid, email } = verified;
    const cleanEmail = (email || "").trim().toLowerCase();
    const users = db.getUsers();
    let user = users.find((u) => u.uid === uid || u.id === uid);

    // 1. One-time migration: If profile exists under user's email prior to Firebase UID assignment
    if (!user && cleanEmail) {
      const userByEmail = users.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
      if (userByEmail) {
        userByEmail.id = uid;
        userByEmail.uid = uid;
        db.createUser(userByEmail);
        await saveUserToFirestore(userByEmail);
        user = userByEmail;
      }
    }

    // 2. Check persistent Firestore if not found in local memory
    if (!user) {
      let firestoreUser = await getUserFromFirestore(uid);
      if (!firestoreUser && cleanEmail) {
        firestoreUser = await getUserByEmailFromFirestore(cleanEmail);
      }
      if (firestoreUser) {
        firestoreUser.id = uid;
        firestoreUser.uid = uid;
        db.createUser(firestoreUser);
        user = firestoreUser;
      }
    }

    // 3. Auto-provision Super Admin if authenticating as the official root email
    if (!user && cleanEmail === "vertxenergies@gmail.com") {
      const superAdminUser: User = {
        id: uid,
        uid: uid,
        employeeCode: "EMP-000",
        name: "Vertx Energies Super Admin",
        email: "vertxenergies@gmail.com",
        phone: "+91 98470 00000",
        role: "SUPER_ADMIN",
        roleId: "SUPER_ADMIN",
        superAdmin: true,
        approvalStatus: "APPROVED",
        department: "Executive & Global Security",
        designation: "Chief Information Security Officer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        active: true,
        status: "ACTIVE",
        mustChangePassword: false,
        registeredAt: "2026-01-15T09:00:00.000Z",
        createdAt: "2026-01-15T09:00:00.000Z",
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      db.createUser(superAdminUser);
      await saveUserToFirestore(superAdminUser);
      user = superAdminUser;
    }

    // 4. If a legitimate Firebase authenticated employee is not in local db yet, create a PENDING record
    if (!user && cleanEmail) {
      const pendingEmployee: User = {
        id: uid,
        uid: uid,
        employeeCode: "PENDING",
        name: verified.name || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: cleanEmail,
        phone: "",
        role: null,
        roleId: null,
        superAdmin: false,
        approvalStatus: "PENDING",
        department: "General",
        designation: "Employee",
        active: false,
        status: "INACTIVE",
        mustChangePassword: false,
        registeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.createUser(pendingEmployee);
      await saveUserToFirestore(pendingEmployee);
      user = pendingEmployee;
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account is authenticated, but your VERTX ENERGIES employee profile could not be found. Please contact the administrator.",
          code: "PROFILE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch profile." },
      { status: 500 }
    );
  }
}
