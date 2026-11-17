export function utcYearNow(): number {
  return new Date().getUTCFullYear();
}

export function utcMonth1to12Now(): number {
  return new Date().getUTCMonth() + 1;
}

export function parseInitialYear(from?: string, explicit?: number): number {
  if (
    explicit !== undefined &&
    Number.isFinite(explicit) &&
    explicit >= 2000 &&
    explicit <= 2100
  ) {
    return explicit;
  }
  if (from && /^\d{4}/.test(from)) {
    const y = Number(from.slice(0, 4));
    if (Number.isFinite(y) && y >= 2000 && y <= 2100) return y;
  }
  return utcYearNow();
}

/** 1–12 month index for UI; defaults current month when year is current. */
export function parseInitialMonth1to12(year: number, from?: string, explicit?: number): number {
  if (explicit !== undefined && Number.isFinite(explicit)) {
    const m = Math.floor(explicit);
    if (m >= 1 && m <= 12) return m;
  }
  if (from && /^\d{4}-\d{2}/.test(from)) {
    const m = Number(from.slice(5, 7));
    if (Number.isFinite(m) && m >= 1 && m <= 12) return m;
  }
  if (year === utcYearNow()) return utcMonth1to12Now();
  return 1;
}
