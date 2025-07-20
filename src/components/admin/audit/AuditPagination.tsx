import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

interface AuditPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Custom pagination component for the AdminAudit page
 * Uses the base Pagination components but adds specific logic for audit logs
 */
export const AuditPagination: React.FC<AuditPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    // Always show at most 5 page numbers
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage <= 3) {
      // Near start: show first 5 pages
      return [1, 2, 3, 4, 5];
    } else if (currentPage >= totalPages - 2) {
      // Near end: show last 5 pages
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    } else {
      // Middle: show current page and 2 pages on each side
      return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    }
  };

  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous page button */}
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        
        {/* First page and ellipsis if needed */}
        {currentPage > 3 && totalPages > 5 && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </>
        )}
        
        {/* Page numbers */}
        {getPageNumbers().map(pageNum => (
          <PaginationItem key={pageNum}>
            <PaginationLink 
              isActive={pageNum === currentPage}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </PaginationLink>
          </PaginationItem>
        ))}
        
        {/* Last page and ellipsis if needed */}
        {currentPage < totalPages - 2 && totalPages > 5 && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(totalPages)}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        
        {/* Next page button */}
        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
