import { useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input } from '@fieldstack/controls';

import '../styles/forgot-password.css';

const MOCK_ADMIN_TOKEN = 'ADMIN-RECOVER-1234';

type Step = 'choice' | 'email' | 'email-sent' | 'token' | 'token-newpw' | 'token-done';

interface ForgotPasswordViewProps {
  onBack: () => void;
  onRecovered?: () => void;
}

export function ForgotPasswordView({ onBack, onRecovered }: ForgotPasswordViewProps) {
  const [step, setStep] = useState<Step>('choice');

  // ── 이메일 경로 상태 ──────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailTouched && !isValidEmail;

  // ── 관리자 토큰 경로 상태 ─────────────────────────────────────
  const [tokenEmail, setTokenEmail] = useState('');
  const [tokenEmailTouched, setTokenEmailTouched] = useState(false);
  const isValidTokenEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tokenEmail);
  const showTokenEmailError = tokenEmailTouched && !isValidTokenEmail;
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');

  // ── 이메일 경로 핸들러 ────────────────────────────────────────
  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!isValidEmail) return;
    setStep('email-sent');
  };

  // ── 관리자 토큰 경로 핸들러 ───────────────────────────────────
  const handleTokenSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTokenEmailTouched(true);
    if (!isValidTokenEmail) return;
    if (token.trim() === MOCK_ADMIN_TOKEN) {
      setTokenError('');
      setStep('token-newpw');
    } else {
      setTokenError('이메일 또는 복구 토큰이 올바르지 않습니다.');
    }
  };

  const handleNewPwSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      setPwError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setPwError('');
    setStep('token-done');
  };

  // ── 선택 화면 ─────────────────────────────────────────────────
  if (step === 'choice') {
    return (
      <main className="fpw-shell">
        <section className="panel fpw-panel" aria-labelledby="fpw-title">
          <div className="fpw-header">
            <span className="fpw-icon" aria-hidden="true">🔑</span>
            <h1 className="fpw-title" id="fpw-title">비밀번호 찾기</h1>
            <p className="fpw-desc">계정을 복구할 방법을 선택하세요.</p>
          </div>

          <div className="fpw-choice-list">
            <button className="fpw-choice-card" type="button" onClick={() => setStep('email')}>
              <span className="fpw-choice-icon" aria-hidden="true">📧</span>
              <span className="fpw-choice-body">
                <span className="fpw-choice-label">이메일로 재설정</span>
                <span className="fpw-choice-desc">
                  가입 시 등록한 이메일로 재설정 링크를 받습니다.
                </span>
              </span>
              <span className="fpw-choice-arrow" aria-hidden="true">›</span>
            </button>

            <button className="fpw-choice-card" type="button" onClick={() => setStep('token')}>
              <span className="fpw-choice-icon" aria-hidden="true">🛡️</span>
              <span className="fpw-choice-body">
                <span className="fpw-choice-label">관리자 복구 토큰 사용</span>
                <span className="fpw-choice-desc">
                  이메일 접근이 불가한 경우, 관리자로부터 토큰을 발급받아 복구합니다.
                </span>
              </span>
              <span className="fpw-choice-arrow" aria-hidden="true">›</span>
            </button>
          </div>

          <Button variant="ghost" type="button" className="fpw-back-btn" onClick={onBack}>
            로그인으로 돌아가기
          </Button>
        </section>
      </main>
    );
  }

  // ── 이메일 입력 화면 ──────────────────────────────────────────
  if (step === 'email') {
    return (
      <main className="fpw-shell">
        <section className="panel fpw-panel" aria-labelledby="fpw-title">
          <div className="fpw-header">
            <span className="fpw-icon" aria-hidden="true">📧</span>
            <h1 className="fpw-title" id="fpw-title">이메일로 재설정</h1>
            <p className="fpw-desc">
              가입 시 사용한 이메일 주소를 입력하면<br />
              비밀번호 재설정 링크를 보내드립니다.
            </p>
          </div>

          <form className="stack fpw-form" onSubmit={handleEmailSubmit} noValidate>
            <FormField
              label="이메일 주소"
              htmlFor="fpw-email"
              error={showEmailError ? '올바른 이메일 주소를 입력하세요.' : undefined}
            >
              <Input
                id="fpw-email"
                type="email"
                autoComplete="email"
                placeholder="owner@fieldstack.dev"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailTouched(true);
                }}
              />
            </FormField>
            <Button variant="primary" block type="submit">
              재설정 링크 전송
            </Button>
          </form>

          <Button
            variant="ghost"
            type="button"
            className="fpw-back-btn"
            onClick={() => setStep('choice')}
          >
            이전으로
          </Button>
        </section>
      </main>
    );
  }

  // ── 이메일 전송 완료 화면 ─────────────────────────────────────
  if (step === 'email-sent') {
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
              이메일 접근이 불가한 경우 관리자에게 문의하면 복구 토큰을 발급받을 수 있습니다.
            </p>
          </div>
          <Button block type="button" onClick={onBack}>
            로그인으로 돌아가기
          </Button>
        </section>
      </main>
    );
  }

  // ── 관리자 토큰 입력 화면 ─────────────────────────────────────
  if (step === 'token') {
    return (
      <main className="fpw-shell">
        <section className="panel fpw-panel" aria-labelledby="fpw-title">
          <div className="fpw-header">
            <span className="fpw-icon" aria-hidden="true">🛡️</span>
            <h1 className="fpw-title" id="fpw-title">관리자 복구 토큰</h1>
            <p className="fpw-desc">
              관리자로부터 발급받은 복구 토큰을 입력하세요.<br />
              토큰은 일회성이며 발급 후 24시간 유효합니다.
            </p>
          </div>

          {tokenError && (
            <Alert variant="error">{tokenError}</Alert>
          )}

          <form className="stack fpw-form" onSubmit={handleTokenSubmit} noValidate>
            <FormField
              label="계정 이메일"
              htmlFor="fpw-token-email"
              error={showTokenEmailError ? '올바른 이메일 주소를 입력하세요.' : undefined}
            >
              <Input
                id="fpw-token-email"
                type="email"
                autoComplete="email"
                placeholder="owner@fieldstack.dev"
                value={tokenEmail}
                onChange={(e) => {
                  setTokenEmail(e.target.value);
                  setTokenEmailTouched(true);
                }}
              />
            </FormField>
            <FormField label="복구 토큰" htmlFor="fpw-token">
              <Input
                id="fpw-token"
                type="text"
                autoComplete="off"
                placeholder="ADMIN-RECOVER-XXXX"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenError('');
                }}
              />
            </FormField>
            <Button
              variant="primary"
              block
              type="submit"
              disabled={tokenEmail.trim().length === 0 || token.trim().length === 0}
            >
              토큰 확인
            </Button>
          </form>

          <div className="fpw-divider" aria-hidden="true" />

          <div className="fpw-notice">
            <p className="fpw-notice-label">복구 토큰이 없으신가요?</p>
            <p className="fpw-notice-text">
              관리자 패널 → 사용자 관리에서 복구 토큰을 발급받을 수 있습니다.
            </p>
          </div>

          <Button
            variant="ghost"
            type="button"
            className="fpw-back-btn"
            onClick={() => setStep('choice')}
          >
            이전으로
          </Button>
        </section>
      </main>
    );
  }

  // ── 새 비밀번호 설정 화면 ─────────────────────────────────────
  if (step === 'token-newpw') {
    return (
      <main className="fpw-shell">
        <section className="panel fpw-panel" aria-labelledby="fpw-title">
          <div className="fpw-header">
            <span className="fpw-icon" aria-hidden="true">✅</span>
            <h1 className="fpw-title" id="fpw-title">새 비밀번호 설정</h1>
            <p className="fpw-desc">복구 토큰이 확인되었습니다. 새 비밀번호를 설정하세요.</p>
          </div>

          {pwError && (
            <Alert variant="error">{pwError}</Alert>
          )}

          <form className="stack fpw-form" onSubmit={handleNewPwSubmit} noValidate>
            <FormField label="새 비밀번호" htmlFor="fpw-newpw">
              <Input
                id="fpw-newpw"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상 입력"
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  setPwError('');
                }}
              />
            </FormField>
            <FormField label="비밀번호 확인" htmlFor="fpw-confirmpw">
              <Input
                id="fpw-confirmpw"
                type="password"
                autoComplete="new-password"
                placeholder="동일한 비밀번호 재입력"
                value={confirmPw}
                onChange={(e) => {
                  setConfirmPw(e.target.value);
                  setPwError('');
                }}
              />
            </FormField>
            <Button
              variant="primary"
              block
              type="submit"
              disabled={newPw.length === 0 || confirmPw.length === 0}
            >
              비밀번호 변경
            </Button>
          </form>
        </section>
      </main>
    );
  }

  // ── 복구 완료 화면 ────────────────────────────────────────────
  return (
    <main className="fpw-shell">
      <section className="panel fpw-panel" aria-labelledby="fpw-title">
        <div className="fpw-header">
          <span className="fpw-icon" aria-hidden="true">🎉</span>
          <h1 className="fpw-title" id="fpw-title">비밀번호 변경 완료</h1>
          <p className="fpw-desc">새 비밀번호로 로그인할 수 있습니다.</p>
        </div>
        <Button variant="primary" block type="button" onClick={onRecovered ?? onBack}>
          로그인으로 이동
        </Button>
      </section>
    </main>
  );
}
