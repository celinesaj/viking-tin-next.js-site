import type { StrengthLevel } from '@/types/strength-lvl';

/** Map API `nicotine_mg` / `nicotineMg` into a single `nicotineMg` field. */
export function normalizeStrengthLevelRow(
  row: StrengthLevel & { nicotine_mg?: number | string | null },
): StrengthLevel {
  const raw = row.nicotineMg ?? row.nicotine_mg;
  let nicotineMg: number | null = null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    nicotineMg = raw;
  } else if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    nicotineMg = Number.isFinite(n) ? n : null;
  }
  return { ...row, id: String(row.id), nicotineMg };
}
