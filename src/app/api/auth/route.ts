import { NextRequest, NextResponse } from "next/server";
import { findMemberByPasscode, findMemberByRole, encodeSession, decodeSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getKinCareState, resetToSeedState, switchActivePatient } from "@/lib/store";
import { Role, CareCircleMember } from "@/types/kincare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode, role, patientId, action } = body;

    if (action === "RESET_SEED") {
      const freshState = resetToSeedState();
      return NextResponse.json({ success: true, state: freshState });
    }

    let authResult: { member: CareCircleMember; patientId: string } | null = null;

    if (passcode) {
      authResult = findMemberByPasscode(passcode, patientId);
    } else if (role) {
      authResult = findMemberByRole(role as Role, patientId);
    }

    if (!authResult || !authResult.member) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid 4-digit passcode for selected elder profile.",
        },
        { status: 401 }
      );
    }

    // Switch active patient to the authenticated one
    switchActivePatient(authResult.patientId);
    const state = getKinCareState();
    const token = encodeSession(authResult.member, authResult.patientId);

    const response = NextResponse.json({
      success: true,
      member: authResult.member,
      patientId: authResult.patientId,
      elderProfile: state.elderProfile,
      redirectUrl: "/dashboard",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false, session: null });
  }

  const session = decodeSession(cookie.value);
  if (!session) {
    return NextResponse.json({ authenticated: false, session: null });
  }

  return NextResponse.json({ authenticated: true, session });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
