import { useEffect, useState, type FormEvent } from "react";

import { Button, OtpInput } from "@fieldstack/controls";

import "../styles/otp.css";

interface OtpViewProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

const MOCK_CODE = "123456";
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 30;

export function OtpView({ email, onVerified, onCancel }: OtpViewProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const locked = attempts >= MAX_ATTEMPTS;

  const verify = (value: string) => {
    if (value === MOCK_CODE) {
      onVerified();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setError(
      next >= MAX_ATTEMPTS
        ? "시도 횟수를 초과했습니다. 관리자에게 문의하세요."
        : `인증 코드가 올바르지 않습니다. (${next}/${MAX_ATTEMPTS})`,
    );
    setCode("");
  };

  const handleChange = (value: string) => {
    setCode(value);
    setError("");
    if (value.length === 6) verify(value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length === 6) verify(code);
  };

  const handleResend = () => {
    setResendCooldown(RESEND_COOLDOWN);
    setError("");
    setAttempts(0);
    setCode("");
  };

  return (
    <main className="otp-shell">
      <section className="panel otp-panel" aria-labelledby="otp-title">
        <div className="otp-header">
          <span className="otp-icon" aria-hidden="true">🔐</span>
          <h1 className="otp-title" id="otp-title">2단계 인증</h1>
          <p className="otp-desc">
            <strong>{email}</strong> 계정에 연결된<br />
            인증 앱의 6자리 코드를 입력하세요.
          </p>
        </div>

        <form className="stack otp-form" onSubmit={handleSubmit} noValidate>
          <OtpInput
            length={6}
            value={code}
            onChange={handleChange}
            error={error || undefined}
            disabled={locked}
          />

          {!locked && (
            <Button variant="primary" block type="submit" disabled={code.length < 6}>
              인증 확인
            </Button>
          )}

          <div className="otp-footer">
            {!locked && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `재전송 (${resendCooldown}s)` : "코드 재전송"}
              </Button>
            )}
            <Button variant="ghost" type="button" onClick={onCancel}>
              로그인으로 돌아가기
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
