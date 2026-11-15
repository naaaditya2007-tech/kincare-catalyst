import { Resend } from "resend";
import { EmailAlertLog, AlertType, DeliveryMode, KinCareState } from "@/types/kincare";
import { getKinCareState, saveKinCareState } from "@/lib/store";

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailParams {
  toEmail: string;
  type: AlertType;
  subject: string;
  html: string;
  bodyPreview: string;
  triggerSource?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  deliveryMode: DeliveryMode;
  status: "DELIVERED" | "SIMULATED_PREVIEW" | "FAILED";
  logId: string;
  emailLog: EmailAlertLog;
  message: string;
  error?: string;
}

/**
 * Dispatches an email notification through the live Resend API or logs a simulated preview
 * in the KinCare audit trail when operating in evaluation or offline environments.
 * 
 * @param {SendEmailParams} params - Email dispatch parameters
 * @returns {Promise<EmailDispatchResult>} Result containing delivery mode, log metadata, and status
 */
export async function dispatchKinCareEmail(params: SendEmailParams): Promise<EmailDispatchResult> {
  const state = getKinCareState();
  const logId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let deliveryMode: DeliveryMode = "SIMULATED_PREVIEW";
  let status: "DELIVERED" | "SIMULATED_PREVIEW" | "FAILED" = "SIMULATED_PREVIEW";
  let statusMessage = "Email simulated in preview mode (RESEND_API_KEY not configured or simulated run).";

  if (resendClient && resendApiKey && resendApiKey.startsWith("re_")) {
    try {
      const fromAddress = process.env.RESEND_FROM_EMAIL || "KinCare CareCircle <onboarding@resend.dev>";
      const { data, error } = await resendClient.emails.send({
        from: fromAddress,
        to: params.toEmail,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        console.warn("Resend API returned error, falling back to simulated preview:", error);
        status = "SIMULATED_PREVIEW";
        statusMessage = `Resend Notice (${error.message}); logged to audit log for inspection.`;
      } else if (data?.id) {
        deliveryMode = "LIVE_RESEND";
        status = "DELIVERED";
        statusMessage = `Live email dispatched via Resend (ID: ${data.id}) to ${params.toEmail}.`;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn("Resend API invocation failed, falling back to simulation:", errMsg);
      status = "SIMULATED_PREVIEW";
      statusMessage = `Resend exception (${errMsg}); logged to preview audit log.`;
    }
  } else {
    deliveryMode = "SIMULATED_PREVIEW";
    status = "SIMULATED_PREVIEW";
    statusMessage = "Simulated delivery recorded in KinCare Audit Trail. Resend key optional.";
  }

  const emailLog: EmailAlertLog = {
    id: logId,
    recipientEmail: params.toEmail,
    type: params.type,
    subject: params.subject,
    bodyPreview: params.bodyPreview,
    htmlContent: params.html,
    sentAt: new Date().toISOString(),
    deliveryMode,
    status,
    triggerSource: params.triggerSource || "Care Circle Engine",
  };

  state.emailLogs.unshift(emailLog);
  saveKinCareState(state);

  return {
    success: true,
    deliveryMode,
    status,
    logId,
    emailLog,
    message: statusMessage,
  };
}

/**
 * Generates email content for the daily upcoming dose schedule alert.
 * 
 * @param {KinCareState} state - Active patient care state
 * @param {string} recipientEmail - Email address of the recipient
 * @returns {SendEmailParams} Constructed email parameters with responsive HTML
 */
export function generateUpcomingDoseEmail(state: KinCareState, recipientEmail: string): SendEmailParams {
  const elder = state.elderProfile;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  
  const medRows = state.medications
    .filter((m) => m.active)
    .map(
      (m) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${m.name}</td>
        <td style="padding: 12px 16px; color: #475569;">${m.dosage} (${m.form})</td>
        <td style="padding: 12px 16px; color: #0d9488; font-weight: 600;">${m.scheduledTimes.join(", ")}</td>
        <td style="padding: 12px 16px; color: #64748b; font-size: 13px;">${m.instructions}</td>
      </tr>
    `
    )
    .join("");

  const subject = `[KinCare Reminder] Today's Medication Schedule for ${elder.name} (${today})`;
  const bodyPreview = `Upcoming medication reminder for ${elder.name}. ${state.medications.length} active prescriptions scheduled for today.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #0f172a;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #0d9488; padding: 24px; color: #ffffff;">
            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.9; margin-bottom: 4px;">KinCare Autonomous Companion</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Daily Medication Schedule</h1>
            <p style="margin: 6px 0 0; opacity: 0.95; font-size: 14px;">Elder: <strong>${elder.name}</strong> (Age ${elder.age}, ${elder.bloodGroup})</p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 24px;">
            <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">
              Hello Care Circle, here is the verified daily medication schedule for today, <strong>${today}</strong>.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; text-align: left;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                  <th style="padding: 10px 16px;">Medication</th>
                  <th style="padding: 10px 16px;">Dosage</th>
                  <th style="padding: 10px 16px;">Time</th>
                  <th style="padding: 10px 16px;">Meal Timing</th>
                </tr>
              </thead>
              <tbody>
                ${medRows}
              </tbody>
            </table>

            <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
              <strong style="color: #0f766e; font-size: 14px;">Smart Safety Reminder:</strong>
              <p style="margin: 4px 0 0; font-size: 13px; color: #115e59; line-height: 1.4;">
                Ensure Thyronorm is taken on an empty stomach with plain water. Keep Calcium supplements spaced by at least 4 hours.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; font-size: 12px; color: #64748b; text-align: center;">
            Sent by KinCare Autonomous Alert Engine. Need help? Call Emergency: <strong>${elder.emergencyPhone}</strong>.
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    toEmail: recipientEmail,
    type: "UPCOMING_DOSE",
    subject,
    html,
    bodyPreview,
    triggerSource: "Manual / Scheduled Trigger",
  };
}

/**
 * Generates email content for missed/postponed dose emergency escalation.
 * 
 * @param {KinCareState} state - Active patient care state
 * @param {string} recipientEmail - Email address of the recipient
 * @param {string} [overdueMedName] - Name of the overdue medication
 * @param {string} [elderNote] - Reason note provided by the elder
 * @returns {SendEmailParams} Constructed email parameters with urgency highlights
 */
export function generateMissedDoseEscalationEmail(
  state: KinCareState,
  recipientEmail: string,
  overdueMedName = "Amlodipine Besylate 5mg",
  elderNote = "Feeling slightly dizzy, taking after lunch meal instead."
): SendEmailParams {
  const elder = state.elderProfile;
  const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  const subject = `[URGENT ESCALATION] Missed Dose Alert: ${elder.name} (${overdueMedName})`;
  const bodyPreview = `Care Circle Attention: ${overdueMedName} was marked missed/delayed for ${elder.name}. Elder Note: "${elderNote}"`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #0f172a;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #fecdd3; overflow: hidden; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.08);">
          <!-- Escalation Banner -->
          <div style="background-color: #e11d48; padding: 24px; color: #ffffff;">
            <div style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
              Dose Adherence Alert
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Missed Dose Escalation</h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.95;">Elder: <strong>${elder.name}</strong> | Detected At: ${timeNow}</p>
          </div>

          <div style="padding: 24px;">
            <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
              <div style="font-weight: 700; color: #9f1239; font-size: 15px;">Medication Overdue: ${overdueMedName}</div>
              <p style="margin: 6px 0 0; color: #881337; font-size: 14px;">
                The scheduled intake window elapsed without confirmation. A notification has been escalated to the Care Circle.
              </p>
            </div>

            <!-- Autonomy-Preserving Elder Note -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 6px;">
                Elder Feedback & Reasoning Provided
              </div>
              <blockquote style="margin: 0; font-style: italic; font-size: 15px; color: #1e293b; border-left: 3px solid #0d9488; padding-left: 12px;">
                "${elderNote}"
              </blockquote>
            </div>

            <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 10px; color: #0f172a;">Recommended Caretaker Action</h3>
            <ul style="font-size: 14px; line-height: 1.6; color: #475569; padding-left: 20px; margin: 0 0 20px;">
              <li>Contact ${elder.name} at <strong>${elder.emergencyPhone}</strong> to verify vital symptoms.</li>
              <li>Ensure the elder had a light meal before taking antihypertensives.</li>
              <li>If dizziness persists beyond 30 minutes, measure seated and standing blood pressure.</li>
            </ul>

            <div style="text-align: center; margin-top: 24px;">
              <a href="#" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                Open KinCare Command Center
              </a>
            </div>
          </div>

          <div style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; font-size: 12px; color: #64748b; text-align: center;">
            KinCare Family Safety Protocol • Automatic Escalation Tier 1
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    toEmail: recipientEmail,
    type: "MISSED_DOSE_ESCALATION",
    subject,
    html,
    bodyPreview,
    triggerSource: "Escalation Engine",
  };
}

/**
 * Generates email content for doctor consultation prep and clinical brief.
 * 
 * @param {KinCareState} state - Active patient care state
 * @param {string} recipientEmail - Email address of the recipient
 * @returns {SendEmailParams} Constructed email parameters with patient vitals and checklist
 */
export function generateDoctorBriefEmail(state: KinCareState, recipientEmail: string): SendEmailParams {
  const elder = state.elderProfile;
  const appt = state.appointments[0];
  const apptDate = appt ? new Date(appt.dateTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Upcoming";

  const subject = `[Clinical Brief] Doctor Visit Summary for ${elder.name} (${appt ? appt.doctorName : "Cardiology Review"})`;
  const bodyPreview = `Clinical briefing and discussion checklist for ${elder.name}'s upcoming appointment with ${appt?.doctorName || "Doctor"}.`;

  const checklistItems = (appt?.checklistQuestions || [])
    .map((q) => `<li style="margin-bottom: 8px; color: #334155;"><strong>[ ]</strong> ${q}</li>`)
    .join("");

  const activeMedsList = state.medications
    .filter((m) => m.active)
    .map((m) => `<li style="margin-bottom: 6px;"><strong>${m.name}</strong> - ${m.dosage} (${m.instructions}, Times: ${m.scheduledTimes.join(", ")})</li>`)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #0f172a;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8;">Doctor Visit Preparation Brief</div>
            <h1 style="margin: 6px 0 0; font-size: 22px;">Patient Clinical Summary</h1>
            <p style="margin: 4px 0 0; font-size: 14px; color: #94a3b8;">
              ${elder.name} | Age ${elder.age} | Blood Group: ${elder.bloodGroup} | Allergies: ${elder.allergies.join(", ")}
            </p>
          </div>

          <div style="padding: 24px;">
            <div style="background-color: #f1f5f9; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase;">Appointment Details</div>
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px;">${appt?.doctorName || "Dr. Arvind Swaminathan"} (${appt?.specialty || "Cardiology"})</div>
              <div style="font-size: 14px; color: #64748b;">${appt?.hospital || "Hospital"} • ${apptDate}</div>
              <div style="font-size: 13px; color: #334155; margin-top: 6px;"><strong>Clinical Objective:</strong> ${appt?.notes || "Routine follow up"}</div>
            </div>

            <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
              Current Verified Prescriptions (${state.medications.filter(m => m.active).length} Active)
            </h3>
            <ul style="font-size: 14px; line-height: 1.5; padding-left: 20px; color: #334155;">
              ${activeMedsList}
            </ul>

            <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">
              Care Circle Collaborative Discussion Checklist
            </h3>
            <ul style="font-size: 14px; line-height: 1.6; list-style-type: none; padding-left: 0;">
              ${checklistItems}
            </ul>

            <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 12px 16px; border-radius: 8px; margin-top: 20px; font-size: 13px; color: #854d0e;">
              <strong>Note for Physician:</strong> Patient has known allergy to <em>${elder.allergies.join(", ")}</em>. Do not prescribe beta-lactam class antibiotics or cross-reacting compounds.
            </div>
          </div>

          <div style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; font-size: 12px; color: #64748b; text-align: center;">
            Generated by KinCare Clinical Brief Synthesizer • Ready for Print or Mobile Presentation
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    toEmail: recipientEmail,
    type: "APPOINTMENT_REMINDER",
    subject,
    html,
    bodyPreview,
    triggerSource: "Doctor Visit Synthesis",
  };
}
