import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const customers = db.getCustomers(search);
    return NextResponse.json({ success: true, data: customers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.phone || !body.district) {
      return NextResponse.json({ success: false, error: "Name, phone and district are required." }, { status: 400 });
    }

    const customer = db.createCustomer({
      name: body.name,
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone,
      email: body.email || null,
      address: body.address || "",
      district: body.district,
      ksebConsumerNumber: body.ksebConsumerNumber || null,
      ksebSection: body.ksebSection || null,
      ksebSubDivision: body.ksebSubDivision || null,
      propertyType: body.propertyType || "Residential Villa",
      notes: body.notes || null,
      originalLeadId: null,
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
