export interface TableHeader {
  id: string;
  label: string;
}

export interface TableProps<TItem> {
  headers: TableHeader[];
  rows: TItem[];
}
