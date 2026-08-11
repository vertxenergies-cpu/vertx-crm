import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const activeUser = db.getUserById(body._userId || "usr-super-admin");

    const result = db.convertLeadToCustomer(
      params.id,
      {
        systemSizeKw: body.systemSizeKw ? parseFloat(body.systemSizeKw) : undefined,
        projectValue: body.projectValue ? parseFloat(body.projectValue) : undefined,
        salespersonId: body.salespersonId,
        projectManagerId: body.projectManagerId,
        ksebConsumerNumber: body.ksebConsumerNumber,
        ksebSection: body.ksebSection,
      },
      activeUser
    );

    return NextResponse.json({
      success: true,
      message: "Lead successfully converted to Customer & Solar Project",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
