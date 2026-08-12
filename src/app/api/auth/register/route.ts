import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { adminAuth, saveUserToFirestore } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, department, designation, employeeCode, password } = body;

    // Strict Validations
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Please provide your full legal name." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json({ success: false, error: "Please provide a valid contact phone number." }, { status: 400 });
    }

    if (!department || typeof department !== "string" || department.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Please specify your designated department." }, { status: 400 });
    }

    if (!designation || typeof designation !== "string" || designation.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Please specify your official designation." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    let authUid: string | undefined = undefined;

    // Create Firebase Auth account if Admin SDK is connected
    try {
      const authRecord = await adminAuth.createUser({
        email: email.trim().toLowerCase(),
        password,
        displayName: name.trim(),
        disabled: false,
      });
      authUid = authRecord.uid;

      // Ensure no privileged claims are assigned upon registration
      await adminAuth.setCustomUserClaims(authUid, {
        superAdmin: false,
        role: null,
      });
    } catch (authError: any) {
      if (authError?.code === "auth/email-already-exists") {
        return NextResponse.json(
          { success: false, error: "An account with this email address already exists. Please sign in or contact administrator." },
          { status: 400 }
        );
      }
      console.warn("Firebase Auth Admin SDK registration notice (using fallback ID if local):", authError?.message);
    }

    const regResult = storage.registerEmployee({
      uid: authUid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department: department.trim(),
      designation: designation.trim(),
      employeeCode: employeeCode?.trim(),
    });

    if (!regResult.success || !regResult.user) {
      return NextResponse.json({ success: false, error: regResult.error }, { status: 400 });
    }

    // Persist immediately to Firestore for cross-serverless Netlify persistence
    await saveUserToFirestore(regResult.user);

    console.info(`[REGISTER] Created employee profile: ${regResult.user.email} (UID: ${regResult.user.uid}, Approval: PENDING)`);

    return NextResponse.json({
      success: true,
      message: "Registration submitted successfully. Awaiting Super Admin review and approval.",
      data: regResult.user,
    });
  } catch (error: any) {
    console.error("Employee Registration Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
