import { NextRequest, NextResponse } from "next/server";
import { getKinCareState, saveKinCareState } from "@/lib/store";
import { CareCircleMember } from "@/types/kincare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, member, memberId, newPasscode } = body;
    const state = getKinCareState();

    if (action === "ADD_MEMBER") {
      const newMember: CareCircleMember = {
        ...member,
        id: member.id || `member_${Date.now()}`,
        passcode: member.passcode || "4444",
        permissions: member.permissions || ["VIEW_SCHEDULE"],
        avatarBg: member.avatarBg || "bg-teal-600",
      };
      state.careCircle.push(newMember);
      saveKinCareState(state);
      return NextResponse.json({ success: true, member: newMember, state });
    }

    if (action === "UPDATE_PASSCODE") {
      const target = state.careCircle.find((m) => m.id === memberId);
      if (!target) {
        return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
      }
      if (!newPasscode || newPasscode.length !== 4) {
        return NextResponse.json({ success: false, error: "Passcode must be exactly 4 digits" }, { status: 400 });
      }
      target.passcode = newPasscode;
      saveKinCareState(state);
      return NextResponse.json({ success: true, member: target, state });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
