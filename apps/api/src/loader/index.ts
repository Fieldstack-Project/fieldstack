export interface ModuleRoutes {
  frontend: string;
  api: string;
}

export interface ModuleManifest {
  name: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  routes: ModuleRoutes;
}

export interface BackendRouteRegistration {
  moduleName: string;
  apiBasePath: string;
}

export interface BackendModuleEntry {
  name: string;
  manifestJson: string;
}

export function parseModuleJson(content: string): ModuleManifest {
  const parsed = JSON.parse(content) as Partial<ModuleManifest>;

  return {
    name: parsed.name ?? "",
    version: parsed.version ?? "0.0.0",
    enabled: parsed.enabled ?? false,
    dependencies: parsed.dependencies ?? [],
    routes: {
      frontend: parsed.routes?.frontend ?? "",
      api: parsed.routes?.api ?? "",
    },
  };
}

export async function scanBackendModules(
  entries: BackendModuleEntry[],
): Promise<ModuleManifest[]> {
  const manifests = entries.map((entry) => {
    const manifest = parseModuleJson(entry.manifestJson);
    return {
      ...manifest,
      name: manifest.name || entry.name,
    };
  });

  return manifests.filter((manifest) => manifest.enabled);
}

export function buildBackendRouteRegistrations(
  manifests: ModuleManifest[],
): BackendRouteRegistration[] {
  return manifests.map((manifest) => ({
    moduleName: manifest.name,
    apiBasePath: manifest.routes.api,
  }));
}

export interface DependencyIssue {
  moduleName: string;
  missingDependencies: string[];
}

export function validateModuleDependencies(manifests: ModuleManifest[]): DependencyIssue[] {
  const installedModules = new Set(manifests.map((manifest) => manifest.name));

  return manifests
    .map((manifest) => {
      const missingDependencies = manifest.dependencies.filter(
        (dependency) => !installedModules.has(dependency),
      );

      return {
        moduleName: manifest.name,
        missingDependencies,
      };
    })
    .filter((issue) => issue.missingDependencies.length > 0);
}

export default {
  parseModuleJson,
  scanBackendModules,
  buildBackendRouteRegistrations,
  validateModuleDependencies,
};
