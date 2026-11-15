import { NextRequest, NextResponse } from "next/server";
import {
  getKinCareState,
  resetToSeedState,
  saveKinCareState,
  getAllPatientRecords,
  getAllElderProfiles,
  switchActivePatient,
  createElderPatient,
} from "@/lib/store";

export async function GET() {
  const state = getKinCareState();
  const patientRecords = getAllPatientRecords();
  const allPatients = getAllElderProfiles();
  return NextResponse.json({
    success: true,
    state,
    allPatients,
    patientRecords,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, patientId, patientData } = body;

    if (action === "RESET") {
      const state = resetToSeedState();
      return NextResponse.json({
        success: true,
        state,
        allPatients: getAllElderProfiles(),
        patientRecords: getAllPatientRecords(),
      });
    }

    if (action === "SWITCH_PATIENT" && patientId) {
      const state = switchActivePatient(patientId);
      return NextResponse.json({
        success: true,
        state,
        allPatients: getAllElderProfiles(),
        patientRecords: getAllPatientRecords(),
      });
    }

    if (action === "CREATE_PATIENT" && patientData) {
      const { state, newPatient } = createElderPatient(patientData);
      return NextResponse.json({
        success: true,
        state,
        newPatient,
        allPatients: getAllElderProfiles(),
        patientRecords: getAllPatientRecords(),
      });
    }

    if (body.state) {
      saveKinCareState(body.state);
      return NextResponse.json({
        success: true,
        state: body.state,
        allPatients: getAllElderProfiles(),
        patientRecords: getAllPatientRecords(),
      });
    }

    return NextResponse.json({
      success: true,
      state: getKinCareState(),
      allPatients: getAllElderProfiles(),
      patientRecords: getAllPatientRecords(),
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
