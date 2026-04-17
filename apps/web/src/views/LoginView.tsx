import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, Checkbox, FormField, Input, OtpInput } from '@fieldstack/controls';

const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 30;
const MAX_LOGIN_ATTEMPTS = 5;

// ── 인증 실패 메시지 규칙 ─────────────────────────────────────
// 계정 존재 여부를 노출하지 않는다. 이메일/비밀번호 구분 없이 동일 메시지.
const MSG = {
  invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
  tooManyAttempts: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도하세요.',
  sessionExpired: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  attemptsWarning: (n: number) => `로그인 시도 ${n}/${MAX_LOGIN_ATTEMPTS} — 초과 시 일시 잠금됩니다.`,
} as const;

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

        {step === 'credentials' ? (
          <div className="login-panel-body">
            <div className="login-panel-head">
              <h2 className="title">Welcome back</h2>
              <p className="subtitle">Use your workspace account to continue to the control plane.</p>
            </div>

            {/* 잠금 알림 */}
            {isLocked && (
              <Alert variant="error" className="login-alert">
                {MSG.tooManyAttempts}
              </Alert>
            )}

            <form className="stack login-form" onSubmit={onLogin} noValidate>
              <FormField label="Email address" htmlFor="login-email">
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
              <FormField label="Password" htmlFor="login-password">
                <Input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isLocked}
                />
              </FormField>
              <div className="login-row">
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  label="Remember me"
                  disabled={isLocked}
                />
                <Button variant="ghost" type="button" onClick={onForgotPassword}>
                  Forgot password?
                </Button>
              </div>
              <div className="actions login-actions">
                <Button variant="primary" block type="submit" disabled={isLocked}>
                  Sign in
                </Button>
                {sessionExpired && (
                  <p className="login-inline-warn" role="status">{MSG.sessionExpired}</p>
                )}
                {!isLocked && loginError && (
                  <p className="login-inline-error" role="alert">{loginError}</p>
                )}
                {showAttemptsWarning && (
                  <p className="login-inline-warn">{MSG.attemptsWarning(loginAttempts)}</p>
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
                error={otpApiError || otpError || undefined}
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
