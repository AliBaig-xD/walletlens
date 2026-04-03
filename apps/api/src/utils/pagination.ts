export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export function buildPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMetadata {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> {
  return { data, pagination: buildPagination(page, limit, total) };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function validatePaginationParams(
  page: number = 1,
  limit: number = 20,
  maxLimit: number = 100,
): { page: number; limit: number } {
  const safePage = Number.isFinite(page) ? page : 1;
  const safeLimit = Number.isFinite(limit) ? limit : 20;
  return {
    page: Math.max(1, Math.floor(safePage)),
    limit: Math.min(maxLimit, Math.max(1, Math.floor(safeLimit))),
  };
}
