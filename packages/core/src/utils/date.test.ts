import { describe, expect, it } from "vitest";

import { addDays, endOfDay, formatIsoDate, startOfDay } from "./date";

describe("date utils", () => {
  it("formats date as yyyy-mm-dd", () => {
    expect(formatIsoDate(new Date("2026-03-01T10:00:00.000Z"))).toBe("2026-03-01");
  });

  it("returns start and end of day", () => {
    const value = new Date("2026-03-01T10:15:30.000Z");
    const start = startOfDay(value);
    const end = endOfDay(value);

    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);

    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("adds days", () => {
    expect(addDays(new Date("2026-03-01T00:00:00.000Z"), 2).toISOString().slice(0, 10)).toBe(
      "2026-03-03",
    );
  });
});
