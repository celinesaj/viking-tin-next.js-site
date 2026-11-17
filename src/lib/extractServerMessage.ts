/** Parse RTK Query / fetch errors into a user-visible message. */
export function extractServerMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (!error || typeof error !== 'object') return fallbackMessage;

  const err = error as Record<string, unknown>;

  if (typeof err.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }

  if ('status' in err) {
    const status = err.status;
    if (status === 'FETCH_ERROR' || status === 'PARSING_ERROR' || status === 'TIMEOUT_ERROR') {
      const net = typeof err.error === 'string' ? err.error.trim() : '';
      if (net) return `${net} [${String(status)}]`;
    }

    const data = err.data;
    if (typeof data === 'string' && data.trim()) {
      const t = data.trim();
      return t.length > 500 ? `${t.slice(0, 500)}…` : t;
    }

    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      const message = o.message;
      if (typeof message === 'string' && message.trim()) return message.trim();
      if (Array.isArray(message)) {
        const list = message.filter(
          (item): item is string => typeof item === 'string' && item.trim() !== '',
        );
        if (list.length > 0) return list.join('; ');
      }
      const errorText = o.error;
      if (typeof errorText === 'string' && errorText.trim()) return errorText.trim();
      if (typeof status === 'number' && Object.keys(o).length === 0) {
        return `Request failed (HTTP ${status}).`;
      }
    }

    if (typeof status === 'number') {
      return `Request failed (HTTP ${status}).`;
    }
  }

  if ('data' in err) {
    const data = err.data;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const list = message.filter((item): item is string => typeof item === 'string');
        if (list.length > 0) return list.join(', ');
      }
      const errorText = (data as { error?: unknown }).error;
      if (typeof errorText === 'string' && errorText.trim()) return errorText;
    }
  }

  if (typeof err.error === 'string' && err.error.trim()) return err.error.trim();

  return fallbackMessage;
}

/** DELETE endpoints often return 204/200 with an empty body; default JSON parse fails. */
export async function readEmptySafeJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
