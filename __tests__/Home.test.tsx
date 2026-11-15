/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PasscodeGate } from "../src/components/auth/PasscodeGate";
import { DEFAULT_ELDER_PROFILE } from "../src/lib/constants";

describe("KinCare Authentication Gateway & Passcode Gate", () => {
  it("renders the primary welcome header and care vault badge", () => {
    const handleSuccess = jest.fn();
    render(
      <PasscodeGate
        elderProfile={DEFAULT_ELDER_PROFILE}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Care Vault Access")).toBeInTheDocument();
  });

  it("renders the 1-click quick login role badges", () => {
    const handleSuccess = jest.fn();
    render(
      <PasscodeGate
        elderProfile={DEFAULT_ELDER_PROFILE}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText("Elder View")).toBeInTheDocument();
    expect(screen.getByText("Family Admin")).toBeInTheDocument();
  });

  it("displays the default registered patient profile for Raghavan Iyer", () => {
    const handleSuccess = jest.fn();
    render(
      <PasscodeGate
        elderProfile={DEFAULT_ELDER_PROFILE}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText("Raghavan Iyer")).toBeInTheDocument();
  });
});
