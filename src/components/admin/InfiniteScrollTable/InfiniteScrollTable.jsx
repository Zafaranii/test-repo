import React from 'react';
import { useInfiniteScroll } from '../../../hooks/usePagination';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import './InfiniteScrollTable.css';

const InfiniteScrollTable = ({
  data = [],
  columns = [],
  renderRow,
  itemsPerPage = 10,
  emptyMessage = "No data available",
  loadingMessage = "",
  className = "",
  dependencies = {}
}) => {
  const {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    totalItems,
    displayedCount,
    progress
  } = useInfiniteScroll(data, itemsPerPage, dependencies);

  if (data.length === 0) {
    return (
      <div className={`infinite-scroll-table empty ${className}`}>
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`infinite-scroll-table ${className}`}>
      {/* Progress indicator */}
      {totalItems > itemsPerPage && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          <span className="progress-text">
            Showing {displayedCount} of {totalItems} items
          </span>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={column.className || ''}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((item, index) => (
              <tr key={item.id || index} className="table-row">
                {renderRow(item, index)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-more">
          <LoadingSpinner size="small" />
          <span>{loadingMessage}</span>
        </div>
      )}

      {/* Load more button (fallback for slow scroll) */}
      {hasMore && !isLoading && (
        <div className="load-more-container">
          <button onClick={loadMore} className="load-more-btn">
            Load More ({totalItems - displayedCount} remaining)
          </button>
        </div>
      )}

      {/* End message */}
      {!hasMore && displayedCount > 0 && (
        <div className="end-message">
          <p>All {totalItems} items loaded</p>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollTable;