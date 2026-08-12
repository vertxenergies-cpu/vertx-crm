import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { verifyAuthToken } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const salespersonId = searchParams.get("salespersonId") || undefined;
    const assignedToUid = searchParams.get("assignedToUid") || undefined;
    const unassigned = searchParams.get("unassigned") || undefined;
    const district = searchParams.get("district") || undefined;
    const source = searchParams.get("source") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const stage = searchParams.get("stage") || undefined;

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser = decodedToken ? db.getUserById(decodedToken.uid) : null;

    // Role-based scoping: If user is Sales Executive and not requesting explicit unassigned/all filter, scope to assignedToUid
    let queryAssignedToUid = assignedToUid;
    if (activeUser && activeUser.role === "SALES_EXECUTIVE" && !assignedToUid && !unassigned && salespersonId !== "ALL") {
      queryAssignedToUid = activeUser.uid;
    }

    const leads = db.getLeads({
      search,
      salespersonId,
      assignedToUid: queryAssignedToUid,
      unassigned,
      district,
      source,
      priority,
      stage,
    });

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

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const decodedToken = token ? await verifyAuthToken(token) : null;
    const activeUser = decodedToken ? db.getUserById(decodedToken.uid) : null;

    // Creator resolution
    const creator = activeUser
      ? { uid: activeUser.uid, name: activeUser.name, role: activeUser.role || undefined }
      : { uid: body._userId || "system", name: body._userName || "System", role: undefined };

    // Assignment resolution rules:
    // If Sales Executive creates a lead -> Default to themselves
    // If Admin/Super Admin creates a lead -> Use provided assignedToUid (or null if unassigned)
    let targetAssignedToUid = body.assignedToUid ?? body.assignedSalespersonId ?? null;
    if (activeUser && activeUser.role === "SALES_EXECUTIVE" && !targetAssignedToUid) {
      targetAssignedToUid = activeUser.uid;
    }

    const lead = db.createLead(
      {
        customerName: body.customerName,
        phone: body.phone,
        whatsapp: body.whatsapp || body.phone,
        email: body.email || null,
        address: body.address || null,
        district: body.district,
        leadSource: body.leadSource || "Meta Ads",
        assignedToUid: targetAssignedToUid,
        assignedToName: null,
        assignedDepartment: null,
        assignedAt: null,
        assignedByUid: null,
        assignedByName: null,
        priority: body.priority || "MEDIUM",
        estimatedSystemSizeKw: parseFloat(body.estimatedSystemSizeKw) || 3.0,
        monthlyElectricityBill: body.monthlyElectricityBill ? parseFloat(body.monthlyElectricityBill) : null,
        requirementNotes: body.requirementNotes || null,
        currentStage: body.currentStage || "NEW_LEAD",
        lostReason: null,
        nextFollowUpDate: body.nextFollowUpDate || null,
        convertedToCustomerId: null,
      },
      creator
    );

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
