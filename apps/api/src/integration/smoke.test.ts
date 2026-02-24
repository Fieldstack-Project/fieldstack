import { describe, expect, it } from "vitest";

import { buildBackendRouteRegistrations, type ModuleManifest } from "../loader";

describe("api integration smoke", () => {
  it("creates route registrations from enabled module manifests", () => {
    const manifests: ModuleManifest[] = [
      {
        name: "ledger",
        version: "1.0.0",
        enabled: true,
        dependencies: [],
        routes: {
          frontend: "/ledger",
          api: "/api/ledger",
        },
      },
    ];

    const routes = buildBackendRouteRegistrations(manifests);
    expect(routes).toEqual([{ moduleName: "ledger", apiBasePath: "/api/ledger" }]);
  });

  it("returns empty routes when no manifest exists", () => {
    const routes = buildBackendRouteRegistrations([]);
    expect(routes).toEqual([]);
  });
});
