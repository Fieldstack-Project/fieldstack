import { describe, expect, it } from "vitest";

import { generateTotpSecret, isValidTotpCodeFormat, normalizeTotpCode } from "./totp";

describe("totp helpers", () => {
  it("generates base32 secret with requested length", () => {
    const secret = generateTotpSecret(16);
    expect(secret).toHaveLength(16);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it("normalizes user entered code", () => {
    expect(normalizeTotpCode(" 12 34 56 ")).toBe("123456");
  });

  it("validates six digit totp format", () => {
    expect(isValidTotpCodeFormat("123456")).toBe(true);
    expect(isValidTotpCodeFormat("12 34 56")).toBe(true);
    expect(isValidTotpCodeFormat("12345")).toBe(false);
  });
});
