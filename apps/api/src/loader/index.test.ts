import { describe, expect, it } from "vitest";

import {
  buildBackendRouteRegistrations,
  parseModuleJson,
  scanBackendModules,
  validateModuleDependencies,
} from "./index";

describe("api module loader", () => {
  it("parses module json and scans enabled modules", async () => {
    const entries = [
      {
        name: "ledger",
        manifestJson: JSON.stringify({
          version: "1.0.0",
          enabled: true,
          dependencies: [],
          routes: { frontend: "/ledger", api: "/api/ledger" },
        }),
      },
      {
        name: "disabled",
        manifestJson: JSON.stringify({
          version: "1.0.0",
          enabled: false,
          dependencies: [],
          routes: { frontend: "/disabled", api: "/api/disabled" },
        }),
      },
    ];

    const manifests = await scanBackendModules(entries);
    expect(manifests).toHaveLength(1);
    expect(manifests[0]?.name).toBe("ledger");
  });

  it("builds route registrations and validates dependencies", () => {
    const ledger = parseModuleJson(
      JSON.stringify({
        name: "ledger",
        version: "1.0.0",
        enabled: true,
        dependencies: ["subscription"],
        routes: { frontend: "/ledger", api: "/api/ledger" },
      }),
    );

    const routes = buildBackendRouteRegistrations([ledger]);
    expect(routes[0]?.apiBasePath).toBe("/api/ledger");

    const issues = validateModuleDependencies([ledger]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.missingDependencies).toContain("subscription");

    const noIssues = validateModuleDependencies([
      ledger,
      {
        name: "subscription",
        version: "1.0.0",
        enabled: true,
        dependencies: [],
        routes: { frontend: "/subscription", api: "/api/subscription" },
      },
    ]);
    expect(noIssues).toHaveLength(0);
  });
});
