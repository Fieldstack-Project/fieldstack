import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button, FormField, Input, Modal, Select } from "@fieldstack/controls";

import { apiFetch } from "../lib/apiFetch";
import { changeLanguage } from "../i18n/index";

import "../styles/settings.css";

type ThemeSetting = "light" | "dark" | "system";
type StartupRoute = "home" | "marketplace";

interface SettingsViewProps {
  theme: ThemeSetting;
  onThemeChange: (theme: ThemeSetting) => void;
  initialStartupRoute: StartupRoute;
  onStartupRouteChange: (route: StartupRoute) => void;
  onClose: () => void;
  onSaved: () => void;
}

interface UserModule {
  name: string;
  displayName: string;
  description: string;
  basePath: string;
  version: string;
  enabled: boolean;
}

const INIT_DISPLAY_NAME = "";

export function SettingsView({
  theme,
  onThemeChange,
  initialStartupRoute,
  onStartupRouteChange,
  onClose,
  onSaved,
}: SettingsViewProps) {
  const { t, i18n } = useTranslation();
  const [displayName, setDisplayName] = useState(INIT_DISPLAY_NAME);
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('fs_language') ?? 'ko'; } catch { return 'ko'; }
  });
  const [startupRoute, setStartupRoute] = useState<StartupRoute>(initialStartupRoute);
  const [isSaving, setIsSaving] = useState(false);
  const [modules, setModules] = useState<UserModule[]>([]);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  const fetchModules = useCallback(() => {
    apiFetch("/core/modules/me")
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { modules: UserModule[] } }) => {
        if (json.success) setModules(json.data?.modules ?? []);
      })
      .catch(() => { /* 무음 처리 */ });
  }, []);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const handleToggleModule = async (name: string) => {
    if (togglingModule) return;
    setTogglingModule(name);
    try {
      const res = await apiFetch(`/core/modules/${name}/toggle`, {
        method: "PATCH",
      });
      const json = (await res.json()) as { success: boolean; data?: { enabled: boolean } };
      if (json.success && json.data !== undefined) {
        setModules((prev) =>
          prev.map((m) => (m.name === name ? { ...m, enabled: json.data!.enabled } : m)),
        );
      }
    } catch {
      /* 무음 처리 */
    } finally {
      setTogglingModule(null);
    }
  };

  const initLanguage = i18n.language;

  // 테마는 변경 즉시 localStorage에 저장되므로 dirty 체크 제외
  const isDirty =
    displayName !== INIT_DISPLAY_NAME ||
    language !== initLanguage ||
    startupRoute !== initialStartupRoute;

  const handleClose = () => {
    if (isDirty && !window.confirm(t('settings.unsavedChanges'))) return;
    onClose();
  };

  const handleSave = async () => {
    setIsSaving(true);

    // 언어가 변경된 경우 즉시 적용 + 서버 저장
    if (language !== initLanguage) {
      void changeLanguage(language);
      apiFetch('/core/users/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      }).catch(() => { /* 서버 저장 실패는 무음 처리 — localStorage에는 이미 저장됨 */ });
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    onStartupRouteChange(startupRoute);
    setIsSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title={t('settings.title')}
      size="md"
      footer={
        <>
          <Button type="button" onClick={handleClose} disabled={isSaving}>
            {t('settings.cancel')}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            loading={isSaving}
          >
            {t('settings.save')}
          </Button>
        </>
      }
    >
      <p className="settings-dialog-subtitle">{t('settings.subtitle')}</p>

      <div className="settings-dialog-tabs">
        <span className="settings-tab">{t('settings.tabs.profile')}</span>
        <span className="settings-tab">{t('settings.tabs.preference')}</span>
        <span className="settings-tab">{t('settings.tabs.security')}</span>
      </div>

      <section className="settings-section" aria-labelledby="settings-profile">
        <p className="settings-section-label" id="settings-profile">{t('settings.profile.label')}</p>
        <FormField label={t('settings.profile.displayName')} htmlFor="settings-display-name">
          <Input
            id="settings-display-name"
            type="text"
            placeholder="Fieldstack Owner"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </FormField>
      </section>

      <section className="settings-section" aria-labelledby="settings-prefs">
        <p className="settings-section-label" id="settings-prefs">{t('settings.preference.label')}</p>
        <FormField label={t('settings.preference.language')} htmlFor="settings-language">
          <Select
            id="settings-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { label: "한국어", value: "ko" },
              { label: "English", value: "en" },
            ]}
          />
        </FormField>
        <FormField label={t('settings.preference.theme')} htmlFor="settings-theme">
          <Select
            id="settings-theme"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeSetting)}
            options={[
              { label: t('settings.preference.themeLight'), value: "light" },
              { label: t('settings.preference.themeDark'), value: "dark" },
              { label: t('settings.preference.themeSystem'), value: "system" },
            ]}
          />
        </FormField>
        <FormField label={t('settings.preference.startupRoute')} htmlFor="settings-startup-route">
          <Select
            id="settings-startup-route"
            value={startupRoute}
            onChange={(e) => setStartupRoute(e.target.value as StartupRoute)}
            options={[
              { label: t('settings.preference.startupHome'), value: "home" },
              { label: t('settings.preference.startupMarketplace'), value: "marketplace" },
            ]}
          />
        </FormField>
      </section>

      {modules.length > 0 && (
        <section className="settings-section" aria-labelledby="settings-modules">
          <p className="settings-section-label" id="settings-modules">{t('settings.modules.label')}</p>
          <ul className="settings-module-list">
            {modules.map((mod) => (
              <li key={mod.name} className="settings-module-item">
                <div className="settings-module-info">
                  <span className="settings-module-name">{t(mod.displayName, { defaultValue: mod.name })}</span>
                  <span className="settings-module-version">v{mod.version}</span>
                  {mod.description && (
                    <span className="settings-module-desc">{t(mod.description, { defaultValue: mod.description })}</span>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={mod.enabled ? undefined : "primary"}
                  disabled={togglingModule === mod.name}
                  onClick={() => handleToggleModule(mod.name)}
                >
                  {togglingModule === mod.name
                    ? "..."
                    : mod.enabled
                      ? t('settings.modules.disable')
                      : t('settings.modules.enable')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

    </Modal>
  );
}
