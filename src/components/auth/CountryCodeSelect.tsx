'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type CountryCodeOption = {
  code: string;
  label: string;
};

const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+971', label: 'AE (+971)' },
];

type CountryCodeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function CountryCodeSelect({
  value,
  onChange,
  error,
}: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = COUNTRY_CODES.find(opt => opt.code === value) || COUNTRY_CODES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-[140px] sm:w-[160px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[58px] w-full rounded-[18px] border bg-transparent px-4 text-left text-[15px] outline-none flex items-center justify-between md:h-[64px] ${error ? 'border-red-500' : 'border-black/60'}`}
      >
        <span>{selectedOption.code}</span>
        <ChevronDown size={18} className={`text-black/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-black/20 bg-white shadow-lg">
          {COUNTRY_CODES.map((option) => (
            <button
              key={option.code}
              type="button"
              className="w-full px-4 py-2 text-left text-[15px] hover:bg-gray-100 focus:bg-gray-100"
              onClick={() => {
                onChange(option.code);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}