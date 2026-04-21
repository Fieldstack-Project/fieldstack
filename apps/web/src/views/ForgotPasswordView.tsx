import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, Button, FormField, Input } from '@fieldstack/controls';

import '../styles/forgot-password.css';

type Step = 'choice' | 'email' | 'email-sent' | 'token' | 'token-newpw' | 'token-done';

interface ForgotPasswordViewProps {
  onBack: () => void;
  onRecovered?: () => void;
}

export function ForgotPasswordView({ onBack, onRecovered }: ForgotPasswordViewProps) {
  const { t } = useTranslation();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 이메일 경로 핸들러 ────────────────────────────────────────
  // SMTP 미구현(Phase 3.x) — 이메일 전송 없이 "전송됨" 화면만 표시
  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!isValidEmail) return;
    setStep('email-sent');
  };

  // ── 관리자 토큰 경로 핸들러 ───────────────────────────────────
  // 토큰 유효성 검증은 새 비밀번호 설정 단계에서 API로 처리
  const handleTokenSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTokenEmailTouched(true);
    if (!isValidTokenEmail) return;
    if (!token.trim()) return;
    setTokenError('');
    setStep('token-newpw');
  };

  const handleNewPwSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { setPwError(t('forgotPassword.errors.passwordTooShort')); return; }
    if (newPw !== confirmPw) { setPwError(t('forgotPassword.errors.passwordMismatch')); return; }
    setIsSubmitting(true);
    setPwError('');
    try {
      const res = await fetch('/auth/password/recovery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword: newPw }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        setPwError(json.error ?? t('forgotPassword.errors.invalidToken'));
        return;
      }
      setStep('token-done');
    } catch {
      setPwError(t('forgotPassword.errors.serverError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 선택 화면 ─────────────────────────────────────────────────
  if (step === 'choice') {
    return (
      <main className="fpw-shell">
        <section className="panel fpw-panel" aria-labelledby="fpw-title">
          <div className="fpw-header">
            <span className="fpw-icon" aria-hidden="true">🔑</span>
            <h1 className="fpw-title" id="fpw-title">{t('forgotPassword.title')}</h1>
            <p className="fpw-desc">{t('forgotPassword.desc')}</p>
          </div>

          <div className="fpw-choice-list">
            <button className="fpw-choice-card" type="button" onClick={() => setStep('email')}>
              <span className="fpw-choice-icon" aria-hidden="true">📧</span>
              <span className="fpw-choice-body">
                <span className="fpw-choice-label">{t('forgotPassword.emailChoice')}</span>
                <span className="fpw-choice-desc">{t('forgotPassword.emailChoiceDesc')}</span>
              </span>
              <span className="fpw-choice-arrow" aria-hidden="true">›</span>
            </button>

            <button className="fpw-choice-card" type="button" onClick={() => setStep('token')}>
              <span className="fpw-choice-icon" aria-hidden="true">🛡️</span>
              <span className="fpw-choice-body">
                <span className="fpw-choice-label">{t('forgotPassword.tokenChoice')}</span>
                <span className="fpw-choice-desc">{t('forgotPassword.tokenChoiceDesc')}</span>
              </span>
              <span className="fpw-choice-arrow" aria-hidden="true">›</span>
            </button>
          </div>

          <Button variant="ghost" type="button" className="fpw-back-btn" onClick={onBack}>
            {t('forgotPassword.backToLogin')}
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
            <h1 className="fpw-title" id="fpw-title">{t('forgotPassword.emailTitle')}</h1>
            <p className="fpw-desc">{t('forgotPassword.emailDesc')}</p>
          </div>

          <form className="stack fpw-form" onSubmit={handleEmailSubmit} noValidate>
            <FormField
              label={t('forgotPassword.emailAddressLabel')}
              htmlFor="fpw-email"
              error={showEmailError ? t('forgotPassword.invalidEmail') : undefined}
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
              {t('forgotPassword.sendResetLink')}
            </Button>
          </form>

          <Button
            variant="ghost"
            type="button"
            className="fpw-back-btn"
            onClick={() => setStep('choice')}
          >
            {t('forgotPassword.back')}
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
            <h1 className="fpw-title" id="fpw-title">{t('forgotPassword.emailSentTitle')}</h1>
            <p className="fpw-desc">{t('forgotPassword.emailSentDesc', { email })}</p>
          </div>
          <div className="fpw-notice">
            <p className="fpw-notice-label">{t('forgotPassword.emailNotReceived')}</p>
            <p className="fpw-notice-text">{t('forgotPassword.emailNotReceivedText')}</p>
          </div>
          <Button block type="button" onClick={onBack}>
            {t('forgotPassword.backToLogin')}
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
            <h1 className="fpw-title" id="fpw-title">{t('forgotPassword.tokenTitle')}</h1>
            <p className="fpw-desc">{t('forgotPassword.tokenDesc')}</p>
          </div>

          {tokenError && (
            <Alert variant="error">{tokenError}</Alert>
          )}

          <form className="stack fpw-form" onSubmit={handleTokenSubmit} noValidate>
            <FormField
              label={t('forgotPassword.accountEmail')}
              htmlFor="fpw-token-email"
              error={showTokenEmailError ? t('forgotPassword.invalidEmail') : undefined}
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
            <FormField label={t('forgotPassword.recoveryToken')} htmlFor="fpw-token">
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
              {t('forgotPassword.verifyToken')}
            </Button>
          </form>

          <div className="fpw-divider" aria-hidden="true" />

          <div className="fpw-notice">
            <p className="fpw-notice-label">{t('forgotPassword.noToken')}</p>
            <p className="fpw-notice-text">{t('forgotPassword.noTokenText')}</p>
          </div>

          <Button
            variant="ghost"
            type="button"
            className="fpw-back-btn"
            onClick={() => setStep('choice')}
          >
            {t('forgotPassword.back')}
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
            <h1 className="fpw-title" id="fpw-title">{t('forgotPassword.newPasswordTitle')}</h1>
            <p className="fpw-desc">{t('forgotPassword.newPasswordDesc')}</p>
          </div>

          {pwError && (
            <Alert variant="error">{pwError}</Alert>
          )}

          <form className="stack fpw-form" onSubmit={handleNewPwSubmit} noValidate>
            <FormField label={t('forgotPassword.newPassword')} htmlFor="fpw-newpw">
              <Input
                id="fpw-newpw"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  setPwError('');
                }}
              />
            </FormField>
            <FormField label={t('forgotPassword.confirmPassword')} htmlFor="fpw-confirmpw">
              <Input
                id="fpw-confirmpw"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
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
              disabled={newPw.length === 0 || confirmPw.length === 0 || isSubmitting}
              loading={isSubmitting}
            >
              {t('forgotPassword.changePassword')}
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
          <h1 className="fpw-title" id="fpw-title">{t('forgotPassword.doneTitle')}</h1>
          <p className="fpw-desc">{t('forgotPassword.doneDesc')}</p>
        </div>
        <Button variant="primary" block type="button" onClick={onRecovered ?? onBack}>
          {t('forgotPassword.goToLogin')}
        </Button>
      </section>
    </main>
  );
}
