import { describe, expect, it } from "vitest";

import { maskSecret, sha256Hex } from "./encryption";

describe("encryption utils", () => {
  it("hashes to sha256 hex", async () => {
    const hash = await sha256Hex("fieldstack");
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });

  it("masks secret by suffix", () => {
    expect(maskSecret("abcdef1234", 4)).toBe("******1234");
    expect(maskSecret("123", 4)).toBe("***");
  });
});
