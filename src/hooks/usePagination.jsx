import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for infinite scroll pagination
 * @param {Array} items - The full array of items to paginate
 * @param {number} itemsPerPage - Number of items to load per page
 * @param {Object} dependencies - Dependencies that should reset pagination
 */
export const useInfiniteScroll = (items = [], itemsPerPage = 10, dependencies = {}) => {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef();

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Initialize or reset pagination when items or dependencies change
  useEffect(() => {
    if (items.length === 0) {
      setDisplayedItems([]);
      setCurrentPage(1);
      setHasMore(false);
      return;
    }

    // Load first page
    const firstPage = items.slice(0, itemsPerPage);
    setDisplayedItems(firstPage);
    setCurrentPage(1);
    setHasMore(items.length > itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, itemsPerPage, ...Object.values(dependencies)]);

  // Load more items function
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate API loading delay
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newItems = items.slice(startIndex, endIndex);
      
      if (newItems.length > 0) {
        setDisplayedItems(prev => [...prev, ...newItems]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < items.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoading(false);
    }, 300); // Small delay for better UX
  }, [items, currentPage, itemsPerPage, hasMore, isLoading]);

  // Update loadMoreRef to always have the latest function
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      
      // Trigger load more when 200px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMoreRef.current?.();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manual load more for button-based pagination
  const handleLoadMore = () => {
    loadMore();
  };

  // Reset pagination
  const resetPagination = useCallback(() => {
    if (items.length === 0) {
      setDisplayedItems([]);
    } else {
      const firstPage = items.slice(0, itemsPerPage);
      setDisplayedItems(firstPage);
    }
    setCurrentPage(1);
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  // Jump to specific page
  const goToPage = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    
    const endIndex = page * itemsPerPage;
    const pageItems = items.slice(0, endIndex);
    setDisplayedItems(pageItems);
    setCurrentPage(page);
    setHasMore(endIndex < items.length);
  }, [items, itemsPerPage, totalPages]);

  return {
    // Data
    displayedItems,
    hasMore,
    isLoading,
    currentPage,
    totalPages,
    totalItems: items.length,
    displayedCount: displayedItems.length,
    
    // Actions
    loadMore: handleLoadMore,
    resetPagination,
    goToPage,
    
    // Status
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages || !hasMore,
    progress: items.length > 0 ? (displayedItems.length / items.length) * 100 : 0
  };
};

/**
 * Simple pagination hook for traditional page-based navigation
 * @param {Array} items - The full array of items to paginate
 * @param {number} itemsPerPage - Number of items per page
 */
export const usePagination = (items = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems: items.length,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage,
    prevPage,
    goToPage,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  };
};

export default useInfiniteScroll;