import { useState, useMemo, type ReactNode, type ChangeEvent } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc' | null;

export interface TableColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  /** row 객체의 키 (중첩 불가, flat key) */
  key: string;
  /** 헤더에 표시할 레이블 */
  label: string;
  /** 컬럼 너비 (CSS value). 미지정 시 균등 분배 */
  width?: string;
  /** 셀 텍스트 정렬. 기본 left */
  align?: 'left' | 'center' | 'right';
  /** false로 설정하면 정렬 비활성. 기본 true */
  sortable?: boolean;
  /** 셀 커스텀 렌더링. value = row[key], row = 전체 행 */
  render?: (value: unknown, row: T) => ReactNode;
}

export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: TableColumn<T>[];
  rows: T[];
  /** 행 고유 키. string 키 이름 또는 함수. 미지정 시 인덱스 사용 */
  rowKey?: string | ((row: T, index: number) => string);
  /** 페이지 크기 초기값. 기본 20 */
  pageSize?: number;
  /** 검색창 표시 여부. 기본 true */
  searchable?: boolean;
  /** 로딩 중 여부 */
  loading?: boolean;
  /** 빈 상태 메시지 */
  emptyText?: string;
  className?: string;
}

// ─── Page size options ────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function compareValues(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  const aStr = cellText(a).toLowerCase();
  const bStr = cellText(b).toLowerCase();
  const aNum = Number(a);
  const bNum = Number(b);

  let cmp: number;
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    cmp = aNum - bNum;
  } else {
    cmp = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
  }
  return dir === 'asc' ? cmp : -cmp;
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <span className="fs-dt-sort-icon" aria-hidden="true">↑</span>;
  if (dir === 'desc') return <span className="fs-dt-sort-icon" aria-hidden="true">↓</span>;
  return <span className="fs-dt-sort-icon fs-dt-sort-icon-idle" aria-hidden="true">↕</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  pageSize: initialPageSize = 20,
  searchable = true,
  loading = false,
  emptyText = '데이터가 없습니다.',
  className = '',
}: DataTableProps<T>) {
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<SortDir>(null);
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(initialPageSize);

  // ── 검색 필터 ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => cellText(row[col.key]).toLowerCase().includes(q)),
    );
  }, [rows, columns, search]);

  // ── 정렬 ─────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) =>
      compareValues(a[sortKey], b[sortKey], sortDir),
    );
  }, [filtered, sortKey, sortDir]);

  // ── 페이지네이션 ─────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage    = Math.min(page, totalPages);
  const startIdx    = (safePage - 1) * pageSize;
  const paged       = sorted.slice(startIdx, startIdx + pageSize);

  // 검색/정렬 변경 시 1페이지로 이동
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortKey(null);
      setSortDir(null);
    }
    setPage(1);
  };

  const handlePageSize = (e: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  // ── 행 키 ────────────────────────────────────────────────────
  const getRowKey = (row: T, index: number): string => {
    if (!rowKey) return String(index);
    if (typeof rowKey === 'function') return rowKey(row, index);
    return cellText(row[rowKey]) || String(index);
  };

  // ── 빈/로딩 상태 ─────────────────────────────────────────────
  const isEmpty = !loading && paged.length === 0;

  return (
    <div className={`fs-dt ${className}`.trim()}>

      {/* ── 툴바 ──────────────────────────────────────────────── */}
      {searchable && (
        <div className="fs-dt-toolbar">
          <div className="fs-dt-search-wrap">
            <span className="fs-dt-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              className="fs-dt-search"
              placeholder="검색..."
              value={search}
              onChange={handleSearch}
              aria-label="테이블 검색"
            />
          </div>
          <span className="fs-dt-count">
            {loading ? '로딩 중...' : `${sorted.length.toLocaleString()}개`}
          </span>
        </div>
      )}

      {/* ── 테이블 ────────────────────────────────────────────── */}
      <div className="fs-dt-scroll" role="region" aria-label="데이터 테이블">
        <table className="fs-dt-table">
          <thead className="fs-dt-thead">
            <tr>
              {columns.map((col) => {
                const isSorted   = sortKey === col.key;
                const canSort    = col.sortable !== false;
                const dir: SortDir = isSorted ? sortDir : null;
                return (
                  <th
                    key={col.key}
                    className={`fs-dt-th${canSort ? ' fs-dt-th-sortable' : ''}${isSorted ? ' fs-dt-th-active' : ''}`}
                    style={{ width: col.width, textAlign: col.align ?? 'left' }}
                    onClick={canSort ? () => handleSort(col.key) : undefined}
                    aria-sort={
                      isSorted
                        ? dir === 'asc' ? 'ascending' : 'descending'
                        : canSort ? 'none' : undefined
                    }
                  >
                    <span className="fs-dt-th-inner">
                      <span className="fs-dt-th-label">{col.label}</span>
                      {canSort && <SortIcon dir={dir} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="fs-dt-tbody">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={i} className="fs-dt-tr">
                  {columns.map((col) => (
                    <td key={col.key} className="fs-dt-td">
                      <span className="fs-dt-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isEmpty ? (
              <tr>
                <td className="fs-dt-empty" colSpan={columns.length}>
                  {search ? `"${search}"에 해당하는 결과가 없습니다.` : emptyText}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={getRowKey(row, startIdx + i)} className="fs-dt-tr">
                  {columns.map((col) => {
                    const val = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className="fs-dt-td"
                        style={{ textAlign: col.align ?? 'left' }}
                      >
                        {col.render ? col.render(val, row) : cellText(val)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── 페이지네이션 ──────────────────────────────────────── */}
      {!loading && sorted.length > 0 && (
        <div className="fs-dt-foot">
          <div className="fs-dt-page-size">
            <span className="fs-dt-foot-label">행</span>
            <select
              className="fs-dt-page-select"
              value={pageSize}
              onChange={handlePageSize}
              aria-label="페이지 크기"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <span className="fs-dt-page-info">
            {(startIdx + 1).toLocaleString()}–{Math.min(startIdx + pageSize, sorted.length).toLocaleString()} / {sorted.length.toLocaleString()}
          </span>

          <div className="fs-dt-page-nav">
            <button
              type="button"
              className="fs-dt-page-btn"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              aria-label="첫 페이지"
            >«</button>
            <button
              type="button"
              className="fs-dt-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="이전 페이지"
            >‹</button>
            <span className="fs-dt-page-cur">{safePage} / {totalPages}</span>
            <button
              type="button"
              className="fs-dt-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="다음 페이지"
            >›</button>
            <button
              type="button"
              className="fs-dt-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              aria-label="마지막 페이지"
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}
