/** Safe label for cart line `type` (hydrated localStorage may omit it). */
export function formatCartLineTypeLabel(type: unknown): string {
  if (type == null || type === '') return 'item';
  return String(type).replace(/_/g, ' ');
}
