import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { verifyAuthToken } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser =
      (decodedToken ? db.getUserById(decodedToken.uid) : null) ||
      db.getUserById("usr-super-admin");

    if (!activeUser || (activeUser.role !== "SUPER_ADMIN" && activeUser.email !== "vertxenergies@gmail.com")) {
      return NextResponse.json({
        success: false,
        error: "Forbidden: Super Admin access required",
      }, { status: 403 });
    }

    const projectsNeedingReconciliation = db.getProjectsNeedingReconciliation();
    return NextResponse.json({
      success: true,
      data: projectsNeedingReconciliation,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
