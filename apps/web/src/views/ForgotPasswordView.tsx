import { FormEvent, useState } from "react";
import "../styles/forgot-password.css";

interface ForgotPasswordViewProps {
  onBack: () => void;
}

export function ForgotPasswordView({ onBack }: ForgotPasswordViewProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showError = touched && !isValidEmail;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValidEmail) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="fpw-shell">
        <section className="panel fpw-panel" aria-labelledby="fpw-title">
          <div className="fpw-header">
            <span className="fpw-icon" aria-hidden="true">📬</span>
            <h1 className="fpw-title" id="fpw-title">이메일을 확인하세요</h1>
            <p className="fpw-desc">
              <strong>{email}</strong> 주소로<br />
              비밀번호 재설정 링크를 전송했습니다.<br />
              이메일이 도착하지 않으면 스팸함을 확인해 주세요.
            </p>
          </div>

          <div className="fpw-notice">
            <p className="fpw-notice-label">이메일을 받지 못하셨나요?</p>
            <p className="fpw-notice-text">
              관리자에게 문의하면 임시 비밀번호를 발급받을 수 있습니다.
            </p>
          </div>

          <button className="button button-block" type="button" onClick={onBack}>
            로그인으로 돌아가기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="fpw-shell">
      <section className="panel fpw-panel" aria-labelledby="fpw-title">
        <div className="fpw-header">
          <span className="fpw-icon" aria-hidden="true">🔑</span>
          <h1 className="fpw-title" id="fpw-title">비밀번호 찾기</h1>
          <p className="fpw-desc">
            가입 시 사용한 이메일 주소를 입력하면<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form className="stack fpw-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>이메일 주소</span>
            <input
              className={`input${showError ? " fpw-input-error" : ""}`}
              type="email"
              autoComplete="email"
              placeholder="owner@fieldstack.dev"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setTouched(true); }}
            />
            {showError && (
              <p className="fpw-field-error" role="alert">올바른 이메일 주소를 입력하세요.</p>
            )}
          </label>

          <button className="button button-primary button-block" type="submit">
            재설정 링크 전송
          </button>
        </form>

        <div className="fpw-divider" aria-hidden="true" />

        <div className="fpw-notice">
          <p className="fpw-notice-label">이메일에 접근할 수 없나요?</p>
          <p className="fpw-notice-text">
            관리자에게 문의하면 임시 비밀번호를 발급받아 로그인할 수 있습니다.
          </p>
        </div>

        <button className="fpw-back-btn" type="button" onClick={onBack}>
          로그인으로 돌아가기
        </button>
      </section>
    </main>
  );
}
