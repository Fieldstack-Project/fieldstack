import { describe, expect, it, vi } from "vitest";

import { parseMode1ResetArgs, runMode1LocalReset } from "./mode1-local-reset";

describe("mode1 local reset cli", () => {
  it("parses reset command args", () => {
    const parsed = parseMode1ResetArgs([
      "node",
      "cli",
      "--user-id",
      "u-1",
      "--temp-password",
      "Temp1234",
      "--admin-pin",
      "9876",
    ]);

    expect(parsed).toEqual({
      userId: "u-1",
      temporaryPassword: "Temp1234",
      adminPin: "9876",
    });
  });

  it("runs command executor and returns result", async () => {
    const executor = vi.fn(async () => Promise.resolve());

    const result = await runMode1LocalReset(
      ["node", "cli", "--user-id", "u-2", "--temp-password", "Temp9876", "--admin-pin", "1234"],
      executor,
    );

    expect(executor).toHaveBeenCalledTimes(1);
    expect(result.userId).toBe("u-2");
    expect(result.resetAt.length).toBeGreaterThan(0);
  });
});
