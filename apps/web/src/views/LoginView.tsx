import { useEffect, useState, type FormEvent } from 'react';

import { Button, Checkbox, FormField, Input, OtpInput } from '@fieldstack/controls';

const MOCK_OTP_CODE = '123456';
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 30;

interface LoginViewProps {
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onQuickLogin: () => void;
  onForgotPassword: () => void;
  showDevBypass: boolean;
  pendingEmail: string | null;
  onOtpVerified: () => void;
  onOtpCancel: () => void;
}

export function LoginView({
  onLogin,
  onQuickLogin,
  onForgotPassword,
  showDevBypass,
  pendingEmail,
  onOtpVerified,
  onOtpCancel,
}: LoginViewProps) {
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
    if (value === MOCK_OTP_CODE) {
      onOtpVerified();
      return;
    }
    const next = otpAttempts + 1;
    setOtpAttempts(next);
    setOtpError(
      next >= MAX_OTP_ATTEMPTS
        ? '시도 횟수를 초과했습니다. 관리자에게 문의하세요.'
        : `인증 코드가 올바르지 않습니다. (${next}/${MAX_OTP_ATTEMPTS})`,
    );
    setOtpCode('');
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

  return (
    <>
      <section className="login-showcase" aria-hidden="true">
        <div className="showcase-kicker">Fieldstack Control</div>
        <h1 className="showcase-title">Organize your workspace with confidence.</h1>
        <p className="showcase-copy">
          Secure access for local-first productivity modules with one consistent sign-in experience.
        </p>
        <ul className="showcase-points">
          <li>Session-aware routing and fast state recovery</li>
          <li>Role-aware access control for admin views</li>
          <li>Built for self-hosted, privacy-first operations</li>
        </ul>
      </section>

      <section className="panel login-panel" aria-label={step === 'otp' ? '2단계 인증' : '로그인'}>
        <div className="login-top-label" aria-hidden="true">
          <div className="login-top-line" />
          <p className="login-top-text">{step === 'otp' ? '2FA OTP' : 'Sign in'}</p>
        </div>

        {showDevBypass ? (
          <span className="login-dev-badge login-dev-badge-top">DEV BYPASS</span>
        ) : null}

        {step === 'credentials' ? (
          <div className="login-panel-body">
            <div className="login-panel-head">
              <h2 className="title">Welcome back</h2>
              <p className="subtitle">Use your workspace account to continue to the control plane.</p>
            </div>
            <form className="stack login-form" onSubmit={onLogin}>
              <FormField label="Email address" htmlFor="login-email">
                <Input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="owner@fieldstack.dev"
                  autoComplete="email"
                  required
                />
              </FormField>
              <FormField label="Password" htmlFor="login-password">
                <Input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </FormField>
              <div className="login-row">
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  label="Remember me"
                />
                <Button variant="ghost" type="button" onClick={onForgotPassword}>
                  Forgot password?
                </Button>
              </div>
              <div className="actions login-actions">
                <Button variant="primary" block type="submit">
                  Sign in
                </Button>
                {showDevBypass ? (
                  <Button block type="button" onClick={onQuickLogin}>
                    Bypass login
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        ) : (
          <div className="login-panel-body">
            <div className="login-otp-head">
              <span className="login-otp-icon" aria-hidden="true">
                🔐
              </span>
              <h2 className="title">2단계 인증</h2>
              <p className="subtitle">
                <strong>{pendingEmail}</strong> 계정에 연결된
                <br />
                인증 앱의 6자리 코드를 입력하세요.
              </p>
            </div>
            <form className="stack login-otp-form" onSubmit={handleOtpSubmit} noValidate>
              <OtpInput
                length={6}
                value={otpCode}
                onChange={handleOtpChange}
                error={otpError || undefined}
                disabled={otpLocked}
              />
              {!otpLocked && (
                <Button variant="primary" block type="submit" disabled={otpCode.length < 6}>
                  인증 확인
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
                    {resendCooldown > 0 ? `재전송 (${resendCooldown}s)` : '코드 재전송'}
                  </Button>
                )}
                <Button variant="ghost" type="button" onClick={onOtpCancel}>
                  로그인으로 돌아가기
                </Button>
              </div>
            </form>
          </div>
        )}
      </section>
    </>
  );
}
