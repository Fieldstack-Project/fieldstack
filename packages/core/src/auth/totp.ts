const DEFAULT_SECRET_LENGTH = 32;

export function generateTotpSecret(length = DEFAULT_SECRET_LENGTH): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";

  for (let index = 0; index < length; index += 1) {
    const offset = Math.floor(Math.random() * alphabet.length);
    secret += alphabet[offset];
  }

  return secret;
}

export function normalizeTotpCode(code: string): string {
  return code.replace(/\s+/g, "").trim();
}

export function isValidTotpCodeFormat(code: string): boolean {
  return /^\d{6}$/.test(normalizeTotpCode(code));
}
