import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

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

    const updated = db.updateDocument(params.id, body, activeUser);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
