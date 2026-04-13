export interface ThemeColorScale {
  [key: string]: string;
}

export interface UiThemeTokens {
  primary: ThemeColorScale;
  success: ThemeColorScale;
  warning: ThemeColorScale;
  danger: ThemeColorScale;
}

export const UI_THEME_TOKENS_BASE: UiThemeTokens = {
  primary: { "500": "#3B82F6" },
  success: { "500": "#10B981" },
  warning: { "500": "#F59E0B" },
  danger: { "500": "#EF4444" }
};
