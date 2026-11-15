import { Medication } from "@/types/kincare";

export interface TimingConflict {
  id: string;
  medicationA: string;
  medicationB: string;
  severity: "CRITICAL" | "SPACING_REQUIRED" | "MEAL_CAUTION";
  title: string;
  description: string;
  recommendedSpacingHours: number;
  remedy: string;
}

export function detectTimingConflicts(medications: Medication[]): TimingConflict[] {
  const activeMeds = medications.filter((m) => m.active);
  const conflicts: TimingConflict[] = [];

  // Helper matchers
  const hasMed = (query: string) =>
    activeMeds.find(
      (m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        (m.purpose && m.purpose.toLowerCase().includes(query.toLowerCase())) ||
        (m.category && m.category.toLowerCase().includes(query.toLowerCase()))
    );

  const thyro = hasMed("thyro") || hasMed("levothyroxine");
  const calcium = hasMed("calcium") || hasMed("shelcal");
  const iron = hasMed("iron") || hasMed("ferrous");
  const metformin = hasMed("metformin");

  // Conflict 1: Levothyroxine + Calcium
  if (thyro && calcium) {
    // Check scheduled times
    const thyroTimes = thyro.scheduledTimes.map(parseTimeToMinutes);
    const calciumTimes = calcium.scheduledTimes.map(parseTimeToMinutes);

    let tooClose = false;
    for (const tTime of thyroTimes) {
      for (const cTime of calciumTimes) {
        const diffMinutes = Math.abs(tTime - cTime);
        if (diffMinutes < 240) {
          // less than 4 hours
          tooClose = true;
          break;
        }
      }
    }

    if (tooClose || thyro.conflictNote || calcium.conflictNote) {
      conflicts.push({
        id: "conflict_thyro_calcium",
        medicationA: thyro.name,
        medicationB: calcium.name,
        severity: "SPACING_REQUIRED",
        title: "Absorption Chelation Risk (Calcium & Thyroid Hormone)",
        description: `${calcium.name} binds to ${thyro.name} in the digestive tract, reducing absorption by up to 30–50%.`,
        recommendedSpacingHours: 4,
        remedy: "Administer Thyronorm early morning on empty stomach (07:00), and schedule Calcium for Lunch (13:30) or later.",
      });
    }
  }

  // Conflict 2: Levothyroxine + Iron
  if (thyro && iron) {
    conflicts.push({
      id: "conflict_thyro_iron",
      medicationA: thyro.name,
      medicationB: iron.name,
      severity: "CRITICAL",
      title: "Bioavailability Block (Iron & Levothyroxine)",
      description: "Iron supplements bind strongly to synthetic thyroid hormone, causing subtherapeutic TSH levels.",
      recommendedSpacingHours: 4,
      remedy: "Ensure at least a 4-hour window between Thyronorm and Iron intake.",
    });
  }

  // Conflict 3: Metformin meal caution
  if (metformin && metformin.instructions.toLowerCase().includes("empty")) {
    conflicts.push({
      id: "conflict_metformin_empty",
      medicationA: metformin.name,
      medicationB: "Food Intake",
      severity: "MEAL_CAUTION",
      title: "Gastrointestinal Intolerance Precaution",
      description: "Metformin should not be administered on an empty stomach due to nausea and abdominal cramping risks.",
      recommendedSpacingHours: 0,
      remedy: "Adjust Metformin timing to 'With Dinner' or immediately after a substantial meal.",
    });
  }

  // Conflict 4: Multiple Antihypertensives concurrently
  const antihypertensives = activeMeds.filter(
    (m) =>
      m.category === "Cardiovascular" ||
      m.name.toLowerCase().includes("lol") ||
      m.name.toLowerCase().includes("pril") ||
      m.name.toLowerCase().includes("sartan") ||
      m.name.toLowerCase().includes("dipine")
  );

  if (antihypertensives.length >= 2) {
    // Check if scheduled within 30 minutes of each other
    for (let i = 0; i < antihypertensives.length; i++) {
      for (let j = i + 1; j < antihypertensives.length; j++) {
        const med1 = antihypertensives[i];
        const med2 = antihypertensives[j];
        const match = med1.scheduledTimes.some((t1) =>
          med2.scheduledTimes.some((t2) => Math.abs(parseTimeToMinutes(t1) - parseTimeToMinutes(t2)) <= 30)
        );
        if (match) {
          conflicts.push({
            id: `conflict_bp_${med1.id}_${med2.id}`,
            medicationA: med1.name,
            medicationB: med2.name,
            severity: "SPACING_REQUIRED",
            title: "Orthostatic Hypotension Risk",
            description: `Concurrent dosing of ${med1.name} and ${med2.name} within 30 minutes may cause sudden blood pressure drop and dizziness upon standing.`,
            recommendedSpacingHours: 2,
            remedy: "Separate morning and evening doses or confirm spacing with cardiologist Dr. Arvind Swaminathan.",
          });
        }
      }
    }
  }

  return conflicts;
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}
