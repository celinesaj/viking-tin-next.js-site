'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const HIGHLIGHT_ROW_CLASS = 'rounded-lg bg-sky-50/70 ring-2 ring-inset ring-sky-400/60';

export function useDashboardTableHighlight(rowOnPage: boolean) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!highlightId || !rowOnPage) return;
    const id = requestAnimationFrame(() => {
      highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [highlightId, rowOnPage]);

  function rowHighlightClass(id: string) {
    return highlightId === id ? HIGHLIGHT_ROW_CLASS : '';
  }

  return { highlightId, highlightRef, rowHighlightClass };
}
