import { useState } from "react";

import { Button, FormField, Input, Modal, Select } from "@fieldstack/controls";

import "../styles/settings.css";

type ThemeSetting = "light" | "dark" | "system";
type StartupRoute = "home" | "marketplace";

interface SettingsViewProps {
  isAdmin: boolean;
  theme: ThemeSetting;
  onThemeChange: (theme: ThemeSetting) => void;
  initialStartupRoute: StartupRoute;
  onStartupRouteChange: (route: StartupRoute) => void;
  onToggleAdmin: () => void;
  onClose: () => void;
  onSaved: () => void;
}

const INIT_DISPLAY_NAME = "";
const INIT_LANGUAGE = "ko";

export function SettingsView({
  isAdmin,
  theme,
  onThemeChange,
  initialStartupRoute,
  onStartupRouteChange,
  onToggleAdmin,
  onClose,
  onSaved,
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(INIT_DISPLAY_NAME);
  const [language, setLanguage] = useState(INIT_LANGUAGE);
  const [startupRoute, setStartupRoute] = useState<StartupRoute>(initialStartupRoute);
  const [isSaving, setIsSaving] = useState(false);

  // 테마는 변경 즉시 localStorage에 저장되므로 dirty 체크 제외
  const isDirty =
    displayName !== INIT_DISPLAY_NAME ||
    language !== INIT_LANGUAGE ||
    startupRoute !== initialStartupRoute;

  const handleClose = () => {
    if (isDirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?")) return;
    onClose();
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onStartupRouteChange(startupRoute);
      setIsSaving(false);
      onSaved();
      onClose();
    }, 500);
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title="General Settings"
      size="md"
      footer={
        <>
          <Button type="button" onClick={handleClose} disabled={isSaving}>
            취소
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            loading={isSaving}
          >
            저장
          </Button>
        </>
      }
    >
      <p className="settings-dialog-subtitle">
        프로필, 환경설정, 권한 테스트 상태를 관리합니다.
      </p>

      <div className="settings-dialog-tabs">
        <span className="settings-tab">Profile</span>
        <span className="settings-tab">Preference</span>
        <span className="settings-tab">Security</span>
      </div>

      <section className="settings-section" aria-labelledby="settings-profile">
        <p className="settings-section-label" id="settings-profile">프로필</p>
        <FormField label="표시 이름" htmlFor="settings-display-name">
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
        <p className="settings-section-label" id="settings-prefs">환경설정</p>
        <FormField label="언어" htmlFor="settings-language">
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
        <FormField label="테마" htmlFor="settings-theme">
          <Select
            id="settings-theme"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeSetting)}
            options={[
              { label: "라이트", value: "light" },
              { label: "다크", value: "dark" },
              { label: "시스템 따르기", value: "system" },
            ]}
          />
        </FormField>
        <FormField label="로그인 후 첫 화면" htmlFor="settings-startup-route">
          <Select
            id="settings-startup-route"
            value={startupRoute}
            onChange={(e) => setStartupRoute(e.target.value as StartupRoute)}
            options={[
              { label: "홈 화면", value: "home" },
              { label: "마켓플레이스", value: "marketplace" },
            ]}
          />
        </FormField>
      </section>

      <section className="settings-section" aria-labelledby="settings-dev">
        <p className="settings-section-label" id="settings-dev">개발 (Phase 1.5 Mock)</p>
        <Button type="button" onClick={onToggleAdmin}>
          {isAdmin ? "관리자 권한 해제" : "관리자 권한 부여 (테스트용)"}
        </Button>
      </section>
    </Modal>
  );
}
