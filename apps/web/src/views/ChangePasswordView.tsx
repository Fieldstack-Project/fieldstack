import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { PASSWORD_POLICY, validatePassword } from "@fieldstack/core/browser";

import { apiCall } from "../lib/apiFetch";

import { Alert, Button, FormField, Input } from "@fieldstack/controls";

import "../styles/change-password.css";

interface ChangePasswordViewProps {
  isFirstLogin: boolean;
  onChanged: () => void;
}

interface FieldState {
  value: string;
  touched: boolean;
}

export function ChangePasswordView({ isFirstLogin, onChanged }: ChangePasswordViewProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<FieldState>({ value: "", touched: false });
  const [next, setNext] = useState<FieldState>({ value: "", touched: false });
  const [confirm, setConfirm] = useState<FieldState>({ value: "", touched: false });
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  const nextValidation = validatePassword(next.value);
  const confirmMismatch = confirm.value !== next.value;

  const showCurrentError = (current.touched || submitted) && current.value.length === 0;
  const showConfirmError = (confirm.touched || submitted) && confirmMismatch;

  const canSubmit = current.value.length > 0 && nextValidation.valid && !confirmMismatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    setApiError("");
    try {
      await apiCall("/auth/password/change", {
        method: "POST",
        body: JSON.stringify({ newPassword: next.value }),
      });
      onChanged();
    } catch {
      setApiError(t('changePassword.serverError'));
    }
  };

  return (
    <main className="cpw-shell">
      <section className="panel cpw-panel" aria-labelledby="cpw-title">
        <div className="cpw-header">
          <span className="cpw-icon" aria-hidden="true">🔑</span>
          <h1 className="cpw-title" id="cpw-title">
            {isFirstLogin ? t('changePassword.titleFirst') : t('changePassword.titleChange')}
          </h1>
          <p className="cpw-desc">
            {isFirstLogin ? t('changePassword.descFirst') : t('changePassword.descChange')}
          </p>
        </div>

        {apiError && <Alert variant="error">{apiError}</Alert>}

        <form className="stack cpw-form" onSubmit={handleSubmit} noValidate>
          <FormField
            label={isFirstLogin ? t('changePassword.tempPassword') : t('changePassword.currentPassword')}
            htmlFor="cpw-current"
            error={showCurrentError ? t('changePassword.required') : undefined}
          >
            <Input
              id="cpw-current"
              type="password"
              autoComplete="current-password"
              value={current.value}
              onChange={(e) => setCurrent({ value: e.target.value, touched: true })}
              placeholder="••••••••"
            />
          </FormField>

          <FormField label={t('changePassword.newPassword')} htmlFor="cpw-next">
            <Input
              id="cpw-next"
              type="password"
              autoComplete="new-password"
              value={next.value}
              onChange={(e) => setNext({ value: e.target.value, touched: true })}
              placeholder="••••••••"
              aria-describedby="cpw-policy"
            />
          </FormField>

          <ul className="cpw-policy" id="cpw-policy" aria-label={t('changePassword.policy.label')}>
            <PolicyItem
              met={next.value.length >= PASSWORD_POLICY.minLength && next.value.length <= PASSWORD_POLICY.maxLength}
              active={next.touched || submitted}
              label={t('changePassword.policy.length', { min: PASSWORD_POLICY.minLength, max: PASSWORD_POLICY.maxLength })}
            />
            <PolicyItem met={/[A-Z]/.test(next.value)} active={next.touched || submitted} label={t('changePassword.policy.uppercase')} />
            <PolicyItem met={/[a-z]/.test(next.value)} active={next.touched || submitted} label={t('changePassword.policy.lowercase')} />
            <PolicyItem met={/\d/.test(next.value)} active={next.touched || submitted} label={t('changePassword.policy.number')} />
            <PolicyItem
              met={/[^a-zA-Z0-9]/.test(next.value)}
              active={next.touched || submitted}
              label={t('changePassword.policy.special')}
            />
          </ul>

          <FormField
            label={t('changePassword.confirmPassword')}
            htmlFor="cpw-confirm"
            error={showConfirmError ? t('changePassword.mismatch') : undefined}
          >
            <Input
              id="cpw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm.value}
              onChange={(e) => setConfirm({ value: e.target.value, touched: true })}
              placeholder="••••••••"
            />
          </FormField>

          <Button variant="primary" block type="submit">
            {t('changePassword.changeButton')}
          </Button>
        </form>
      </section>
    </main>
  );
}

function PolicyItem({ met, active, label }: { met: boolean; active: boolean; label: string }) {
  const state = !active ? "idle" : met ? "ok" : "fail";
  return (
    <li className={`cpw-policy-item cpw-policy-${state}`} aria-live="polite">
      <span className="cpw-policy-dot" aria-hidden="true" />
      {label}
    </li>
  );
}
