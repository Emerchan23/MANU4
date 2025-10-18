import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[] | undefined;
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  itemsPerPage: number;
  totalItems: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  setItemsPerPage: (items: number) => void;
}

export function usePagination<T>(
  dataOrProps: T[] | undefined | UsePaginationProps<T>,
  itemsPerPageParam: number = 10
): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(
    Array.isArray(dataOrProps) ? itemsPerPageParam : dataOrProps?.itemsPerPage || itemsPerPageParam
  );

  // Handle both old and new API formats
  const data = Array.isArray(dataOrProps) ? dataOrProps : dataOrProps?.data;

  const totalItems = data?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  // Reset para página 1 quando os dados mudarem
  useMemo(() => {
    setCurrentPage(1);
  }, [data?.length]);

  const setItemsPerPage = (items: number) => {
    setItemsPerPageState(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    itemsPerPage,
    totalItems,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    setItemsPerPage
  };
}

export default usePagination;