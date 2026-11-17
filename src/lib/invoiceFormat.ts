export function formatInvoiceCurrency(
  value: number,
  currencySymbol = '$'
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(2)}${currencySymbol}`;
}

export function formatInvoiceDate(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(value.getTime())) return '';

  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}