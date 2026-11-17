'use client';

import { useCallback, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/** Use in `closest()` so table click-outside logic ignores the portaled menu. */
export const ROW_ACTIONS_PORTAL_SELECTOR = '[data-dashboard-row-actions-portal]';

type Props = {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
};

function applyMenuPosition(trigger: HTMLElement, menu: HTMLElement) {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const menuHeight = menu.offsetHeight || 88;
  const menuWidth = menu.offsetWidth || 130;

  let top = rect.top - menuHeight - gap;
  if (top < 8) {
    top = rect.bottom + gap;
  }
  let left = rect.right - menuWidth;
  if (left < 8) left = 8;
  const maxLeft = window.innerWidth - menuWidth - 8;
  if (left > maxLeft) left = Math.max(8, maxLeft);

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

export default function RowActionsFloatingMenu({ open, triggerRef, children }: Props) {
  const menuElRef = useRef<HTMLDivElement | null>(null);

  const menuRef = useCallback(
    (node: HTMLDivElement | null) => {
      menuElRef.current = node;
      const trigger = triggerRef.current;
      if (node && open && trigger) {
        applyMenuPosition(trigger, node);
      }
    },
    [open, triggerRef],
  );

  useLayoutEffect(() => {
    if (!open) return;
    const menu = menuElRef.current;
    if (!menu) return;

    function update() {
      const trigger = triggerRef.current;
      const el = menuElRef.current;
      if (!trigger || !el) return;
      applyMenuPosition(trigger, el);
    }

    update();
    const ro = new ResizeObserver(update);
    ro.observe(menu);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, triggerRef, children]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      data-dashboard-row-actions-portal=""
      role="menu"
      className="fixed z-200 min-w-[130px] rounded-xl border border-[#e5e7eb] bg-white p-1.5 shadow-lg"
    >
      {children}
    </div>,
    document.body,
  );
}
