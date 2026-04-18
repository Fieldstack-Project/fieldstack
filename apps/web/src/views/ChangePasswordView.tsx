import { useState, type FormEvent } from "react";

import { PASSWORD_POLICY, validatePassword } from "@fieldstack/core/browser";

import { apiCall } from "../lib/apiFetch";

import { Alert, Button, FormField, Input } from "@fieldstack/controls";

import "../styles/change-password.css";

interface ChangePasswordViewProps {
  isFirstLogin: boolean;
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
  const [apiError, setApiError] = useState("");

  const nextValidation = validatePassword(next.value);
  const confirmMismatch = confirm.value !== next.value;

  const showCurrentError = (current.touched || submitted) && current.value.length === 0;
  const showConfirmError = (confirm.touched || submitted) && confirmMismatch;

  const canSubmit = current.value.length > 0 && nextValidation.valid && !confirmMismatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    setApiError("");
    try {
      await apiCall("/auth/password/change", {
        method: "POST",
        body: JSON.stringify({ newPassword: next.value }),
      });
      onChanged();
    } catch {
      setApiError("서버 연결 오류. 다시 시도해주세요.");
    }
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

        {apiError && <Alert variant="error">{apiError}</Alert>}

        <form className="stack cpw-form" onSubmit={handleSubmit} noValidate>
          <FormField
            label={isFirstLogin ? "임시 비밀번호" : "현재 비밀번호"}
            htmlFor="cpw-current"
            error={showCurrentError ? "필수 입력 항목입니다." : undefined}
          >
            <Input
              id="cpw-current"
              type="password"
              autoComplete="current-password"
              value={current.value}
              onChange={(e) => setCurrent({ value: e.target.value, touched: true })}
              placeholder="••••••••"
            />
          </FormField>

          <FormField label="새 비밀번호" htmlFor="cpw-next">
            <Input
              id="cpw-next"
              type="password"
              autoComplete="new-password"
              value={next.value}
              onChange={(e) => setNext({ value: e.target.value, touched: true })}
              placeholder="••••••••"
              aria-describedby="cpw-policy"
            />
          </FormField>

          <ul className="cpw-policy" id="cpw-policy" aria-label="비밀번호 조건">
            <PolicyItem
              met={next.value.length >= PASSWORD_POLICY.minLength && next.value.length <= PASSWORD_POLICY.maxLength}
              active={next.touched || submitted}
              label={`${PASSWORD_POLICY.minLength}~${PASSWORD_POLICY.maxLength}자`}
            />
            <PolicyItem met={/[A-Z]/.test(next.value)} active={next.touched || submitted} label="영어 대문자 포함" />
            <PolicyItem met={/[a-z]/.test(next.value)} active={next.touched || submitted} label="영어 소문자 포함" />
            <PolicyItem met={/\d/.test(next.value)} active={next.touched || submitted} label="숫자 포함" />
            <PolicyItem
              met={/[^a-zA-Z0-9]/.test(next.value)}
              active={next.touched || submitted}
              label="특수문자 포함"
            />
          </ul>

          <FormField
            label="새 비밀번호 확인"
            htmlFor="cpw-confirm"
            error={showConfirmError ? "비밀번호가 일치하지 않습니다." : undefined}
          >
            <Input
              id="cpw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm.value}
              onChange={(e) => setConfirm({ value: e.target.value, touched: true })}
              placeholder="••••••••"
            />
          </FormField>

          <Button variant="primary" block type="submit">
            비밀번호 변경
          </Button>
        </form>
      </section>
    </main>
  );
}

function PolicyItem({ met, active, label }: { met: boolean; active: boolean; label: string }) {
  const state = !active ? "idle" : met ? "ok" : "fail";
  return (
    <li className={`cpw-policy-item cpw-policy-${state}`} aria-live="polite">
      <span className="cpw-policy-dot" aria-hidden="true" />
      {label}
    </li>
  );
}
