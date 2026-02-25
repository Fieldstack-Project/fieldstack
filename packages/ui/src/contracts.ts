export interface UiProviderConfig {
  useRadixPrimitives: boolean;
  useShadcnPatterns: boolean;
}

export interface UiPackageMetadata {
  name: "@fieldstack/ui";
  version: string;
}

export const UI_PROVIDER_CONFIG_DEFAULTS: UiProviderConfig = {
  useRadixPrimitives: true,
  useShadcnPatterns: true
};

export const UI_PACKAGE_METADATA: UiPackageMetadata = {
  name: "@fieldstack/ui",
  version: "0.0.0"
};
