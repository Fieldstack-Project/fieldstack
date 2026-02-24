import { describe, expect, it } from "vitest";

import { MongoDbProvider } from "./mongodb";
import { PostgresProvider } from "./postgres";
import { SqliteProvider } from "./sqlite";
import { SupabaseProvider } from "./supabase";

describe("db providers", () => {
  it("initializes and executes connect/disconnect", async () => {
    const providers = [
      new PostgresProvider({ connectionString: "postgres://localhost" }),
      new SqliteProvider({ connectionString: "file:local.db" }),
      new SupabaseProvider({ connectionString: "https://supabase.local" }),
      new MongoDbProvider({ connectionString: "mongodb://localhost" }),
    ];

    for (const provider of providers) {
      await provider.connect();
      await provider.disconnect();
      expect(provider.name.length).toBeGreaterThan(0);
    }
  });
});
