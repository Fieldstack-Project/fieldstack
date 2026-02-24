export function formatIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
