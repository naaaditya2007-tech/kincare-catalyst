import { NextRequest, NextResponse } from "next/server";
import { getKinCareState, recordDoseAction } from "@/lib/store";
import {
  dispatchKinCareEmail,
  generateUpcomingDoseEmail,
  generateMissedDoseEscalationEmail,
  generateDoctorBriefEmail,
} from "@/services/emailService";

/**
 * POST /api/send-alert
 * 
 * Dispatches a transactional email alert (Upcoming Dose, Missed Dose Escalation,
 * or Doctor Brief Consultation Reminder) via Resend API or simulated HTML preview engine.
 * 
 * @param {NextRequest} req - Incoming Next.js API route request
 * @returns {Promise<NextResponse>} JSON response with delivery metadata, preview HTML, and state
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertType, workflow, recipientEmail, targetEmail, medicationName, elderNote } = body;
    const state = getKinCareState();

    const recipient =
      recipientEmail ||
      targetEmail ||
      state.careCircle.find((c) => c.role === "FAMILY_ADMIN")?.email ||
      "family.admin@kincare.org";

    const selectedType = alertType || workflow || "UPCOMING_DOSE";

    let emailParams;

    if (selectedType === "UPCOMING_DOSE" || selectedType === "Simulate Upcoming Dose Alert") {
      emailParams = generateUpcomingDoseEmail(state, recipient);
    } else if (
      selectedType === "MISSED_DOSE_ESCALATION" ||
      selectedType === "Simulate Missed Dose Escalation"
    ) {
      const medName = medicationName || "Amlodipine Besylate 5mg";
      const note = elderNote || "Feeling slightly dizzy, resting before taking after lunch.";

      // Record dose status to reflect autonomous escalation in audit logs
      const targetMed =
        state.medications.find((m) => m.name.toLowerCase().includes("amlodipine")) ||
        state.medications[0];
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
    } else if (
      selectedType === "APPOINTMENT_REMINDER" ||
      selectedType === "DOCTOR_BRIEF" ||
      selectedType === "Simulate Appointment Reminder"
    ) {
      emailParams = generateDoctorBriefEmail(state, recipient);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid alert type specified" },
        { status: 400 }
      );
    }

    const dispatchResult = await dispatchKinCareEmail(emailParams);
    const updatedState = getKinCareState();

    return NextResponse.json({
      success: true,
      deliveryMode: dispatchResult.deliveryMode,
      status: dispatchResult.status,
      message: dispatchResult.message,
      emailLog: dispatchResult.emailLog,
      preview: {
        subject: emailParams.subject,
        html: emailParams.html,
        bodyPreview: emailParams.bodyPreview,
        recipient: emailParams.toEmail,
      },
      state: updatedState,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  const state = getKinCareState();
  const hasResend = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_"));
  return NextResponse.json({
    success: true,
    resendConfigured: hasResend,
    emailCount: state.emailLogs.length,
    recentLogs: state.emailLogs.slice(0, 5),
  });
}
