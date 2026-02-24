function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}

export function maskSecret(value: string, visibleSuffix = 4): string {
  if (value.length <= visibleSuffix) {
    return "*".repeat(value.length);
  }

  const maskedLength = value.length - visibleSuffix;
  return `${"*".repeat(maskedLength)}${value.slice(-visibleSuffix)}`;
}
