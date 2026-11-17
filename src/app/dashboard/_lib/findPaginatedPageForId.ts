type PaginatedChunk<T extends { id: string }> = {
  data: T[];
  totalPages: number;
};

/**
 * Walks paginated list API pages until `rowId` is found (or pages exhausted).
 * Used when opening a row from global search (`?highlight=`).
 */
export async function findPaginatedPageForId<T extends { id: string }>(
  rowId: string,
  fetchPage: (page: number) => Promise<PaginatedChunk<T>>,
  options?: { maxPages?: number },
): Promise<number | null> {
  const maxPages = options?.maxPages ?? 80;
  let page = 1;
  while (page <= maxPages) {
    const chunk = await fetchPage(page);
    if (chunk.data.some((r) => r.id === rowId)) {
      return page;
    }
    if (page >= chunk.totalPages) break;
    page += 1;
  }
  return null;
}
