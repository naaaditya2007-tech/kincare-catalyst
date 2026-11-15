import {
  getKinCareState,
  recordDoseAction,
  switchActivePatient,
  resetToSeedState,
  getMultiPatientStore,
} from "../src/lib/store";

describe("KinCare Global Store & Telemetry Engine", () => {
  beforeEach(() => {
    resetToSeedState();
  });

  it("initializes with default multi-patient seed state", () => {
    const state = getKinCareState();
    expect(state).toBeDefined();
    expect(state.elderProfile).toBeDefined();
    expect(state.elderProfile.name).toBe("Raghavan Iyer");
    expect(state.medications.length).toBeGreaterThan(0);
    expect(state.careCircle.length).toBeGreaterThanOrEqual(3);
  });

  it("updates state and decrements pill inventory when a dose is logged as TAKEN", () => {
    const initialState = getKinCareState();
    const targetMed = initialState.medications[0];
    const initialStock = targetMed.stockRemaining;

    const result = recordDoseAction(targetMed.id, "TAKEN", "ELDER", "Taken with lukewarm water");

    expect(result.success).toBe(true);
    expect(result.doseLog.status).toBe("TAKEN");
    expect(result.doseLog.medicationId).toBe(targetMed.id);
    expect(result.medication?.stockRemaining).toBe(initialStock - 1);

    const updatedState = getKinCareState();
    const updatedMed = updatedState.medications.find((m) => m.id === targetMed.id);
    expect(updatedMed?.stockRemaining).toBe(initialStock - 1);
  });

  it("records skipped reason and preserves inventory stock when dose is SKIPPED_WITH_REASON", () => {
    const state = getKinCareState();
    const targetMed = state.medications[1];
    const initialStock = targetMed.stockRemaining;
    const skipReason = "Feeling slightly dizzy, postponing dose";

    const result = recordDoseAction(targetMed.id, "SKIPPED_WITH_REASON", "ELDER", skipReason);

    expect(result.success).toBe(true);
    expect(result.doseLog.status).toBe("SKIPPED_WITH_REASON");
    expect(result.doseLog.elderNote).toBe(skipReason);
    expect(result.medication?.stockRemaining).toBe(initialStock);
  });

  it("supports switching between multi-patient profiles seamlessly", () => {
    const store = getMultiPatientStore();
    const kavita = store.patients.find((p) => p.elderProfile.name.includes("Kavita"));

    expect(kavita).toBeDefined();
    if (kavita) {
      const switchedState = switchActivePatient(kavita.elderProfile.id);
      expect(switchedState.elderProfile.name).toContain("Kavita");
      expect(switchedState.medications.length).toBe(5);
    }
  });
});
