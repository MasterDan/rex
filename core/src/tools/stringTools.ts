export function isNullOrWhiteSpace(str: string | null): str is null {
  return str == null || str.trim() === '';
}
