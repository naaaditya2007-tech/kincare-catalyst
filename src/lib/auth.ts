import { CareCircleMember, Role, AuthSession } from "@/types/kincare";
import { getKinCareState } from "@/lib/store";

export const SESSION_COOKIE_NAME = "kincare_session_token";

export interface SessionPayload {
  memberId: string;
  role: Role;
  name: string;
  email: string;
  issuedAt: number;
}

export function findMemberByPasscode(passcode: string): CareCircleMember | null {
  const state = getKinCareState();
  const found = state.careCircle.find((m) => m.passcode === passcode);
  return found || null;
}

export function findMemberByRole(role: Role): CareCircleMember | null {
  const state = getKinCareState();
  return state.careCircle.find((m) => m.role === role) || null;
}

export function findMemberById(id: string): CareCircleMember | null {
  const state = getKinCareState();
  return state.careCircle.find((m) => m.id === id) || null;
}

export function encodeSession(member: CareCircleMember): string {
  const payload: SessionPayload = {
    memberId: member.id,
    role: member.role,
    name: member.name,
    email: member.email,
    issuedAt: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeSession(token: string): AuthSession | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const payload: SessionPayload = JSON.parse(raw);
    const state = getKinCareState();
    const member = state.careCircle.find((m) => m.id === payload.memberId);
    if (!member) {
      // Fallback in case careCircle was modified
      const roleMember = state.careCircle.find((m) => m.role === payload.role);
      if (!roleMember) return null;
      return {
        member: roleMember,
        elderProfile: state.elderProfile,
        authenticatedAt: new Date(payload.issuedAt).toISOString(),
      };
    }
    return {
      member,
      elderProfile: state.elderProfile,
      authenticatedAt: new Date(payload.issuedAt).toISOString(),
    };
  } catch {
    return null;
  }
}
