import { NextRequest, NextResponse } from "next/server";
import { getKinCareState, resetToSeedState, saveKinCareState } from "@/lib/store";

export async function GET() {
  const state = getKinCareState();
  return NextResponse.json({ success: true, state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "RESET") {
      const state = resetToSeedState();
      return NextResponse.json({ success: true, state });
    }
    if (body.state) {
      saveKinCareState(body.state);
      return NextResponse.json({ success: true, state: body.state });
    }
    return NextResponse.json({ success: true, state: getKinCareState() });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
