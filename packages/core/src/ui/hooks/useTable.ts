export interface TableColumn<TItem> {
  id: string;
  header: string;
  accessor: (item: TItem) => string | number | boolean | null;
}

export interface UseTableOptions<TItem> {
  rows: TItem[];
  pageSize?: number;
}

export interface UseTableState<TItem> {
  page: number;
  totalPages: number;
  visibleRows: TItem[];
  nextPage: () => void;
  previousPage: () => void;
  setPage: (page: number) => void;
}
