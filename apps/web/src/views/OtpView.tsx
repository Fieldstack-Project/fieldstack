import { FormEvent, useEffect, useRef, useState } from "react";
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
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const locked = attempts >= MAX_ATTEMPTS;
  const code = digits.join("");

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
    setDigits(["", "", "", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
    if (char && next.every((d) => d !== "")) verify(next.join(""));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length === 6) verify(code);
  };

  const handleResend = () => {
    setResendCooldown(RESEND_COOLDOWN);
    setError("");
    setAttempts(0);
    setDigits(["", "", "", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
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
          <div className="otp-digits" role="group" aria-label="인증 코드 입력">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                className={`otp-digit${error ? " otp-digit-error" : ""}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                disabled={locked}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`${i + 1}번째 자리`}
              />
            ))}
          </div>

          {error && <p className="otp-error" role="alert">{error}</p>}

          {!locked && (
            <button
              className="button button-primary button-block"
              type="submit"
              disabled={code.length < 6}
            >
              인증 확인
            </button>
          )}

          <div className="otp-footer">
            {!locked && (
              <button
                className="otp-text-btn"
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `재전송 (${resendCooldown}s)` : "코드 재전송"}
              </button>
            )}
            <button className="otp-text-btn otp-text-btn-muted" type="button" onClick={onCancel}>
              로그인으로 돌아가기
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
