import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = db.getProjectById(params.id);
    return NextResponse.json({ success: true, data: project?.installationDetail || null });
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
      employeeCode: "EMP-008",
      name: "Jijo Varghese",
      email: "jijo@keralasolar.com",
      phone: "+91 94466 78901",
      role: "INSTALLATION_TEAM" as const,
      roleId: "INSTALLATION_TEAM" as const,
      department: "Field Engineering",
      designation: "Technical Rigging Lead",
      avatar: null,
      active: true,
      createdAt: "",
      updatedAt: "",
    };

    const inst = db.updateInstallationDetail(params.id, body, activeUser);
    return NextResponse.json({ success: true, data: inst });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
