'use client';

import { ArrowUpRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  

  const getPages = (): Array<number | string> => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages - 1, totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage, '...', totalPages];
  };

  const pages = getPages();

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div
      className={`mt-12 flex items-center justify-between gap-6 ${className}`}
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="inline-flex h-[44px] items-center gap-3 rounded-full bg-black px-4 text-base font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span>Previous</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-bold text-black">
          <ArrowUpRight className="h-3.5 w-3.5 rotate-180" />
        </span>
      </button>

      <div className="flex items-center gap-4">
        {pages.map((page, index) =>
          page === '...' ? (
            <span
              key={`dots-${index}`}
              className="text-[18px] font-medium text-bold/45"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page as number)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-[18px] font-medium transition ${
                currentPage === page
                  ? 'bg-[#ececec] text-bold'
                  : 'text-bold/55 hover:text-bold'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="inline-flex h-[44px] items-center gap-3 rounded-full bg-black px-4 text-base font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span>Next</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-bold text-black">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}