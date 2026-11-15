import { CareCircleMember, Role, AuthSession } from "@/types/kincare";
import { getKinCareState, getMultiPatientStore } from "@/lib/store";

export const SESSION_COOKIE_NAME = "kincare_session_token";

export interface SessionPayload {
  memberId: string;
  role: Role;
  name: string;
  email: string;
  patientId?: string;
  issuedAt: number;
}

export function findMemberByPasscode(passcode: string, patientId?: string): { member: CareCircleMember; patientId: string } | null {
  const store = getMultiPatientStore();
  const targetPatient = patientId
    ? store.patients.find((p) => p.elderProfile.id === patientId) || store.patients[0]
    : store.patients.find((p) => p.elderProfile.id === store.activePatientId) || store.patients[0];

  if (!targetPatient) return null;
  const found = targetPatient.careCircle.find((m) => m.passcode === passcode);
  if (found) {
    return { member: found, patientId: targetPatient.elderProfile.id };
  }
  return null;
}

export function findMemberByRole(role: Role, patientId?: string): { member: CareCircleMember; patientId: string } | null {
  const store = getMultiPatientStore();
  const targetPatient = patientId
    ? store.patients.find((p) => p.elderProfile.id === patientId) || store.patients[0]
    : store.patients.find((p) => p.elderProfile.id === store.activePatientId) || store.patients[0];

  if (!targetPatient) return null;
  const found = targetPatient.careCircle.find((m) => m.role === role);
  if (found) {
    return { member: found, patientId: targetPatient.elderProfile.id };
  }
  return null;
}

export function findMemberById(id: string): CareCircleMember | null {
  const state = getKinCareState();
  return state.careCircle.find((m) => m.id === id) || null;
}

export function encodeSession(member: CareCircleMember, patientId?: string): string {
  const payload: SessionPayload = {
    memberId: member.id,
    role: member.role,
    name: member.name,
    email: member.email,
    patientId,
    issuedAt: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeSession(token: string): AuthSession | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const payload: SessionPayload = JSON.parse(raw);
    const store = getMultiPatientStore();
    
    // Check if the payload specifies a patientId
    const targetPatient = payload.patientId
      ? store.patients.find((p) => p.elderProfile.id === payload.patientId) || store.patients[0]
      : store.patients.find((p) => p.elderProfile.id === store.activePatientId) || store.patients[0];

    if (!targetPatient) return null;

    let member = targetPatient.careCircle.find((m) => m.id === payload.memberId);
    if (!member) {
      member = targetPatient.careCircle.find((m) => m.role === payload.role);
      if (!member) return null;
    }

    return {
      member,
      elderProfile: targetPatient.elderProfile,
      authenticatedAt: new Date(payload.issuedAt).toISOString(),
    };
  } catch {
    return null;
  }
}
