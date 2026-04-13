import { useState, type FormEvent } from "react";

import { Button, Checkbox, FormField, Input } from "@fieldstack/controls";

interface LoginViewProps {
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onQuickLogin: () => void;
  onForgotPassword: () => void;
  showDevBypass: boolean;
}

export function LoginView({ onLogin, onQuickLogin, onForgotPassword, showDevBypass }: LoginViewProps) {
  const [remember, setRemember] = useState(false);

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

      <section className="panel login-panel" aria-labelledby="login-title">
        <div className="login-top-label" aria-hidden="true">
          <div className="login-top-line" />
          <p className="login-top-text">Sign in</p>
        </div>
        {showDevBypass ? <span className="login-dev-badge login-dev-badge-top">DEV BYPASS</span> : null}
        <div className="login-panel-body">
          <div className="login-panel-head">
            <h2 className="title" id="login-title">
              Welcome back
            </h2>
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
              <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} label="Remember me" />
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
      </section>
    </>
  );
}
