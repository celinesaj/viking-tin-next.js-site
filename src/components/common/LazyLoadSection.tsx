'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface LazyLoadSectionProps {
  children: ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
  placeholder?: ReactNode;
}

export default function LazyLoadSection({
  children,
  rootMargin = '0px 0px 2000px 0px',
  threshold = 0.1,
  placeholder,
}: LazyLoadSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, rootMargin, threshold]);

  return (
    <div ref={ref} className="min-h-[360px]">
      {isVisible ? (
        children
      ) : (
        placeholder ?? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="h-1.5 w-16 animate-pulse rounded-full bg-[#ebebeb]" />
          </div>
        )
      )}
    </div>
  );
}
