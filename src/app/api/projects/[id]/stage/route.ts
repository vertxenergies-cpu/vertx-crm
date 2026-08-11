import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.stage) {
      return NextResponse.json({ success: false, error: "New stage is required" }, { status: 400 });
    }

    const activeUser = db.getUserById(body._userId || "usr-super-admin") || {
      id: "usr-super-admin",
      uid: "usr-super-admin",
      employeeCode: "EMP-000",
      name: "Vertx Energies Super Admin",
      email: "vertxenergies@gmail.com",
      phone: "+91 98470 00000",
      role: "SUPER_ADMIN" as const,
      roleId: "SUPER_ADMIN" as const,
      department: "Executive & Global Security",
      designation: "Chief Information Security Officer",
      avatar: null,
      active: true,
      createdAt: "",
      updatedAt: "",
    };

    const updated = db.updateProjectStage(params.id, body.stage, activeUser, body.comment);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Project stage updated to ${body.stage}`,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
