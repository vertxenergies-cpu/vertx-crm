import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const assignedUserId = searchParams.get("assignedUserId") || undefined;
    const category = (searchParams.get("category") as "overdue" | "today" | "upcoming") || undefined;

    const list = db.getFollowUps({ status, assignedUserId, category });
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.assignedUserId || !body.dueDate || !body.actionType) {
      return NextResponse.json({ success: false, error: "Assigned user, due date and action type are required." }, { status: 400 });
    }

    const followUp = db.createFollowUp({
      leadId: body.leadId || null,
      customerId: body.customerId || null,
      projectId: body.projectId || null,
      assignedUserId: body.assignedUserId,
      dueDate: body.dueDate,
      dueTime: body.dueTime || "10:00 AM",
      actionType: body.actionType,
      notes: body.notes || null,
      status: "PENDING",
      completedAt: null,
    });

    return NextResponse.json({ success: true, data: followUp }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
