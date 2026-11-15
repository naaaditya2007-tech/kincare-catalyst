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

/**
 * Finds a Care Circle member by matching their unique 4-digit passcode.
 * Supports multi-patient scoping: matches within the specified patient record,
 * or falls back to the currently active elder patient in the store.
 * 
 * @param {string} passcode - The 4-digit PIN entered by the user (e.g., "1111", "2222")
 * @param {string} [patientId] - Optional patient ID to scope authentication
 * @returns {{ member: CareCircleMember; patientId: string } | null} The authenticated member and patient ID, or null if invalid
 */
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

/**
 * Finds a Care Circle member based on their role within a patient record.
 * Used for 1-click demo logins and quick role switches in the UI.
 * 
 * @param {Role} role - The target role ("ELDER" | "FAMILY_ADMIN" | "CARETAKER")
 * @param {string} [patientId] - Optional patient ID to scope member lookup
 * @returns {{ member: CareCircleMember; patientId: string } | null} The resolved member and patient ID, or null
 */
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

/**
 * Retrieves a Care Circle member by their unique ID within the active patient state.
 * 
 * @param {string} id - The unique member identifier (e.g., "member_elder_01")
 * @returns {CareCircleMember | null} The member object if found, otherwise null
 */
export function findMemberById(id: string): CareCircleMember | null {
  const state = getKinCareState();
  return state.careCircle.find((m) => m.id === id) || null;
}

/**
 * Serializes and encodes a session payload into a secure Base64 token for cookie transport.
 * 
 * @param {CareCircleMember} member - The authenticated Care Circle member
 * @param {string} [patientId] - Optional ID of the elder patient associated with this session
 * @returns {string} The Base64 encoded session token
 */
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

/**
 * Decodes and validates a session token string, reconstructing the active auth session.
 * 
 * @param {string} token - The Base64 encoded token from the session cookie
 * @returns {AuthSession | null} The verified AuthSession object, or null if invalid/corrupt
 */
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
