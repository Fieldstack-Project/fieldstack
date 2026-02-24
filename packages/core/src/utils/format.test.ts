import { describe, expect, it } from "vitest";

import { formatCurrency, formatPercent } from "./format";

describe("format utils", () => {
  it("formats currency", () => {
    expect(formatCurrency(1200.5, "USD", "en-US")).toContain("1,200.5");
  });

  it("formats percentage", () => {
    expect(formatPercent(0.1234, "en-US")).toContain("12");
  });
});
