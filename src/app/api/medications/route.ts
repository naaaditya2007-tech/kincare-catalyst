import { NextRequest, NextResponse } from "next/server";
import { getKinCareState, saveKinCareState } from "@/lib/store";
import { Medication } from "@/types/kincare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, medication } = body;
    const state = getKinCareState();

    if (action === "ADD") {
      const newMed: Medication = {
        ...medication,
        id: medication.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        active: medication.active !== undefined ? medication.active : true,
      };
      state.medications.push(newMed);
      saveKinCareState(state);
      return NextResponse.json({ success: true, medication: newMed, state });
    }

    if (action === "UPDATE") {
      const index = state.medications.findIndex((m) => m.id === medication.id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: "Medication not found" }, { status: 404 });
      }
      state.medications[index] = { ...state.medications[index], ...medication };
      saveKinCareState(state);
      return NextResponse.json({ success: true, medication: state.medications[index], state });
    }

    if (action === "TOGGLE_ACTIVE") {
      const index = state.medications.findIndex((m) => m.id === medication.id);
      if (index !== -1) {
        state.medications[index].active = !state.medications[index].active;
        saveKinCareState(state);
        return NextResponse.json({ success: true, medication: state.medications[index], state });
      }
      return NextResponse.json({ success: false, error: "Medication not found" }, { status: 404 });
    }

    if (action === "DELETE") {
      state.medications = state.medications.filter((m) => m.id !== medication.id);
      saveKinCareState(state);
      return NextResponse.json({ success: true, state });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
