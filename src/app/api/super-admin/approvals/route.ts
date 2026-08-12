import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { verifySuperAdminToken, getAllUsersFromFirestore } from "@/lib/firebase/admin";
import { ApprovalStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const verified = await verifySuperAdminToken(authHeader);

    if (!verified || !verified.superAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Super Administrator credentials required." },
        { status: 403 }
      );
    }

    // Sync all users from Firestore to guarantee cross-serverless consistency
    const firestoreUsers = await getAllUsersFromFirestore();
    if (firestoreUsers.length > 0) {
      storage.syncUsersFromFirestore(firestoreUsers);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as ApprovalStatus | null;

    const queue = storage.getApprovalQueue(statusParam || undefined);

    const pending = queue.filter((u) => u.approvalStatus === "PENDING");
    const approved = queue.filter((u) => u.approvalStatus === "APPROVED");
    const rejected = queue.filter((u) => u.approvalStatus === "REJECTED");

    console.info(`[APPROVALS] Fetching pending employees: Found ${pending.length} pending, ${queue.length} total`);

    return NextResponse.json({
      success: true,
      data: {
        queue,
        counts: {
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          total: queue.length,
        },
      },
    });
  } catch (error: any) {
    console.error("Super Admin Approvals Queue Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch approvals queue." }, { status: 500 });
  }
}
