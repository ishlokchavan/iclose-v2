/** Stable slug for a developer name — matches the web's slugifyDeveloper. */
export function slugifyDeveloper(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
