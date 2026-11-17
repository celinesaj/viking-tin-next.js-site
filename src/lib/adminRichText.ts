/**
 * Heuristic: admin-saved copy may include simple HTML (e.g. <a> from the dashboard).
 * Not a security boundary — use only for trusted admin content.
 */
export function stringLooksLikeSimpleHtml(s: string) {
  return /<\/?[a-z][\s\S]*?>/i.test((s ?? '').trim());
}

export function plainTextFromHtml(html: string) {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}
