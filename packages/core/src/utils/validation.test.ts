import { describe, expect, it } from "vitest";

import { isEmail, isNonEmpty, isStrongPassword, validatePassword } from "./validation";

describe("validation utils", () => {
  it("validates non-empty values", () => {
    expect(isNonEmpty("fieldstack")).toBe(true);
    expect(isNonEmpty("   ")).toBe(false);
  });

  it("validates email format", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("invalid-email")).toBe(false);
  });

  describe("validatePassword", () => {
    const VALID = "Fieldstack@1234";

    it("accepts a valid password", () => {
      expect(validatePassword(VALID).valid).toBe(true);
      expect(validatePassword(VALID).errors).toHaveLength(0);
    });

    it("rejects password shorter than 12 characters", () => {
      const result = validatePassword("Short@1A");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("12"))).toBe(true);
    });

    it("rejects password longer than 20 characters", () => {
      const result = validatePassword("Fieldstack@123456789012");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("20"))).toBe(true);
    });

    it("rejects password missing uppercase", () => {
      const result = validatePassword("fieldstack@1234");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("대문자"))).toBe(true);
    });

    it("rejects password missing lowercase", () => {
      const result = validatePassword("FIELDSTACK@1234");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("소문자"))).toBe(true);
    });

    it("rejects password missing digits", () => {
      const result = validatePassword("Fieldstack@abcd");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("숫자"))).toBe(true);
    });

    it("rejects password missing special characters", () => {
      const result = validatePassword("Fieldstack1234");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("특수문자"))).toBe(true);
    });

    it("returns multiple errors at once", () => {
      const result = validatePassword("short");
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  it("isStrongPassword returns boolean based on validatePassword", () => {
    expect(isStrongPassword("Fieldstack@1234")).toBe(true);
    expect(isStrongPassword("weak")).toBe(false);
  });
});
