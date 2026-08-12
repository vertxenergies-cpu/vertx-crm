import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { getAllUsersFromFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const firestoreUsers = await getAllUsersFromFirestore();
    if (firestoreUsers.length > 0) {
      db.syncUsersFromFirestore(firestoreUsers);
    }

    const users = db.getUsers().filter((u) => u.approvalStatus === "APPROVED" || u.superAdmin === true || u.role === "SUPER_ADMIN");
    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
