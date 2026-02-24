export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface ModuleMetadata {
  name: string;
  version: string;
  enabled: boolean;
}

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

export interface IntegrationConfig {
  provider: string;
  enabled: boolean;
}
