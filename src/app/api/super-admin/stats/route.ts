import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdminToken, getAllUsersFromFirestore } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifySuperAdminToken(authHeader);

  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Super Administrator custom claim authorization required." },
      { status: 403 }
    );
  }

  try {
    const firestoreUsers = await getAllUsersFromFirestore();
    if (firestoreUsers.length > 0) {
      storage.syncUsersFromFirestore(firestoreUsers);
    }

    const stats = storage.getSuperAdminStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch Super Admin stats." },
      { status: 500 }
    );
  }
}
