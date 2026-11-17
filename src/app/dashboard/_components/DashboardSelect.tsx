'use client';

import { ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type DashboardSelectOption = {
  value: string;
  label: string;
};

type Props = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  options: DashboardSelectOption[];
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
  /** `compact` = shorter control for toolbar filters */
  size?: 'default' | 'compact';
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
};

export default function DashboardSelect({
  id: idProp,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  hasError = false,
  size = 'default',
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
}: Props) {
  const autoId = useId();
  const buttonId = idProp ?? `dashboard-select-${autoId}`;
  const listboxId = `${buttonId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const displayLabel = selectedOption?.label ?? placeholder;

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 6;
    const maxH = 240;
    const edgePad = 12;
    const spaceBelow = window.innerHeight - rect.bottom - gap - edgePad;
    const spaceAbove = rect.top - gap - edgePad;
    /** Open above the control when the drawer footer (or viewport) leaves little room below. */
    const openUpward = spaceBelow < 168 && spaceAbove > spaceBelow && spaceAbove >= 100;
    const zIndex = 10050;

    if (openUpward) {
      const maxHeight = Math.min(maxH, Math.max(120, spaceAbove));
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: 'auto',
        bottom: window.innerHeight - rect.top + gap,
        maxHeight,
        zIndex,
      });
    } else {
      const maxHeight = Math.min(maxH, Math.max(120, spaceBelow));
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        bottom: 'auto',
        maxHeight,
        zIndex,
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    const scrollRoot = rootRef.current?.closest('[data-dashboard-drawer-scroll]');
    if (scrollRoot instanceof HTMLElement) {
      scrollRoot.addEventListener('scroll', updatePosition, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      if (scrollRoot instanceof HTMLElement) {
        scrollRoot.removeEventListener('scroll', updatePosition);
      }
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const borderClass = hasError ? 'border-red-500' : 'border-[#dbe1ea]';
  const isCompact = size === 'compact';
  const btnH = isCompact ? 'h-9' : 'h-11';
  const btnRound = isCompact ? 'rounded-lg' : 'rounded-xl';
  const chevronSize = isCompact ? 16 : 18;
  const listRound = isCompact ? 'rounded-lg' : 'rounded-xl';

  const listContent = open ? (
    <ul
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-labelledby={buttonId}
      data-dashboard-select-menu=""
      style={menuStyle}
      className={`overflow-y-auto overscroll-contain border border-[#e5e7eb] bg-white py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] ${listRound}`}
    >
      {options.map((opt) => {
        const selected = String(value) === String(opt.value);
        return (
          <li
            key={opt.value === '' ? '__empty__' : opt.value}
            role="option"
            aria-selected={selected}
            className={`cursor-pointer px-3 py-2.5 text-sm text-[#111111] transition-colors hover:bg-[#f3f4f6] ${
              selected ? 'bg-[#eef2f7] font-medium' : ''
            }`}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
          >
            {opt.label}
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-required={ariaRequired}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex ${btnH} w-full items-center justify-between gap-2 ${btnRound} border bg-white px-3 text-left text-sm transition-shadow focus:outline-none focus:ring-1 focus:ring-[#111111] ${borderClass} ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#c5cdd8]'
        } ${open ? 'ring-1 ring-[#111111]' : ''}`}
      >
        <span className={selectedOption ? 'truncate text-[#111111]' : 'truncate text-[#9ca3af]'}>
          {displayLabel}
        </span>
        <ChevronDown
          size={chevronSize}
          className={`shrink-0 text-[#6b7280] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {typeof document !== 'undefined' && listContent
        ? createPortal(listContent, document.body)
        : null}
    </div>
  );
}
