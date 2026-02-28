import type { FormEvent } from "react";

interface LoginViewProps {
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onQuickLogin: () => void;
  showDevBypass: boolean;
}

export function LoginView({ onLogin, onQuickLogin, showDevBypass }: LoginViewProps) {
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
          <label className="field">
            <span>Email address</span>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="owner@fieldstack.dev"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
          <div className="login-row">
            <label className="remember">
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <a className="text-link" href="#login">
              Forgot password?
            </a>
          </div>
          <div className="actions login-actions">
            <button className="button button-primary button-block" type="submit">
              Sign in
            </button>
            {showDevBypass ? (
              <button className="button button-block" type="button" onClick={onQuickLogin}>
                Bypass login
              </button>
            ) : null}
          </div>
        </form>
        </div>
      </section>
    </>
  );
}
