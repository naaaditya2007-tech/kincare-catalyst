import { NextRequest, NextResponse } from "next/server";
import { recordDoseAction } from "@/lib/store";
import { DoseStatus, Role } from "@/types/kincare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { medicationId, status, loggedByRole, elderNote, scheduledTime } = body;

    if (!medicationId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required medicationId or status" },
        { status: 400 }
      );
    }

    const result = recordDoseAction(
      medicationId,
      status as DoseStatus,
      (loggedByRole as Role) || "ELDER",
      elderNote,
      scheduledTime
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
