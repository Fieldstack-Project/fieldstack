import { describe, expect, it } from "vitest";

import { buildBackendRouteRegistrations, type ModuleManifest } from "../loader";

describe("api integration smoke", () => {
  it("creates route registrations from enabled module manifests", () => {
    const manifests: ModuleManifest[] = [
      {
        name: "ledger",
        displayName: "가계부",
        description: "수입과 지출을 기록하고 관리하는 가계부 모듈",
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
