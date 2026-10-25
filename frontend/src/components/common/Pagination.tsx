import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem =
    totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-sm text-charcoal-600 ${className}`}
    >
      {totalItems !== undefined && startItem && endItem ? (
        <div className="text-xs text-charcoal-500">
          Showing <span className="font-semibold text-charcoal-800">{startItem}</span> to{' '}
          <span className="font-semibold text-charcoal-800">{endItem}</span> of{' '}
          <span className="font-semibold text-charcoal-800">{totalItems}</span> results
        </div>
      ) : (
        <div className="text-xs text-charcoal-500">
          Page <span className="font-semibold text-charcoal-800">{currentPage}</span> of{' '}
          <span className="font-semibold text-charcoal-800">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            if (totalPages <= 5) return true;
            if (page === 1 || page === totalPages) return true;
            return Math.abs(page - currentPage) <= 1;
          })
          .map((page, index, array) => {
            const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;

            return (
              <React.Fragment key={page}>
                {showEllipsisBefore && (
                  <span className="px-2 text-charcoal-400 select-none">...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary-600 text-white font-semibold shadow-subtle'
                      : 'text-charcoal-700 hover:bg-neutral-100'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
