import { NextRequest, NextResponse } from "next/server";
import { getKinCareState, saveKinCareState } from "@/lib/store";
import { Appointment } from "@/types/kincare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, appointment, question, index } = body;
    const state = getKinCareState();

    if (action === "ADD_APPOINTMENT") {
      const newAppt: Appointment = {
        ...appointment,
        id: appointment.id || `appt_${Date.now()}`,
        checklistQuestions: appointment.checklistQuestions || [],
        reminderSent: false,
      };
      state.appointments.unshift(newAppt);
      saveKinCareState(state);
      return NextResponse.json({ success: true, appointment: newAppt, state });
    }

    if (action === "UPDATE_APPOINTMENT") {
      const idx = state.appointments.findIndex((a) => a.id === appointment.id);
      if (idx !== -1) {
        state.appointments[idx] = { ...state.appointments[idx], ...appointment };
        saveKinCareState(state);
        return NextResponse.json({ success: true, appointment: state.appointments[idx], state });
      }
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    if (action === "ADD_QUESTION") {
      const targetAppt = state.appointments[0];
      if (targetAppt && question && question.trim().length > 0) {
        targetAppt.checklistQuestions.push(question.trim());
        saveKinCareState(state);
        return NextResponse.json({ success: true, appointment: targetAppt, state });
      }
      return NextResponse.json({ success: false, error: "No appointment or question empty" }, { status: 400 });
    }

    if (action === "DELETE_QUESTION") {
      const targetAppt = state.appointments[0];
      if (targetAppt && typeof index === "number") {
        targetAppt.checklistQuestions.splice(index, 1);
        saveKinCareState(state);
        return NextResponse.json({ success: true, appointment: targetAppt, state });
      }
      return NextResponse.json({ success: false, error: "Invalid question index" }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
