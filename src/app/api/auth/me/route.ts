import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { verifyAuthToken } from "@/lib/firebase/admin";

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
    const users = db.getUsers();
    let user = users.find((u) => u.uid === uid || u.id === uid);

    // One-time migration: If profile exists under user's email prior to Firebase UID assignment,
    // update the database user record so id === uid === firebaseAuthUid
    if (!user && email) {
      const userByEmail = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (userByEmail) {
        userByEmail.id = uid;
        userByEmail.uid = uid;
        db.createUser(userByEmail);
        user = userByEmail;
      }
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
