import { describe, expect, it } from "vitest";

import { InMemoryMigrationRunner } from "./index";

describe("migration runner", () => {
  it("applies and rolls back migrations", async () => {
    const runner = new InMemoryMigrationRunner([
      { id: "001", upSql: "create table a", downSql: "drop table a" },
      { id: "002", upSql: "create table b", downSql: "drop table b" },
    ]);

    await runner.up();
    expect(runner.listApplied()).toEqual(["001", "002"]);

    await runner.down();
    expect(runner.listApplied()).toEqual([]);
  });
});
