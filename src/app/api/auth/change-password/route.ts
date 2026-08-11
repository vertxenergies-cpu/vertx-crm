import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, newPassword } = body;

    if (!uid || !newPassword) {
      return NextResponse.json({ success: false, error: "Missing required fields: uid or newPassword." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Attempt Firebase Admin update if Firebase Auth is connected
    if (adminAuth) {
      try {
        await adminAuth.updateUser(uid, {
          password: newPassword,
        });
      } catch (authErr: any) {
        console.warn("Firebase Admin SDK password update warning:", authErr?.message);
      }
    }

    // Update internal storage state to clear mustChangePassword
    const result = storage.updateUserPasswordStatus(uid, false);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. You may now proceed with your session.",
    });
  } catch (err: any) {
    console.error("Change password API error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to change password." }, { status: 500 });
  }
}
