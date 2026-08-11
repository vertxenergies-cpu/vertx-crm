import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = db.getProjectById(params.id);
    return NextResponse.json({ success: true, data: project?.loanDetail || null });
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
      employeeCode: "EMP-004",
      name: "Rahul Raj",
      email: "rahul@keralasolar.com",
      phone: "+91 98472 34567",
      role: "SALES_EXECUTIVE" as const,
      roleId: "SALES_EXECUTIVE" as const,
      department: "Sales & Marketing",
      designation: "Senior Solar Consultant",
      avatar: null,
      active: true,
      createdAt: "",
      updatedAt: "",
    };

    const loan = db.updateLoanDetail(params.id, body, activeUser);
    return NextResponse.json({ success: true, data: loan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
