export function parseTemplateString(
  template: string,
  values: Record<string, string> | null = null,
): string {
  if (values == null) {
    return template;
  }
  let result = template;
  for (const key in values) {
    result = result.replace(
      new RegExp(`{{\\s*${key}\\s*\\}}`, 'gm'),
      values[key],
    );
  }
  return result;
}

export function getKeysToInsert(template: string): string[] {
  const matches = template.match(/{{(.*?)\}}/gm);
  if (matches == null) {
    return [];
  }
  return matches.map((s) => s.slice(2, -2).trim());
}
