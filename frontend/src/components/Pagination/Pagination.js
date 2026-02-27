import React from 'react';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange, 
  onItemsPerPageChange 
}) => {
  const itemsPerPageOptions = [5, 10, 25, 50, 100];

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      if (currentPage > 4) {
        pageNumbers.push('...');
      }
      
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pageNumbers.push('...');
      }
      
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageClick = (event, targetPage) => {
    event.preventDefault();
  
    if (event.currentTarget && typeof event.currentTarget.blur === "function") {
      event.currentTarget.blur();
    }
  
    onPageChange(targetPage);
  };

  return (
    <div className="pagination-container">
      {/* Items per page selector */}
      <div className="items-per-page">
        <label htmlFor="itemsPerPage">Show: </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="items-per-page-select"
        >
          {itemsPerPageOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span> per page</span>
      </div>

      {/* Pagination info */}
      <div className="pagination-info">
        {totalItems > 0 ? (
          <>Showing {startItem} to {endItem} of {totalItems} tickets</>
        ) : (
          <>No tickets found</>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => handlePageClick(e, currentPage - 1)}
            disabled={!hasPreviousPage}
            className="pagination-btn pagination-nav"
            title="Previous page"
          >
            ← Previous
          </button>

          {pageNumbers.map((number, index) => (
            number === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                type="button"
                key={number}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => handlePageClick(e, number)}
                className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            )
          ))}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => handlePageClick(e, currentPage + 1)}
            disabled={!hasNextPage}
            className="pagination-btn pagination-nav"
            title="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;