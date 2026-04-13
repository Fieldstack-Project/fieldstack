export interface UiProviderConfig {
  useRadixPrimitives: boolean;
  useShadcnPatterns: boolean;
}

export interface UiPackageMetadata {
  name: "@fieldstack/controls";
  version: string;
}

export const UI_PROVIDER_CONFIG_DEFAULTS: UiProviderConfig = {
  useRadixPrimitives: true,
  useShadcnPatterns: true
};

export const UI_PACKAGE_METADATA: UiPackageMetadata = {
  name: "@fieldstack/controls",
  version: "0.0.0"
};
