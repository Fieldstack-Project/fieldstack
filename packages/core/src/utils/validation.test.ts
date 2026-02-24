import { describe, expect, it } from "vitest";

import { isEmail, isNonEmpty, isStrongPassword } from "./validation";

describe("validation utils", () => {
  it("validates non-empty values", () => {
    expect(isNonEmpty("fieldstack")).toBe(true);
    expect(isNonEmpty("   ")).toBe(false);
  });

  it("validates email format", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("invalid-email")).toBe(false);
  });

  it("validates strong password rule", () => {
    expect(isStrongPassword("Abcd1234")).toBe(true);
    expect(isStrongPassword("abcd1234")).toBe(false);
  });
});
