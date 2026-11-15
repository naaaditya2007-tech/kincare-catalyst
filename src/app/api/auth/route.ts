import { NextRequest, NextResponse } from "next/server";
import { findMemberByPasscode, findMemberByRole, encodeSession, decodeSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getKinCareState, resetToSeedState } from "@/lib/store";
import { Role } from "@/types/kincare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode, role, action } = body;

    if (action === "RESET_SEED") {
      const freshState = resetToSeedState();
      return NextResponse.json({ success: true, state: freshState });
    }

    let member = null;

    if (passcode) {
      member = findMemberByPasscode(passcode);
    } else if (role) {
      member = findMemberByRole(role as Role);
    }

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid 4-digit passcode. Use 1111 for Elder, 2222 for Family, or 3333 for Caretaker.",
        },
        { status: 401 }
      );
    }

    const state = getKinCareState();
    const token = encodeSession(member);

    const response = NextResponse.json({
      success: true,
      member,
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
