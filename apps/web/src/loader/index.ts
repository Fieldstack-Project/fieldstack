export interface ModuleRoutes {
  frontend: string;
  api: string;
}

export interface ModuleAuthor {
  name?: string;
  email?: string;
  url?: string;
}

export interface ModuleManifest {
  name: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  routes: ModuleRoutes;
  repository?: string;
  author?: ModuleAuthor | string;
}

export interface FrontendRouteRegistration {
  moduleName: string;
  path: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
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
    ...(parsed.repository !== undefined && { repository: parsed.repository }),
    ...(parsed.author !== undefined && { author: parsed.author }),
  };
}

export function buildFrontendRouteRegistrations(
  manifests: ModuleManifest[],
): FrontendRouteRegistration[] {
  return manifests.filter((manifest) => manifest.enabled).map((manifest) => ({
    moduleName: manifest.name,
    path: manifest.routes.frontend,
  }));
}

export function buildNavigationItems(manifests: ModuleManifest[]): NavigationItem[] {
  return manifests
    .filter((manifest) => manifest.enabled)
    .map((manifest) => ({
      id: manifest.name,
      label: manifest.name,
      path: manifest.routes.frontend,
    }));
}
