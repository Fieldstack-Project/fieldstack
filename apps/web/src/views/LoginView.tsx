import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { Alert, Button, Checkbox, FormField, Input, OtpInput } from '@fieldstack/controls';

const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 30;
const MAX_LOGIN_ATTEMPTS = 5;

interface LoginViewProps {
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  pendingEmail: string | null;
  onOtpVerified: (code: string) => void;
  onOtpCancel: () => void;
  otpApiError?: string | null;
  loginError: string | null;
  loginAttempts: number;
  isLocked: boolean;
  sessionExpired: boolean;
}

export function LoginView({
  onLogin,
  onForgotPassword,
  pendingEmail,
  onOtpVerified,
  onOtpCancel,
  otpApiError,
  loginError,
  loginAttempts,
  isLocked,
  sessionExpired,
}: LoginViewProps) {
  const { t } = useTranslation();
  const [remember, setRemember] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const step = pendingEmail ? 'otp' : 'credentials';

  useEffect(() => {
    if (step === 'otp') {
      setOtpCode('');
      setOtpError('');
      setOtpAttempts(0);
      setResendCooldown(0);
    }
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const otpLocked = otpAttempts >= MAX_OTP_ATTEMPTS;

  const verifyOtp = (value: string) => {
    // OTP 검증은 App(main.tsx)에서 처리 — bypass: mock, normal: API
    onOtpVerified(value);
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    setOtpError('');
    if (value.length === 6) verifyOtp(value);
  };

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) verifyOtp(otpCode);
  };

  const handleResend = () => {
    setResendCooldown(RESEND_COOLDOWN_SEC);
    setOtpError('');
    setOtpAttempts(0);
    setOtpCode('');
  };

  // 잠금 직전 경고 (3회 이상 실패 시 표시)
  const showAttemptsWarning = !isLocked && loginAttempts >= 3 && !loginError;

  return (
    <>
      <section className="login-showcase" aria-hidden="true">
        <div className="showcase-kicker">{t('login.showcaseKicker')}</div>
        <h1 className="showcase-title">{t('login.showcaseTitle')}</h1>
        <p className="showcase-copy">{t('login.showcaseCopy')}</p>
        <ul className="showcase-points">
          <li>{t('login.showcasePoint1')}</li>
          <li>{t('login.showcasePoint2')}</li>
          <li>{t('login.showcasePoint3')}</li>
        </ul>
      </section>

      <section className="panel login-panel" aria-label={step === 'otp' ? t('login.panelLabel2fa') : t('login.panelLabelSignIn')}>
        <div className="login-top-label" aria-hidden="true">
          <div className="login-top-line" />
          <p className="login-top-text">{step === 'otp' ? t('login.step2fa') : t('login.stepSignIn')}</p>
        </div>

        {step === 'credentials' ? (
          <div className="login-panel-body">
            <div className="login-panel-head">
              <h2 className="title">{t('login.welcomeBack')}</h2>
              <p className="subtitle">{t('login.subtitle')}</p>
            </div>

            {/* 잠금 알림 */}
            {isLocked && (
              <Alert variant="error" className="login-alert">
                {t('login.errors.tooManyAttempts')}
              </Alert>
            )}

            <form className="stack login-form" onSubmit={onLogin} noValidate>
              <FormField label={t('login.emailLabel')} htmlFor="login-email">
                <Input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="owner@fieldstack.dev"
                  autoComplete="email"
                  required
                  disabled={isLocked}
                />
              </FormField>
              <FormField label={t('login.passwordLabel')} htmlFor="login-password">
                <Input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isLocked}
                />
              </FormField>
              <div className="login-row">
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  label={t('login.rememberMe')}
                  disabled={isLocked}
                />
                <Button variant="ghost" type="button" onClick={onForgotPassword}>
                  {t('login.forgotPassword')}
                </Button>
              </div>
              <div className="actions login-actions">
                <Button variant="primary" block type="submit" disabled={isLocked}>
                  {t('login.signInButton')}
                </Button>
                {sessionExpired && (
                  <p className="login-inline-warn" role="status">{t('login.errors.sessionExpired')}</p>
                )}
                {!isLocked && loginError && (
                  <p className="login-inline-error" role="alert">{loginError}</p>
                )}
                {showAttemptsWarning && (
                  <p className="login-inline-warn">
                    {t('login.errors.attemptsWarning', { n: loginAttempts, max: MAX_LOGIN_ATTEMPTS })}
                  </p>
                )}
              </div>
            </form>

            {/* OAuth/Passkey: 미설정 시 미노출 — 서버에서 enabled 플래그 수신 시 표시 예정 */}
            {/* TODO(Phase 1.95+): enabled 설정값 기반으로 OAuth/Passkey 버튼 조건부 렌더링 */}
          </div>
        ) : (
          <div className="login-panel-body">
            <div className="login-otp-head">
              <span className="login-otp-icon" aria-hidden="true">🔐</span>
              <h2 className="title">{t('login.otpTitle')}</h2>
              <p className="subtitle">
                <Trans
                  i18nKey="login.otpSubtitle"
                  values={{ email: pendingEmail }}
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>
            <form className="stack login-otp-form" onSubmit={handleOtpSubmit} noValidate>
              <OtpInput
                length={6}
                value={otpCode}
                onChange={handleOtpChange}
                error={otpApiError || otpError || undefined}
                disabled={otpLocked}
              />
              {!otpLocked && (
                <Button variant="primary" block type="submit" disabled={otpCode.length < 6}>
                  {t('login.otpVerify')}
                </Button>
              )}
              <div className="login-otp-footer">
                {!otpLocked && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? t('login.otpResendCooldown', { sec: resendCooldown })
                      : t('login.otpResend')}
                  </Button>
                )}
                <Button variant="ghost" type="button" onClick={onOtpCancel}>
                  {t('login.otpBackToLogin')}
                </Button>
              </div>
            </form>
          </div>
        )}
      </section>
    </>
  );
}
