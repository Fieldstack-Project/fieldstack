import { useEffect, useRef, useState } from "react";

import "../styles/settings.css";

interface SettingsViewProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onClose: () => void;
  onSaved: () => void;
}

export function SettingsView({ isAdmin, onToggleAdmin, onClose, onSaved }: SettingsViewProps) {
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("ko");
  const [theme, setTheme] = useState("light");
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSave = () => {
    onSaved();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      tabIndex={-1}
    >
      <div className="settings-dialog" ref={dialogRef}>
        <div className="settings-dialog-header">
          <div className="settings-dialog-headline">
            <div>
              <h2 className="settings-dialog-title" id="settings-title">
                General Settings
              </h2>
              <p className="settings-dialog-subtitle">프로필, 환경설정, 권한 테스트 상태를 관리합니다.</p>
            </div>
            <button
              className="settings-dialog-close"
              type="button"
              aria-label="설정 닫기"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="settings-dialog-tabs">
            <span className="settings-tab">Profile</span>
            <span className="settings-tab">Preference</span>
            <span className="settings-tab">Security</span>
          </div>
        </div>

        <div className="settings-dialog-body">
          <section className="settings-section" aria-labelledby="settings-profile">
            <p className="settings-section-label" id="settings-profile">
              프로필
            </p>
            <label className="field">
              <span>표시 이름</span>
              <input
                className="input"
                type="text"
                placeholder="Fieldstack Owner"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          </section>

          <section className="settings-section" aria-labelledby="settings-prefs">
            <p className="settings-section-label" id="settings-prefs">
              환경설정
            </p>
            <label className="field">
              <span>언어</span>
              <select
                className="select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="field">
              <span>테마</span>
              <select
                className="select"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">라이트</option>
                <option value="dark">다크</option>
                <option value="system">시스템 따르기</option>
              </select>
            </label>
          </section>

          <section className="settings-section" aria-labelledby="settings-dev">
            <p className="settings-section-label" id="settings-dev">
              개발 (Phase 1.5 Mock)
            </p>
            <button className="button" type="button" onClick={onToggleAdmin}>
              {isAdmin ? "관리자 권한 해제" : "관리자 권한 부여 (테스트용)"}
            </button>
          </section>
        </div>

        <div className="settings-dialog-footer">
          <button className="button" type="button" onClick={onClose}>
            취소
          </button>
          <button className="button button-primary" type="button" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
