export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ─── Password Policy ──────────────────────────────────────────
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 20,
} as const;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 비밀번호 정책 검사 — 상세 오류 목록 반환
 * 조건: 12~20자, 영어 대문자, 소문자, 숫자, 특수문자 각 1자 이상 포함
 *
 * 이메일 인증은 lazy 방식으로 처리 (비밀번호 복구 시점에만 검증).
 * 계정 생성/변경 시에는 이 함수로만 비밀번호 유효성을 검사한다.
 */
export function validatePassword(value: string): PasswordValidationResult {
  const errors: string[] = [];

  if (value.length < PASSWORD_POLICY.minLength) {
    errors.push(`최소 ${PASSWORD_POLICY.minLength}자 이상이어야 합니다.`);
  }
  if (value.length > PASSWORD_POLICY.maxLength) {
    errors.push(`최대 ${PASSWORD_POLICY.maxLength}자 이하여야 합니다.`);
  }
  if (!/[a-z]/.test(value)) {
    errors.push("영어 소문자를 포함해야 합니다.");
  }
  if (!/[A-Z]/.test(value)) {
    errors.push("영어 대문자를 포함해야 합니다.");
  }
  if (!/\d/.test(value)) {
    errors.push("숫자를 포함해야 합니다.");
  }
  if (!/[^a-zA-Z0-9]/.test(value)) {
    errors.push("특수문자를 포함해야 합니다.");
  }

  return { valid: errors.length === 0, errors };
}

/** 단순 boolean 체크 — validatePassword 기반 */
export function isStrongPassword(value: string): boolean {
  return validatePassword(value).valid;
}
