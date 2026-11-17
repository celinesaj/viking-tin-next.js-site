import type { MarqueeItem } from '@/types/marquee';

function readString(o: Record<string, unknown>, snake: string, camel: string): string {
  const s = o[snake];
  const c = o[camel];
  if (typeof s === 'string') return s;
  if (typeof c === 'string') return c;
  return '';
}

function readBoolean(o: Record<string, unknown>, snake: string, camel: string): boolean {
  const s = o[snake];
  const c = o[camel];
  if (typeof s === 'boolean') return s;
  if (typeof c === 'boolean') return c;
  return false;
}

export function mapMarqueeItem(raw: unknown): MarqueeItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === 'string'
      ? o.id
      : typeof o._id === 'string'
        ? o._id
        : '';
  if (!id) return null;

  return {
    id,
    text: readString(o, 'text', 'text'),
    isActive: readBoolean(o, 'is_active', 'isActive'),
    createdAt: readString(o, 'created_at', 'createdAt'),
    updatedAt: readString(o, 'updated_at', 'updatedAt'),
  };
}

export function mapMarqueeListResponse(response: unknown): MarqueeItem[] {
  if (Array.isArray(response)) {
    return response.map(mapMarqueeItem).filter((item): item is MarqueeItem => item !== null);
  }
  if (response && typeof response === 'object') {
    const data = (response as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data.map(mapMarqueeItem).filter((item): item is MarqueeItem => item !== null);
    }
  }
  return [];
}
