import { useCallback, useEffect, useMemo, useState } from "react";
import "./ledger.css";

import {
  Alert,
  Button,
  DataTable,
  EmptyState,
  Modal,
  Select,
  Skeleton,
  Spinner,
} from "@fieldstack/controls";
import type { TableColumn } from "@fieldstack/controls";
// apiCall: @fieldstack/core/browser의 re-export (토큰 갱신·세션 만료·JSON 파싱 포함)
import { apiCall } from "../../../apps/web/src/lib/apiFetch";

// ── 공유 타입 (modules/ledger/types/index.ts와 동일하게 유지) ─

type EntryType = "income" | "expense";
type CategoryType = "income" | "expense" | "both";
type PaymentMethodType = "cash" | "credit_card" | "debit_card" | "transfer" | "other";

interface LedgerCategory {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  createdAt: string;
}

interface LedgerPaymentMethod {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodType;
  isDefault: boolean;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  userId: string;
  date: string;
  amount: number;
  type: EntryType;
  categoryId: string | null;
  categoryName: string | null;
  description: string;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface LedgerSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  entryCount: number;
}

// DataTable row 타입 (Record<string, unknown> 충족)
type EntryRow = LedgerEntry & Record<string, unknown>;

// ── API 헬퍼 ─────────────────────────────────────────────────
// apiCall: 토큰 갱신·세션 만료·JSON 파싱을 @fieldstack/core/browser에서 처리

// LedgerView 전용 별칭 — 내부에서 apiFetch<T> 로 호출하던 패턴 유지
const apiFetch = apiCall;

// ── 금액 포맷 ─────────────────────────────────────────────────

function formatAmount(amount: number, type: EntryType): string {
  const sign = type === "income" ? "+" : "-";
  return `${sign}${amount.toLocaleString("ko-KR")}원`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("ko-KR") + "원";
}

// ── 현재 연/월 ────────────────────────────────────────────────

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// ── 항목 폼 ──────────────────────────────────────────────────

interface EntryFormData {
  date: string;
  amount: string;
  type: EntryType;
  categoryId: string;
  description: string;
  paymentMethodId: string;
  notes: string;
}

function emptyForm(): EntryFormData {
  const today = new Date().toISOString().slice(0, 10);
  return { date: today, amount: "", type: "expense", categoryId: "", description: "", paymentMethodId: "", notes: "" };
}

function entryToForm(entry: LedgerEntry): EntryFormData {
  return {
    date: entry.date,
    amount: String(entry.amount),
    type: entry.type,
    categoryId: entry.categoryId ?? "",
    description: entry.description,
    paymentMethodId: entry.paymentMethodId ?? "",
    notes: entry.notes ?? "",
  };
}

interface EntryModalProps {
  editing: LedgerEntry | null;
  categories: LedgerCategory[];
  paymentMethods: LedgerPaymentMethod[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function EntryModal({ editing, categories, paymentMethods, onClose, onSaved }: EntryModalProps) {
  const [form, setForm] = useState<EntryFormData>(() => editing ? entryToForm(editing) : emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (field: keyof EntryFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(form.amount);
    if (!form.date || isNaN(amount) || amount <= 0) {
      setFormError("날짜와 금액(0보다 큰 수)을 올바르게 입력해 주세요.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("내용을 입력해 주세요.");
      return;
    }

    const body = {
      date: form.date,
      amount,
      type: form.type,
      description: form.description.trim(),
      categoryId: form.categoryId || undefined,
      paymentMethodId: form.paymentMethodId || undefined,
      notes: form.notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/ledger/entries/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/ledger/entries", { method: "POST", body: JSON.stringify(body) });
      }
      await onSaved();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === form.type || c.type === "both");

  return (
    <Modal open onClose={onClose} title={editing ? "항목 수정" : "새 항목 추가"} size="md">
      <form className="ledger-entry-form" onSubmit={(e) => { void handleSubmit(e); }}>
        {formError && (
          <Alert variant="error" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}

        <div className="ledger-type-toggle">
          <button type="button" className={`ledger-type-btn ${form.type === "income" ? "active income" : ""}`}
            onClick={() => set("type", "income")}>수입</button>
          <button type="button" className={`ledger-type-btn ${form.type === "expense" ? "active expense" : ""}`}
            onClick={() => set("type", "expense")}>지출</button>
        </div>

        <div className="ledger-form-field">
          <label className="ledger-form-label" htmlFor="entry-date">날짜 *</label>
          <input id="entry-date" type="date" className="ledger-form-input"
            value={form.date} onChange={(e) => set("date", e.target.value)} required />
        </div>

        <div className="ledger-form-field">
          <label className="ledger-form-label" htmlFor="entry-amount">금액 *</label>
          <input id="entry-amount" type="number" className="ledger-form-input"
            placeholder="0" min="1" step="1"
            value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
        </div>

        <div className="ledger-form-field">
          <label className="ledger-form-label" htmlFor="entry-desc">내용 *</label>
          <input id="entry-desc" type="text" className="ledger-form-input"
            placeholder="항목 내용" maxLength={200}
            value={form.description} onChange={(e) => set("description", e.target.value)} required />
        </div>

        <div className="ledger-form-field">
          <label className="ledger-form-label" htmlFor="entry-category">카테고리</label>
          <Select
            id="entry-category"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            options={[
              { value: "", label: "카테고리 없음" },
              ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>

        <div className="ledger-form-field">
          <label className="ledger-form-label" htmlFor="entry-payment">결제 수단</label>
          <Select
            id="entry-payment"
            value={form.paymentMethodId}
            onChange={(e) => set("paymentMethodId", e.target.value)}
            options={[
              { value: "", label: "미지정" },
              ...paymentMethods.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        </div>

        <div className="ledger-form-field">
          <label className="ledger-form-label" htmlFor="entry-notes">메모</label>
          <textarea id="entry-notes" className="ledger-form-input ledger-form-textarea"
            placeholder="추가 메모 (선택사항)" maxLength={1000} rows={2}
            value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <div className="ledger-form-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>취소</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {editing ? "저장" : "추가"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── 요약 카드 ─────────────────────────────────────────────────

interface SummaryCardsProps {
  summary: LedgerSummary | null;
  loading: boolean;
}

function SummaryCards({ summary, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="ledger-summary-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ledger-summary-card">
            <Skeleton variant="text" lines={2} />
          </div>
        ))}
      </div>
    );
  }
  const income = summary?.totalIncome ?? 0;
  const expense = summary?.totalExpense ?? 0;
  const balance = summary?.balance ?? 0;
  return (
    <div className="ledger-summary-row">
      <div className="ledger-summary-card income">
        <p className="ledger-summary-label">수입</p>
        <p className="ledger-summary-value">{formatCurrency(income)}</p>
      </div>
      <div className="ledger-summary-card expense">
        <p className="ledger-summary-label">지출</p>
        <p className="ledger-summary-value">{formatCurrency(expense)}</p>
      </div>
      <div className={`ledger-summary-card balance ${balance >= 0 ? "positive" : "negative"}`}>
        <p className="ledger-summary-label">잔액</p>
        <p className="ledger-summary-value">{balance >= 0 ? "+" : ""}{formatCurrency(balance)}</p>
      </div>
    </div>
  );
}

// ── 메인 뷰 ──────────────────────────────────────────────────

export function LedgerView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [filterType, setFilterType] = useState<"all" | EntryType>("all");

  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [categories, setCategories] = useState<LedgerCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<LedgerPaymentMethod[]>([]);

  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  // ── 메타데이터 로드 ─────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      apiFetch<{ categories: LedgerCategory[] }>("/api/ledger/categories"),
      apiFetch<{ methods: LedgerPaymentMethod[] }>("/api/ledger/payment-methods"),
    ])
      .then(([catData, pmData]) => {
        setCategories(catData.categories);
        setPaymentMethods(pmData.methods);
      })
      .catch(() => { /* 카테고리/결제 수단 실패 시 빈 목록 유지 */ });
  }, []);

  // ── 항목 목록 로드 ───────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    setViewError(null);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (filterType !== "all") params.set("type", filterType);
      const data = await apiFetch<{ items: LedgerEntry[]; total: number }>(
        `/api/ledger/entries?${params}`,
      );
      setEntries(data.items as EntryRow[]);
      setTotal(data.total);
    } catch (err) {
      setViewError((err as Error).message);
    } finally {
      setLoadingEntries(false);
    }
  }, [year, month, page, filterType]);

  // ── 요약 로드 ────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await apiFetch<{ summary: LedgerSummary }>(
        `/api/ledger/summary?year=${year}&month=${month}`,
      );
      setSummary(data.summary);
    } catch {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [year, month]);

  // 월/필터 변경 시 페이지 초기화
  useEffect(() => { setPage(1); }, [year, month, filterType]);

  useEffect(() => { void loadEntries(); void loadSummary(); }, [loadEntries, loadSummary]);

  // ── 삭제 ────────────────────────────────────────────────────

  const handleDelete = async (entry: LedgerEntry) => {
    if (!confirm(`"${entry.description || "이 항목"}"을 삭제하시겠습니까?`)) return;
    setDeletingId(entry.id);
    try {
      await apiFetch(`/api/ledger/entries/${entry.id}`, { method: "DELETE" });
      await loadEntries();
      await loadSummary();
    } catch (err) {
      setViewError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── 월 네비게이션 ────────────────────────────────────────────

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };
  const isCurrentMonth = useMemo(() => {
    const now = getCurrentYearMonth();
    return now.year === year && now.month === month;
  }, [year, month]);

  // ── 모달 열기 ────────────────────────────────────────────────

  const openCreate = () => { setEditingEntry(null); setModalOpen(true); };
  const openEdit = (entry: LedgerEntry) => { setEditingEntry(entry); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingEntry(null); };
  const handleSaved = async () => {
    closeModal();
    await loadEntries();
    await loadSummary();
  };

  // ── DataTable 컬럼 정의 ──────────────────────────────────────

  const columns: TableColumn<EntryRow>[] = [
    {
      key: "date",
      label: "날짜",
      sortable: true,
      width: "110px",
      render: (_v, row) => <span className="ledger-cell-date">{row.date as string}</span>,
    },
    {
      key: "type",
      label: "구분",
      width: "70px",
      render: (_v, row) => (
        <span className={`ledger-badge ${row.type as string}`}>
          {row.type === "income" ? "수입" : "지출"}
        </span>
      ),
    },
    {
      key: "categoryName",
      label: "카테고리",
      width: "120px",
      render: (_v, row) => (
        <span className="ledger-cell-muted">{(row.categoryName as string | null) ?? "—"}</span>
      ),
    },
    {
      key: "description",
      label: "내용",
      render: (_v, row) => (
        <span className="ledger-cell-desc">{(row.description as string) || "—"}</span>
      ),
    },
    {
      key: "paymentMethodName",
      label: "결제 수단",
      width: "110px",
      render: (_v, row) => (
        <span className="ledger-cell-muted">{(row.paymentMethodName as string | null) ?? "—"}</span>
      ),
    },
    {
      key: "amount",
      label: "금액",
      sortable: true,
      width: "130px",
      align: "right",
      render: (_v, row) => (
        <span className={`ledger-cell-amount ${row.type as string}`}>
          {formatAmount(row.amount as number, row.type as EntryType)}
        </span>
      ),
    },
    {
      key: "id",
      label: "",
      width: "100px",
      render: (_v, row) => (
        <div className="ledger-cell-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="ledger-action-btn edit"
            onClick={() => openEdit(row as unknown as LedgerEntry)}>수정</button>
          <button type="button" className="ledger-action-btn delete"
            disabled={deletingId === row.id}
            onClick={() => { void handleDelete(row as unknown as LedgerEntry); }}>
            {deletingId === row.id ? "…" : "삭제"}
          </button>
        </div>
      ),
    },
  ];

  // ── 렌더 ─────────────────────────────────────────────────────

  return (
    <div className="ledger-view">
      {/* 헤더 */}
      <div className="ledger-header">
        <div className="ledger-title-row">
          <h1 className="ledger-title">가계부</h1>
          <Button variant="primary" size="sm" onClick={openCreate}>+ 추가</Button>
        </div>
        {/* 월 네비게이션 */}
        <div className="ledger-month-nav">
          <button type="button" className="ledger-month-btn" onClick={prevMonth} aria-label="이전 달">‹</button>
          <span className="ledger-month-label">{year}년 {month}월</span>
          <button type="button" className="ledger-month-btn" onClick={nextMonth}
            aria-label="다음 달" disabled={isCurrentMonth}>›</button>
        </div>
      </div>

      {/* 요약 카드 */}
      <SummaryCards summary={summary} loading={loadingSummary} />

      {/* 필터 탭 */}
      <div className="ledger-filter-tabs">
        {(["all", "income", "expense"] as const).map((t) => (
          <button key={t} type="button"
            className={`ledger-filter-tab ${filterType === t ? "active" : ""}`}
            onClick={() => setFilterType(t)}>
            {t === "all" ? "전체" : t === "income" ? "수입" : "지출"}
          </button>
        ))}
      </div>

      {/* 에러 */}
      {viewError && (
        <Alert variant="error" onClose={() => setViewError(null)}>{viewError}</Alert>
      )}

      {/* 데이터 */}
      {loadingEntries ? (
        <div className="ledger-loading">
          <Spinner size="lg" blocking />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="기록이 없습니다"
          description="+ 추가 버튼으로 수입·지출을 기록해 보세요."
          action={{ label: "+ 항목 추가", onClick: openCreate }}
        />
      ) : (
        <DataTable<EntryRow>
          columns={columns}
          rows={entries}
          rowKey="id"
          searchable={false}
          pageSize={PAGE_SIZE}
        />
      )}

      {/* 항목 폼 모달 */}
      {modalOpen && (
        <EntryModal
          editing={editingEntry}
          categories={categories}
          paymentMethods={paymentMethods}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
