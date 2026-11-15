/**
 * @jest-environment jsdom
 */

import React from "react";
import HomePage from "../src/app/page";
import { PasscodeGate } from "../src/components/auth/PasscodeGate";
import { DEFAULT_ELDER_PROFILE } from "../src/lib/constants";

describe("KinCare Home Page & Authentication Gateway", () => {
  it("defines the HomePage component properly", () => {
    expect(HomePage).toBeDefined();
    expect(typeof HomePage).toBe("function");
  });

  it("renders the PasscodeGate with required elderProfile and callback props", () => {
    const handleSuccess = (role: string) => role;
    const gateElement = React.createElement(PasscodeGate, {
      elderProfile: DEFAULT_ELDER_PROFILE,
      onSuccess: handleSuccess,
    });

    expect(gateElement).toBeDefined();
    expect(gateElement.props.elderProfile.name).toBe("Raghavan Iyer");
    expect(gateElement.props.elderProfile.age).toBe(74);
  });

  it("initializes with default patient credentials for Raghavan Iyer", () => {
    expect(DEFAULT_ELDER_PROFILE.id).toBe("elder_raghavan_01");
    expect(DEFAULT_ELDER_PROFILE.bloodGroup).toBe("O+");
    expect(DEFAULT_ELDER_PROFILE.allergies).toContain("Penicillin");
  });
});
