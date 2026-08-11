import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { verifySuperAdminToken } from "@/lib/firebase/admin";

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
    const { rejectionReason } = body;

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = storage.rejectEmployeeRegistration(uid, rejectionReason || "Registration not approved.", {
      uid: verified.uid,
      name: verified.email || "Super Administrator",
      role: "SUPER_ADMIN",
      ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Employee registration for ${result.user?.name} rejected.`,
      data: result.user,
    });
  } catch (error: any) {
    console.error("Reject Employee Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to reject employee." }, { status: 500 });
  }
}
