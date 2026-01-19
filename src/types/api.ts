/**
 * Generic API response type for consistent response handling
 * Note: The actual API returns Data with capital D
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  Data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response type
 */
export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T> {
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
