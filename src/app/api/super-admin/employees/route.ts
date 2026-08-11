import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken, setUserRoleClaim, adminAuth } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";
import { Role } from "@/types";

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
  const role = searchParams.get("role") || undefined;
  const department = searchParams.get("department") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const employees = storage.getEmployeesWithWorkload({ role, department, status, search });
    return NextResponse.json({ success: true, data: employees });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch employees." },
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

  try {
    const body = await req.json();
    const { name, email, phone, role, department, designation, employeeCode, password } = body;

    if (!name || !email || !role || !department) {
      return NextResponse.json(
        { success: false, error: "Name, email, role, and department are required." },
        { status: 400 }
      );
    }

    // Capture actor metadata
    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = req.headers.get("x-forwarded-for") || req.ip || undefined;
    const actor = {
      uid: verified.uid,
      name: "Super Administrator",
      role: "SUPER_ADMIN",
      ip,
      userAgent,
    };

    let uid = `usr-${Date.now()}`;

    // Create Firebase Auth user if server SDK is available
    if (password) {
      try {
        const fbUser = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });
        uid = fbUser.uid;
        await setUserRoleClaim(uid, role as Role);
      } catch (authErr: any) {
        console.warn("Could not create Firebase Auth account, proceeding with database record:", authErr?.message);
      }
    }

    const newUser = {
      id: uid,
      uid,
      employeeCode: employeeCode || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name,
      email,
      phone: phone || "",
      role: role as Role,
      roleId: role as Role,
      superAdmin: role === "SUPER_ADMIN",
      department,
      designation: designation || role,
      active: true,
      status: "ACTIVE" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userRes = storage.createUser(newUser as any);

    // Audit log
    storage.getGlobalActivity({ limit: 1 }); // ensures db loaded
    (storage as any).updateEmployeeStatus(uid, "ACTIVE", actor);

    return NextResponse.json({ success: true, data: userRes });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create employee." },
      { status: 500 }
    );
  }
}
