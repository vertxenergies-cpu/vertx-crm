import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") || "";
    const entityId = searchParams.get("entityId") || "";

    const notes = db.getNotes(entityType, entityId);
    return NextResponse.json({ success: true, data: notes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.entityType || !body.entityId || !body.content) {
      return NextResponse.json({ success: false, error: "Entity type, entity ID and content are required." }, { status: 400 });
    }

    const note = db.createNote({
      entityType: body.entityType,
      entityId: body.entityId,
      authorId: body.authorId || "usr-super-admin",
      authorName: body.authorName || "Team Member",
      content: body.content,
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
