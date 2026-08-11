import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const salespersonId = searchParams.get("salespersonId") || undefined;
    const district = searchParams.get("district") || undefined;
    const source = searchParams.get("source") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const stage = searchParams.get("stage") || undefined;

    const leads = db.getLeads({ search, salespersonId, district, source, priority, stage });
    return NextResponse.json({ success: true, data: leads });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerName || !body.phone || !body.district) {
      return NextResponse.json({ success: false, error: "Customer name, phone and district are required." }, { status: 400 });
    }

    const lead = db.createLead({
      customerName: body.customerName,
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone,
      email: body.email || null,
      address: body.address || null,
      district: body.district,
      leadSource: body.leadSource || "Meta Ads",
      assignedSalespersonId: body.assignedSalespersonId || "usr-super-admin",
      priority: body.priority || "MEDIUM",
      estimatedSystemSizeKw: parseFloat(body.estimatedSystemSizeKw) || 3.0,
      monthlyElectricityBill: body.monthlyElectricityBill ? parseFloat(body.monthlyElectricityBill) : null,
      requirementNotes: body.requirementNotes || null,
      currentStage: body.currentStage || "NEW_LEAD",
      lostReason: null,
      nextFollowUpDate: body.nextFollowUpDate || null,
      convertedToCustomerId: null,
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
