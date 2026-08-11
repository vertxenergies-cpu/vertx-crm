import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = db.getProjectById(params.id);
    return NextResponse.json({ success: true, data: project?.ksebDetail || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const activeUser = db.getUserById(body._userId || "usr-super-admin") || {
      id: "usr-super-admin",
      uid: "usr-super-admin",
      employeeCode: "EMP-007",
      name: "Sumegh K. S.",
      email: "sumegh@keralasolar.com",
      phone: "+91 94955 67890",
      role: "KSEB_TEAM" as const,
      roleId: "KSEB_TEAM" as const,
      department: "Liaison & Regulatory",
      designation: "KSEB Soura Coordinator",
      avatar: null,
      active: true,
      createdAt: "",
      updatedAt: "",
    };

    const kseb = db.updateKsebDetail(params.id, body, activeUser);
    return NextResponse.json({ success: true, data: kseb });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
