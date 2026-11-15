import { NextRequest, NextResponse } from "next/server";
import { getKinCareState, recordDoseAction } from "@/lib/store";
import {
  dispatchKinCareEmail,
  generateUpcomingDoseEmail,
  generateMissedDoseEscalationEmail,
  generateDoctorBriefEmail,
} from "@/services/emailService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflow, targetEmail, medicationName, elderNote } = body;
    const state = getKinCareState();

    const recipient = targetEmail || state.careCircle.find((c) => c.role === "FAMILY_ADMIN")?.email || "family.care@kincare.org";

    let emailParams;

    if (workflow === "UPCOMING_DOSE") {
      emailParams = generateUpcomingDoseEmail(state, recipient);
    } else if (workflow === "MISSED_DOSE_ESCALATION") {
      const medName = medicationName || "Amlodipine Besylate 5mg";
      const note = elderNote || "Feeling slightly dizzy, taking after lunch meal instead.";
      
      // Also update or mark the dose log to reflect the escalation event
      const targetMed = state.medications.find((m) => m.name.toLowerCase().includes("amlodipine")) || state.medications[0];
      if (targetMed) {
        recordDoseAction(
          targetMed.id,
          "SKIPPED_WITH_REASON",
          "ELDER",
          note,
          targetMed.scheduledTimes[0]
        );
      }

      emailParams = generateMissedDoseEscalationEmail(state, recipient, medName, note);
    } else if (workflow === "DOCTOR_BRIEF") {
      emailParams = generateDoctorBriefEmail(state, recipient);
    } else {
      return NextResponse.json({ success: false, error: "Invalid workflow type specified" }, { status: 400 });
    }

    const dispatchResult = await dispatchKinCareEmail(emailParams);
    const updatedState = getKinCareState();

    return NextResponse.json({
      success: true,
      result: dispatchResult,
      state: updatedState,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  const state = getKinCareState();
  return NextResponse.json({
    success: true,
    emailLogs: state.emailLogs,
    resendConfigured: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_")),
  });
}
