import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    db.clearAllCustomersAndData();
    return NextResponse.json({
      success: true,
      message: "All dummy customers, leads, projects, tasks, and follow-ups have been completely cleared. System is fresh for Vertx Energies production records.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
