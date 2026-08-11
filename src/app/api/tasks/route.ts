import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const assignedUserId = searchParams.get("assignedUserId") || undefined;
    const status = searchParams.get("status") || undefined;

    const tasks = db.getTasks({ projectId, assignedUserId, status });
    return NextResponse.json({ success: true, data: tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.assignedUserId || !body.dueDate) {
      return NextResponse.json({ success: false, error: "Title, assigned user and due date are required." }, { status: 400 });
    }

    const task = db.createTask({
      title: body.title,
      description: body.description || null,
      projectId: body.projectId || null,
      leadId: body.leadId || null,
      customerId: body.customerId || null,
      assignedUserId: body.assignedUserId,
      dueDate: body.dueDate,
      priority: body.priority || "MEDIUM",
      status: body.status || "TODO",
      completedAt: null,
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
