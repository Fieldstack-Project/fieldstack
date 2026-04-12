import { FormEvent, useState } from "react";

import { PASSWORD_POLICY, validatePassword } from "@fieldstack/core";

import "../styles/change-password.css";

interface ChangePasswordViewProps {
  isFirstLogin: boolean; // true = 임시 비번 첫 로그인, false = 일반 변경
  onChanged: () => void;
}

interface FieldState {
  value: string;
  touched: boolean;
}

export function ChangePasswordView({ isFirstLogin, onChanged }: ChangePasswordViewProps) {
  const [current, setCurrent] = useState<FieldState>({ value: "", touched: false });
  const [next, setNext] = useState<FieldState>({ value: "", touched: false });
  const [confirm, setConfirm] = useState<FieldState>({ value: "", touched: false });
  const [submitted, setSubmitted] = useState(false);

  const nextValidation = validatePassword(next.value);
  const confirmMismatch = confirm.value !== next.value;

  const showNextErrors = (next.touched || submitted) && !nextValidation.valid;
  const showConfirmError = (confirm.touched || submitted) && confirmMismatch;
  const showCurrentError = (current.touched || submitted) && current.value.length === 0;

  const canSubmit =
    current.value.length > 0 &&
    nextValidation.valid &&
    !confirmMismatch;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    // TODO: API 연결 시 current 비밀번호 검증 후 변경
    onChanged();
  };

  return (
    <main className="cpw-shell">
      <section className="panel cpw-panel" aria-labelledby="cpw-title">
        <div className="cpw-header">
          <span className="cpw-icon" aria-hidden="true">🔑</span>
          <h1 className="cpw-title" id="cpw-title">
            {isFirstLogin ? "비밀번호를 설정해주세요" : "비밀번호 변경"}
          </h1>
          <p className="cpw-desc">
            {isFirstLogin
              ? "임시 비밀번호로 로그인하셨습니다. 사용 전 새 비밀번호를 설정해야 합니다."
              : "현재 비밀번호를 확인한 후 새 비밀번호를 입력하세요."}
          </p>
        </div>

        <form className="stack cpw-form" onSubmit={handleSubmit} noValidate>
          {/* 현재(임시) 비밀번호 */}
          <label className="field">
            <span>{isFirstLogin ? "임시 비밀번호" : "현재 비밀번호"}</span>
            <input
              className={`input${showCurrentError ? " cpw-input-error" : ""}`}
              type="password"
              autoComplete="current-password"
              value={current.value}
              onChange={(e) => setCurrent({ value: e.target.value, touched: true })}
              placeholder="••••••••"
            />
            {showCurrentError && (
              <p className="cpw-field-error" role="alert">필수 입력 항목입니다.</p>
            )}
          </label>

          {/* 새 비밀번호 */}
          <label className="field">
            <span>새 비밀번호</span>
            <input
              className={`input${showNextErrors ? " cpw-input-error" : ""}`}
              type="password"
              autoComplete="new-password"
              value={next.value}
              onChange={(e) => setNext({ value: e.target.value, touched: true })}
              placeholder="••••••••"
              aria-describedby="cpw-policy"
            />
          </label>

          {/* 정책 체크리스트 */}
          <ul className="cpw-policy" id="cpw-policy" aria-label="비밀번호 조건">
            <PolicyItem
              met={next.value.length >= PASSWORD_POLICY.minLength && next.value.length <= PASSWORD_POLICY.maxLength}
              active={next.touched || submitted}
              label={`${PASSWORD_POLICY.minLength}~${PASSWORD_POLICY.maxLength}자`}
            />
            <PolicyItem
              met={/[A-Z]/.test(next.value)}
              active={next.touched || submitted}
              label="영어 대문자 포함"
            />
            <PolicyItem
              met={/[a-z]/.test(next.value)}
              active={next.touched || submitted}
              label="영어 소문자 포함"
            />
            <PolicyItem
              met={/\d/.test(next.value)}
              active={next.touched || submitted}
              label="숫자 포함"
            />
            <PolicyItem
              met={/[^a-zA-Z0-9]/.test(next.value)}
              active={next.touched || submitted}
              label="특수문자 포함"
            />
          </ul>

          {/* 비밀번호 확인 */}
          <label className="field">
            <span>새 비밀번호 확인</span>
            <input
              className={`input${showConfirmError ? " cpw-input-error" : ""}`}
              type="password"
              autoComplete="new-password"
              value={confirm.value}
              onChange={(e) => setConfirm({ value: e.target.value, touched: true })}
              placeholder="••••••••"
            />
            {showConfirmError && (
              <p className="cpw-field-error" role="alert">비밀번호가 일치하지 않습니다.</p>
            )}
          </label>

          <button
            className="button button-primary button-block"
            type="submit"
          >
            비밀번호 변경
          </button>
        </form>
      </section>
    </main>
  );
}

// ─── Policy Checklist Item ────────────────────────────────────
function PolicyItem({
  met,
  active,
  label,
}: {
  met: boolean;
  active: boolean;
  label: string;
}) {
  const state = !active ? "idle" : met ? "ok" : "fail";
  return (
    <li className={`cpw-policy-item cpw-policy-${state}`} aria-live="polite">
      <span className="cpw-policy-dot" aria-hidden="true" />
      {label}
    </li>
  );
}
