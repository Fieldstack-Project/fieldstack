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

export interface IntegrationConfig {
  provider: string;
  enabled: boolean;
}
