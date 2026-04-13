import { useState } from "react";

import { Button, FormField, Input, Modal, Select } from "@fieldstack/controls";

import "../styles/settings.css";

type ThemeSetting = "light" | "dark" | "system";

interface SettingsViewProps {
  isAdmin: boolean;
  theme: ThemeSetting;
  onThemeChange: (theme: ThemeSetting) => void;
  onToggleAdmin: () => void;
  onClose: () => void;
  onSaved: () => void;
}

export function SettingsView({ isAdmin, theme, onThemeChange, onToggleAdmin, onClose, onSaved }: SettingsViewProps) {
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("ko");

  const handleSave = () => {
    onSaved();
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="General Settings"
      size="md"
      footer={
        <>
          <Button type="button" onClick={onClose}>취소</Button>
          <Button variant="primary" type="button" onClick={handleSave}>저장</Button>
        </>
      }
    >
      <p className="settings-dialog-subtitle">프로필, 환경설정, 권한 테스트 상태를 관리합니다.</p>

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
