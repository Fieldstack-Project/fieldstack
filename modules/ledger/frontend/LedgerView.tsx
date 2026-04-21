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
// apiCall: JSON 파싱·토큰 갱신 포함. apiFetch: raw Response 반환 (파일 다운로드용)
import { apiCall, apiFetch as apiFetchRaw } from "../../../apps/web/src/lib/apiFetch";
import { registerModuleLocale } from "../../../apps/web/src/i18n/registerModuleLocale";

import koLocale from "./locales/ko.json";
import enLocale from "./locales/en.json";

// 모듈 로케일을 i18next에 등록 (중복 등록 방지는 registerModuleLocale 내부에서 처리)
registerModuleLocale("ledger", koLocale, enLocale);

// ── 공유 타입 ─────────────────────────────────────────────────

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
  budgetLimit: number | null;
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
  receiptPath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryStat {
  categoryId: string | null;
  categoryName: string | null;
  type: EntryType;
  total: number;
  count: number;
}

interface LedgerSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  entryCount: number;
  byCategory: CategoryStat[];
}

// DataTable row 타입 (Record<string, unknown> 충족)
type EntryRow = LedgerEntry & Record<string, unknown>;

// ── API 헬퍼 ─────────────────────────────────────────────────
// apiCall: 토큰 갱신·세션 만료·JSON 파싱을 @fieldstack/core/browser에서 처리

const apiFetch = apiCall;

// ── 차트 컬러 팔레트 ──────────────────────────────────────────

const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

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
          <label className="ledger-form-label" htmlFor="entry-payment">
            {form.type === "expense" ? "결제 수단" : "수취 수단"}
          </label>
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

// ── 카테고리·결제수단 관리 모달 ──────────────────────────────────

type ManageTab = "categories" | "paymentMethods";

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  income: "수입",
  expense: "지출",
  both: "공통",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "현금",
  credit_card: "신용카드",
  debit_card: "체크카드",
  transfer: "계좌이체",
  other: "기타",
};

interface ManageModalProps {
  categories: LedgerCategory[];
  paymentMethods: LedgerPaymentMethod[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}

function ManageModal({ categories, paymentMethods, onClose, onChanged }: ManageModalProps) {
  const [tab, setTab] = useState<ManageTab>("categories");

  // ── 카테고리 추가 폼 ──
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense" | "both">("expense");
  const [catColor, setCatColor] = useState("");
  const [catBudget, setCatBudget] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // 카테고리 인라인 편집 상태
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatType, setEditCatType] = useState<"income" | "expense" | "both">("expense");
  const [editCatColor, setEditCatColor] = useState("");
  const [editCatBudget, setEditCatBudget] = useState("");
  const [savingCatId, setSavingCatId] = useState<string | null>(null);

  const startEditCat = (cat: LedgerCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatType(cat.type);
    setEditCatColor(cat.color ?? "#6b7280");
    setEditCatBudget(cat.budgetLimit != null ? String(cat.budgetLimit) : "");
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    setSavingCatId(id);
    try {
      const budgetLimit = editCatBudget.trim() ? parseFloat(editCatBudget) : null;
      await apiCall(`/api/ledger/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editCatName.trim(), type: editCatType, color: editCatColor, budgetLimit }),
      });
      setEditingCatId(null);
      await onChanged();
    } catch (err) {
      setCatError((err as Error).message);
    } finally {
      setSavingCatId(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) { setCatError("이름을 입력해 주세요."); return; }
    setCatSaving(true);
    setCatError(null);
    try {
      const budgetLimit = catBudget.trim() ? parseFloat(catBudget) : undefined;
      await apiCall("/api/ledger/categories", {
        method: "POST",
        body: JSON.stringify({ name: catName.trim(), type: catType, color: catColor || undefined, budgetLimit }),
      });
      setCatName("");
      setCatColor("");
      setCatBudget("");
      await onChanged();
    } catch (err) {
      setCatError((err as Error).message);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingCatId(id);
    try {
      await apiCall(`/api/ledger/categories/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      setCatError((err as Error).message);
    } finally {
      setDeletingCatId(null);
    }
  };

  // ── 수단 추가 폼 ──
  const [pmName, setPmName] = useState("");
  const [pmType, setPmType] = useState<"cash" | "credit_card" | "debit_card" | "transfer" | "other">("credit_card");
  const [pmSaving, setPmSaving] = useState(false);
  const [pmError, setPmError] = useState<string | null>(null);
  const [deletingPmId, setDeletingPmId] = useState<string | null>(null);

  // 수단 인라인 편집 상태
  const [editingPmId, setEditingPmId] = useState<string | null>(null);
  const [editPmName, setEditPmName] = useState("");
  const [editPmType, setEditPmType] = useState<"cash" | "credit_card" | "debit_card" | "transfer" | "other">("credit_card");
  const [savingPmId, setSavingPmId] = useState<string | null>(null);

  const startEditPm = (pm: LedgerPaymentMethod) => {
    setEditingPmId(pm.id);
    setEditPmName(pm.name);
    setEditPmType(pm.type);
  };

  const handleUpdatePaymentMethod = async (id: string) => {
    if (!editPmName.trim()) return;
    setSavingPmId(id);
    try {
      await apiCall(`/api/ledger/payment-methods/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editPmName.trim(), type: editPmType }),
      });
      setEditingPmId(null);
      await onChanged();
    } catch (err) {
      setPmError((err as Error).message);
    } finally {
      setSavingPmId(null);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmName.trim()) { setPmError("이름을 입력해 주세요."); return; }
    setPmSaving(true);
    setPmError(null);
    try {
      await apiCall("/api/ledger/payment-methods", {
        method: "POST",
        body: JSON.stringify({ name: pmName.trim(), type: pmType }),
      });
      setPmName("");
      await onChanged();
    } catch (err) {
      setPmError((err as Error).message);
    } finally {
      setPmSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    setDeletingPmId(id);
    try {
      await apiCall(`/api/ledger/payment-methods/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      setPmError((err as Error).message);
    } finally {
      setDeletingPmId(null);
    }
  };

  return (
    <Modal open onClose={onClose} title="카테고리·수단 관리" size="md">
      {/* 탭 */}
      <div className="manage-tabs">
        <button
          type="button"
          className={`manage-tab ${tab === "categories" ? "active" : ""}`}
          onClick={() => setTab("categories")}
        >
          카테고리
        </button>
        <button
          type="button"
          className={`manage-tab ${tab === "paymentMethods" ? "active" : ""}`}
          onClick={() => setTab("paymentMethods")}
        >
          수단
        </button>
      </div>

      {/* 카테고리 탭 */}
      {tab === "categories" && (
        <div className="manage-section">
          <form className="manage-add-form" onSubmit={(e) => { void handleAddCategory(e); }}>
            {catError && (
              <Alert variant="error" onClose={() => setCatError(null)}>{catError}</Alert>
            )}
            <input
              type="text"
              className="manage-name-input"
              placeholder="카테고리 이름"
              maxLength={50}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <div className="manage-add-row">
              <Select
                value={catType}
                onChange={(e) => setCatType(e.target.value as typeof catType)}
                options={[
                  { value: "expense", label: "지출" },
                  { value: "income", label: "수입" },
                  { value: "both", label: "공통" },
                ]}
              />
              <input
                type="color"
                className="manage-color-input"
                title="색상 선택"
                value={catColor || "#6b7280"}
                onChange={(e) => setCatColor(e.target.value)}
              />
              <Button type="submit" variant="primary" size="sm" loading={catSaving} disabled={catSaving}>
                추가
              </Button>
            </div>
            <input
              type="number"
              className="manage-budget-input"
              placeholder="예산 한도 (선택, 원)"
              min="1" step="1"
              value={catBudget}
              onChange={(e) => setCatBudget(e.target.value)}
            />
          </form>

          <ul className="manage-list">
            {categories.length === 0 && (
              <li className="manage-empty">등록된 카테고리가 없습니다.</li>
            )}
            {categories.map((cat) =>
              editingCatId === cat.id ? (
                /* 편집 모드 */
                <li key={cat.id} className="manage-item manage-item-editing">
                  <input
                    type="color"
                    className="manage-color-input"
                    value={editCatColor}
                    onChange={(e) => setEditCatColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="manage-name-input manage-edit-name"
                    maxLength={50}
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    autoFocus
                  />
                  <Select
                    value={editCatType}
                    onChange={(e) => setEditCatType(e.target.value as typeof editCatType)}
                    options={[
                      { value: "expense", label: "지출" },
                      { value: "income", label: "수입" },
                      { value: "both", label: "공통" },
                    ]}
                  />
                  <input
                    type="number"
                    className="manage-budget-input"
                    placeholder="예산 (선택)"
                    min="1" step="1"
                    value={editCatBudget}
                    onChange={(e) => setEditCatBudget(e.target.value)}
                  />
                  <div className="manage-edit-actions">
                    <Button
                      type="button" variant="primary" size="sm"
                      loading={savingCatId === cat.id}
                      disabled={!editCatName.trim() || savingCatId === cat.id}
                      onClick={() => { void handleUpdateCategory(cat.id); }}
                    >
                      저장
                    </Button>
                    <button
                      type="button" className="manage-delete-btn"
                      onClick={() => setEditingCatId(null)}
                    >
                      취소
                    </button>
                  </div>
                </li>
              ) : (
                /* 일반 모드 */
                <li key={cat.id} className="manage-item">
                  <span
                    className="manage-item-dot"
                    style={{ background: cat.color ?? "var(--text-faint)" }}
                  />
                  <span className="manage-item-name">{cat.name}</span>
                  <span className="manage-item-badge">{CATEGORY_TYPE_LABELS[cat.type]}</span>
                  <button
                    type="button" className="manage-edit-btn"
                    onClick={() => startEditCat(cat)}
                  >
                    수정
                  </button>
                  <button
                    type="button" className="manage-delete-btn"
                    disabled={deletingCatId === cat.id}
                    onClick={() => { void handleDeleteCategory(cat.id); }}
                  >
                    {deletingCatId === cat.id ? "…" : "삭제"}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* 수단 탭 */}
      {tab === "paymentMethods" && (
        <div className="manage-section">
          <form className="manage-add-form" onSubmit={(e) => { void handleAddPaymentMethod(e); }}>
            {pmError && (
              <Alert variant="error" onClose={() => setPmError(null)}>{pmError}</Alert>
            )}
            <input
              type="text"
              className="manage-name-input"
              placeholder="수단 이름"
              maxLength={50}
              value={pmName}
              onChange={(e) => setPmName(e.target.value)}
            />
            <div className="manage-add-row">
              <Select
                value={pmType}
                onChange={(e) => setPmType(e.target.value as typeof pmType)}
                options={[
                  { value: "credit_card", label: "신용카드" },
                  { value: "debit_card", label: "체크카드" },
                  { value: "cash", label: "현금" },
                  { value: "transfer", label: "계좌이체" },
                  { value: "other", label: "기타" },
                ]}
              />
              <Button type="submit" variant="primary" size="sm" loading={pmSaving} disabled={pmSaving}>
                추가
              </Button>
            </div>
          </form>

          <ul className="manage-list">
            {paymentMethods.length === 0 && (
              <li className="manage-empty">등록된 수단이 없습니다.</li>
            )}
            {paymentMethods.map((pm) =>
              editingPmId === pm.id ? (
                /* 편집 모드 */
                <li key={pm.id} className="manage-item manage-item-editing">
                  <input
                    type="text"
                    className="manage-name-input manage-edit-name"
                    maxLength={50}
                    value={editPmName}
                    onChange={(e) => setEditPmName(e.target.value)}
                    autoFocus
                  />
                  <Select
                    value={editPmType}
                    onChange={(e) => setEditPmType(e.target.value as typeof editPmType)}
                    options={[
                      { value: "credit_card", label: "신용카드" },
                      { value: "debit_card", label: "체크카드" },
                      { value: "cash", label: "현금" },
                      { value: "transfer", label: "계좌이체" },
                      { value: "other", label: "기타" },
                    ]}
                  />
                  <div className="manage-edit-actions">
                    <Button
                      type="button" variant="primary" size="sm"
                      loading={savingPmId === pm.id}
                      disabled={!editPmName.trim() || savingPmId === pm.id}
                      onClick={() => { void handleUpdatePaymentMethod(pm.id); }}
                    >
                      저장
                    </Button>
                    <button
                      type="button" className="manage-delete-btn"
                      onClick={() => setEditingPmId(null)}
                    >
                      취소
                    </button>
                  </div>
                </li>
              ) : (
                /* 일반 모드 */
                <li key={pm.id} className="manage-item">
                  <span className="manage-item-name">{pm.name}</span>
                  <span className="manage-item-badge">{PAYMENT_TYPE_LABELS[pm.type]}</span>
                  <button
                    type="button" className="manage-edit-btn"
                    onClick={() => startEditPm(pm)}
                  >
                    수정
                  </button>
                  <button
                    type="button" className="manage-delete-btn"
                    disabled={deletingPmId === pm.id}
                    onClick={() => { void handleDeletePaymentMethod(pm.id); }}
                  >
                    {deletingPmId === pm.id ? "…" : "삭제"}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      )}
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

// ── 도넛 차트 (SVG) ───────────────────────────────────────────

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** 도넛 호 SVG path 문자열을 생성한다. */
function buildArcPath(
  cx: number, cy: number,
  rOuter: number, rInner: number,
  startAngle: number, endAngle: number,
): string {
  const cos = Math.cos, sin = Math.sin;
  const x1 = cx + rOuter * cos(startAngle), y1 = cy + rOuter * sin(startAngle);
  const x2 = cx + rOuter * cos(endAngle),   y2 = cy + rOuter * sin(endAngle);
  const ix1 = cx + rInner * cos(endAngle),  iy1 = cy + rInner * sin(endAngle);
  const ix2 = cx + rInner * cos(startAngle),iy2 = cy + rInner * sin(startAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
    `L ${ix1} ${iy1}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${ix2} ${iy2}`,
    "Z",
  ].join(" ");
}

interface DonutChartProps {
  slices: DonutSlice[];
  total: number;
  centerLabel: string;
}

function DonutChart({ slices, total, centerLabel }: DonutChartProps) {
  const cx = 90, cy = 90, rOuter = 78, rInner = 50;

  if (slices.length === 0 || total === 0) {
    return (
      <div className="ledger-donut-empty">데이터 없음</div>
    );
  }

  // 단일 항목: 완전한 원
  if (slices.length === 1) {
    return (
      <svg width="180" height="180" viewBox="0 0 180 180" className="ledger-donut-svg" aria-hidden="true">
        <circle cx={cx} cy={cy} r={rOuter} fill={slices[0].color} />
        <circle cx={cx} cy={cy} r={rInner} fill="var(--bg-surface)" />
        <text x={cx} y={cy - 8} textAnchor="middle" className="ledger-donut-center-label">{centerLabel}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="ledger-donut-center-value">{formatCurrency(total)}</text>
      </svg>
    );
  }

  let angle = -Math.PI / 2; // 12시 방향에서 시작
  const paths = slices.map((slice, i) => {
    const sweep = (slice.value / total) * 2 * Math.PI;
    const endAngle = angle + sweep;
    const d = buildArcPath(cx, cy, rOuter, rInner, angle, endAngle);
    angle = endAngle;
    return { d, color: slice.color, key: i };
  });

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="ledger-donut-svg" aria-hidden="true">
      {paths.map((p) => (
        <path key={p.key} d={p.d} fill={p.color} stroke="var(--bg-surface)" strokeWidth="2" />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" className="ledger-donut-center-label">{centerLabel}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="ledger-donut-center-value">{formatCurrency(total)}</text>
    </svg>
  );
}

// ── 카테고리 범례 ─────────────────────────────────────────────

interface CategoryLegendProps {
  slices: DonutSlice[];
  total: number;
}

function CategoryLegend({ slices, total }: CategoryLegendProps) {
  return (
    <ul className="ledger-legend-list">
      {slices.map((s, i) => {
        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
        return (
          <li key={i} className="ledger-legend-item">
            <span className="ledger-legend-dot" style={{ background: s.color }} />
            <span className="ledger-legend-name">{s.label}</span>
            <span className="ledger-legend-pct">{pct}%</span>
            <span className="ledger-legend-amount">{formatCurrency(s.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ── 차트 뷰 ──────────────────────────────────────────────────

interface ChartViewProps {
  summary: LedgerSummary | null;
  loading: boolean;
  categories: LedgerCategory[];
}

function ChartView({ summary, loading, categories }: ChartViewProps) {
  if (loading) {
    return (
      <div className="ledger-chart-view">
        <Skeleton variant="rect" height={300} />
      </div>
    );
  }
  if (!summary || summary.entryCount === 0) {
    return (
      <div className="ledger-chart-view">
        <EmptyState title="데이터 없음" description="이 달의 기록이 없습니다." />
      </div>
    );
  }

  const maxAmount = Math.max(summary.totalIncome, summary.totalExpense, 1);
  const incomeWidth = (summary.totalIncome / maxAmount) * 100;
  const expenseWidth = (summary.totalExpense / maxAmount) * 100;

  const expenseStats = summary.byCategory.filter((s) => s.type === "expense");
  const incomeStats  = summary.byCategory.filter((s) => s.type === "income");

  const expenseSlices: DonutSlice[] = expenseStats.map((s, i) => ({
    label: s.categoryName ?? "미분류",
    value: s.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const incomeSlices: DonutSlice[] = incomeStats.map((s, i) => ({
    label: s.categoryName ?? "미분류",
    value: s.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="ledger-chart-view">
      {/* 수입·지출 비교 바 */}
      <div className="ledger-chart-section">
        <h3 className="ledger-chart-section-title">수입 · 지출 비교</h3>
        <div className="ledger-overview-bars">
          <div className="ledger-overview-row">
            <span className="ledger-overview-label">수입</span>
            <div className="ledger-overview-track">
              <div className="ledger-overview-bar income" style={{ width: `${incomeWidth}%` }} />
            </div>
            <span className="ledger-overview-amount income">{formatCurrency(summary.totalIncome)}</span>
          </div>
          <div className="ledger-overview-row">
            <span className="ledger-overview-label">지출</span>
            <div className="ledger-overview-track">
              <div className="ledger-overview-bar expense" style={{ width: `${expenseWidth}%` }} />
            </div>
            <span className="ledger-overview-amount expense">{formatCurrency(summary.totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* 지출 카테고리 도넛 */}
      {expenseSlices.length > 0 && (
        <div className="ledger-chart-section">
          <h3 className="ledger-chart-section-title">지출 카테고리</h3>
          <div className="ledger-chart-row">
            <DonutChart slices={expenseSlices} total={summary.totalExpense} centerLabel="지출" />
            <CategoryLegend slices={expenseSlices} total={summary.totalExpense} />
          </div>
        </div>
      )}

      {/* 예산 현황 */}
      {(() => {
        const budgetedCats = expenseStats
          .map((stat) => {
            const cat = categories.find((c) => c.id === stat.categoryId);
            return cat?.budgetLimit ? { stat, cat } : null;
          })
          .filter(Boolean) as { stat: CategoryStat; cat: LedgerCategory }[];

        if (budgetedCats.length === 0) return null;
        return (
          <div className="ledger-chart-section">
            <h3 className="ledger-chart-section-title">예산 현황</h3>
            <div className="ledger-budget-list">
              {budgetedCats.map(({ stat, cat }) => {
                const used = stat.total;
                const limit = cat.budgetLimit!;
                const pct = Math.min((used / limit) * 100, 100);
                const over = used > limit;
                return (
                  <div key={cat.id} className="ledger-budget-item">
                    <div className="ledger-budget-header">
                      <span className="ledger-budget-name">
                        {cat.color && (
                          <span className="ledger-budget-dot" style={{ background: cat.color }} />
                        )}
                        {cat.name}
                      </span>
                      <span className={`ledger-budget-amounts ${over ? "over" : ""}`}>
                        {formatCurrency(used)} / {formatCurrency(limit)}
                      </span>
                    </div>
                    <div className="ledger-budget-track">
                      <div
                        className={`ledger-budget-bar ${over ? "over" : ""}`}
                        style={{ width: `${pct}%`, background: cat.color ?? "var(--primary)" }}
                      />
                    </div>
                    {over && (
                      <p className="ledger-budget-over-msg">
                        예산 {formatCurrency(used - limit)} 초과
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 수입 카테고리 도넛 */}
      {incomeSlices.length > 0 && (
        <div className="ledger-chart-section">
          <h3 className="ledger-chart-section-title">수입 카테고리</h3>
          <div className="ledger-chart-row">
            <DonutChart slices={incomeSlices} total={summary.totalIncome} centerLabel="수입" />
            <CategoryLegend slices={incomeSlices} total={summary.totalIncome} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── 항목 상세 패널 ────────────────────────────────────────────

interface EntryDetailPanelProps {
  entry: LedgerEntry;
  deleting: boolean;
  onClose: () => void;
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (entry: LedgerEntry) => Promise<void>;
  onEntryUpdated: (entry: LedgerEntry) => void;
}

function EntryDetailPanel({ entry, deleting, onClose, onEdit, onDelete, onEntryUpdated }: EntryDetailPanelProps) {
  const createdAt = new Date(entry.createdAt).toLocaleString("ko-KR");
  const updatedAt = new Date(entry.updatedAt).toLocaleString("ko-KR");
  const isModified = entry.createdAt !== entry.updatedAt;

  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [deletingReceipt, setDeletingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setReceiptError(null);
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch(`/api/ledger/entries/${entry.id}/receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Filename": encodeURIComponent(file.name),
          Authorization: `Bearer ${sessionStorage.getItem("fs_auth") ?? ""}`,
        },
        body: buf,
      });
      if (!res.ok) throw new Error("업로드 실패");
      const json = await res.json() as { success: boolean; data?: { entry: LedgerEntry } };
      if (json.success && json.data?.entry) onEntryUpdated(json.data.entry);
    } catch (err) {
      setReceiptError((err as Error).message);
    } finally {
      setUploadingReceipt(false);
      e.target.value = "";
    }
  };

  const handleReceiptDelete = async () => {
    setDeletingReceipt(true);
    setReceiptError(null);
    try {
      const res = await fetch(`/api/ledger/entries/${entry.id}/receipt`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("fs_auth") ?? ""}` },
      });
      if (!res.ok) throw new Error("삭제 실패");
      const json = await res.json() as { success: boolean; data?: { entry: LedgerEntry } };
      if (json.success && json.data?.entry) onEntryUpdated(json.data.entry);
    } catch (err) {
      setReceiptError((err as Error).message);
    } finally {
      setDeletingReceipt(false);
    }
  };

  return (
    <>
      {/* 배경 딤 */}
      <div className="ledger-panel-backdrop" onClick={onClose} aria-hidden="true" />

      {/* 패널 본체 */}
      <aside className="ledger-detail-panel" role="complementary" aria-label="항목 상세">
        {/* 헤더 */}
        <div className="ledger-panel-header">
          <span className={`ledger-badge ${entry.type}`}>
            {entry.type === "income" ? "수입" : "지출"}
          </span>
          <button
            type="button"
            className="ledger-panel-close"
            onClick={onClose}
            aria-label="패널 닫기"
          >
            ✕
          </button>
        </div>

        {/* 금액 + 날짜 */}
        <div className="ledger-panel-hero">
          <p className={`ledger-panel-amount ${entry.type}`}>
            {formatAmount(entry.amount, entry.type)}
          </p>
          <p className="ledger-panel-date">{entry.date}</p>
        </div>

        {/* 상세 정보 */}
        <dl className="ledger-panel-dl">
          <div className="ledger-panel-dl-row">
            <dt>내용</dt>
            <dd>{entry.description || "—"}</dd>
          </div>

          {entry.categoryName && (
            <div className="ledger-panel-dl-row">
              <dt>카테고리</dt>
              <dd>{entry.categoryName}</dd>
            </div>
          )}

          {entry.paymentMethodName && (
            <div className="ledger-panel-dl-row">
              <dt>수단</dt>
              <dd>{entry.paymentMethodName}</dd>
            </div>
          )}

          {entry.notes && (
            <div className="ledger-panel-dl-row">
              <dt>메모</dt>
              <dd className="ledger-panel-notes">{entry.notes}</dd>
            </div>
          )}

          {entry.tags.length > 0 && (
            <div className="ledger-panel-dl-row">
              <dt>태그</dt>
              <dd>
                <div className="ledger-panel-tags">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="ledger-panel-tag">{tag}</span>
                  ))}
                </div>
              </dd>
            </div>
          )}

          <div className="ledger-panel-dl-row ledger-panel-dl-meta">
            <dt>영수증</dt>
            <dd>
              {receiptError && (
                <p className="ledger-receipt-error">{receiptError}</p>
              )}
              {entry.receiptPath ? (
                <div className="ledger-receipt-section">
                  <a
                    href={`/api/ledger/entries/${entry.id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ledger-receipt-link"
                  >
                    영수증 보기
                  </a>
                  <button
                    type="button"
                    className="ledger-receipt-delete-btn"
                    disabled={deletingReceipt}
                    onClick={() => { void handleReceiptDelete(); }}
                  >
                    {deletingReceipt ? "삭제 중…" : "삭제"}
                  </button>
                </div>
              ) : (
                <label className="ledger-receipt-upload-label">
                  {uploadingReceipt ? "업로드 중…" : "파일 첨부"}
                  <input
                    type="file"
                    className="ledger-receipt-input"
                    accept="image/*,.pdf"
                    disabled={uploadingReceipt}
                    onChange={(e) => { void handleReceiptUpload(e); }}
                  />
                </label>
              )}
            </dd>
          </div>

          <div className="ledger-panel-dl-row ledger-panel-dl-meta">
            <dt>등록</dt>
            <dd>{createdAt}</dd>
          </div>

          {isModified && (
            <div className="ledger-panel-dl-row ledger-panel-dl-meta">
              <dt>수정</dt>
              <dd>{updatedAt}</dd>
            </div>
          )}
        </dl>

        {/* 액션 */}
        <div className="ledger-panel-footer">
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            disabled={deleting}
            onClick={() => { void onDelete(entry); }}
          >
            삭제
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { onClose(); onEdit(entry); }}
          >
            수정
          </Button>
        </div>
      </aside>
    </>
  );
}

// ── CSV 가져오기 타입 ─────────────────────────────────────────

interface ImportMapping {
  dateCol: string;
  amountCol: string;
  typeCol?: string;
  incomeValues?: string[];
  fixedType?: EntryType;
  descriptionCol?: string;
  categoryCol?: string;
  paymentMethodCol?: string;
  notesCol?: string;
  amountSignDeterminesType?: boolean;
}

interface ImportPreviewRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: {
    date?: string;
    amount?: number;
    type?: EntryType;
    description?: string;
    categoryName?: string;
  };
  duplicate: boolean;
  parseError?: string;
}

interface ImportPreviewResult {
  headers: string[];
  rows: ImportPreviewRow[];
  detectedMapping: ImportMapping;
  totalRows: number;
  duplicateCount: number;
  errorCount: number;
}

interface ImportCommitResult {
  inserted: number;
  skippedDuplicates: number;
  errors: number;
}

// ── CSV 가져오기 모달 ─────────────────────────────────────────

interface CsvImportModalProps {
  onClose: () => void;
  onImported: () => Promise<void>;
}

function CsvImportModal({ onClose, onImported }: CsvImportModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    setFileBuffer(buf);
    setError(null);
  };

  const handlePreview = async () => {
    if (!fileBuffer) { setError("파일을 선택해 주세요."); return; }
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("fs_auth") ?? "";
      const headers: Record<string, string> = {
        "Content-Type": "application/octet-stream",
        Authorization: `Bearer ${token}`,
      };
      if (mapping) headers["X-Override-Mapping"] = JSON.stringify(mapping);
      const res = await fetch("/api/ledger/import/preview", {
        method: "POST",
        headers,
        body: fileBuffer,
      });
      const json = await res.json() as { success: boolean; data?: ImportPreviewResult; error?: string };
      if (!json.success) throw new Error(String(json.error ?? "미리보기 실패"));
      setPreview(json.data!);
      setMapping(json.data!.detectedMapping);
      setStep("preview");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!fileBuffer || !mapping) return;
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("fs_auth") ?? "";
      const res = await fetch("/api/ledger/import/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          Authorization: `Bearer ${token}`,
          "X-Import-Mapping": JSON.stringify({ mapping, skipDuplicates }),
        },
        body: fileBuffer,
      });
      const json = await res.json() as { success: boolean; data?: ImportCommitResult; error?: string };
      if (!json.success) throw new Error(String(json.error ?? "가져오기 실패"));
      setCommitResult(json.data!);
      setStep("done");
      await onImported();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const setMappingField = (field: keyof ImportMapping, value: string) => {
    setMapping((prev) => prev ? { ...prev, [field]: value || undefined } : prev);
  };

  return (
    <Modal open onClose={onClose} title="CSV 가져오기" size="lg">
      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      {step === "upload" && (
        <div className="csv-import-upload">
          <p className="csv-import-desc">
            국내 은행·카드사 CSV 파일을 업로드하면 열을 자동으로 감지합니다.
            UTF-8, EUC-KR 모두 지원합니다.
          </p>
          <label className="csv-import-file-label">
            <span>{fileName || "파일 선택 (CSV)"}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="csv-import-file-input"
              onChange={(e) => { void handleFileChange(e); }}
            />
          </label>
          <div className="csv-import-actions">
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button variant="primary" loading={loading} disabled={!fileBuffer || loading}
              onClick={() => { void handlePreview(); }}>
              미리보기
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && preview && mapping && (
        <div className="csv-import-preview">
          <div className="csv-import-stats">
            <span>전체 {preview.totalRows}행</span>
            <span className="warn">중복 {preview.duplicateCount}건</span>
            {preview.errorCount > 0 && <span className="err">파싱 오류 {preview.errorCount}건</span>}
          </div>

          <details className="csv-mapping-details">
            <summary>열 매핑 설정</summary>
            <div className="csv-mapping-grid">
              {(["dateCol", "amountCol", "descriptionCol", "typeCol", "categoryCol", "paymentMethodCol"] as const).map((field) => {
                const labels: Record<string, string> = {
                  dateCol: "날짜 열 *", amountCol: "금액 열 *", descriptionCol: "내용 열",
                  typeCol: "구분 열", categoryCol: "카테고리 열", paymentMethodCol: "수단 열",
                };
                return (
                  <div key={field} className="csv-mapping-row">
                    <label>{labels[field]}</label>
                    <select
                      className="csv-mapping-select"
                      value={(mapping[field] as string) ?? ""}
                      onChange={(e) => setMappingField(field, e.target.value)}
                    >
                      <option value="">— 없음 —</option>
                      {preview.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                );
              })}
              <div className="csv-mapping-row">
                <label>고정 구분</label>
                <select
                  className="csv-mapping-select"
                  value={mapping.fixedType ?? ""}
                  onChange={(e) => setMapping((prev) => prev ? {
                    ...prev,
                    fixedType: (e.target.value as EntryType) || undefined,
                  } : prev)}
                >
                  <option value="">자동</option>
                  <option value="expense">지출</option>
                  <option value="income">수입</option>
                </select>
              </div>
            </div>
            <Button variant="secondary" size="sm" loading={loading}
              onClick={() => { void handlePreview(); }}>
              다시 분석
            </Button>
          </details>

          <div className="csv-preview-table-wrap">
            <table className="csv-preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>날짜</th>
                  <th>금액</th>
                  <th>구분</th>
                  <th>내용</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 50).map((row) => (
                  <tr key={row.rowIndex}
                    className={row.parseError ? "csv-row-error" : row.duplicate ? "csv-row-dup" : ""}>
                    <td>{row.rowIndex + 1}</td>
                    <td>{row.mapped.date ?? "—"}</td>
                    <td>{row.mapped.amount != null ? formatCurrency(row.mapped.amount) : "—"}</td>
                    <td>{row.mapped.type === "income" ? "수입" : row.mapped.type === "expense" ? "지출" : "—"}</td>
                    <td>{row.mapped.description ?? "—"}</td>
                    <td>{row.parseError ? `오류: ${row.parseError}` : row.duplicate ? "중복" : "정상"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 50 && (
              <p className="csv-preview-more">... 외 {preview.rows.length - 50}행</p>
            )}
          </div>

          <label className="csv-skip-dup-label">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
            />
            중복 건너뛰기
          </label>

          <div className="csv-import-actions">
            <Button variant="secondary" onClick={() => setStep("upload")}>다시 선택</Button>
            <Button variant="primary" loading={loading} disabled={loading}
              onClick={() => { void handleCommit(); }}>
              가져오기
            </Button>
          </div>
        </div>
      )}

      {step === "done" && commitResult && (
        <div className="csv-import-done">
          <p className="csv-done-title">가져오기 완료</p>
          <dl className="csv-done-stats">
            <div><dt>추가됨</dt><dd>{commitResult.inserted}건</dd></div>
            <div><dt>중복 건너뜀</dt><dd>{commitResult.skippedDuplicates}건</dd></div>
            {commitResult.errors > 0 && <div><dt>오류</dt><dd>{commitResult.errors}건</dd></div>}
          </dl>
          <div className="csv-import-actions">
            <Button variant="primary" onClick={onClose}>닫기</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── 메인 뷰 ──────────────────────────────────────────────────

export function LedgerView({ subRoute: _subRoute = "" }: { subRoute?: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [filterType, setFilterType] = useState<"all" | EntryType>("all");
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");

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
  const [manageOpen, setManageOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<LedgerEntry | null>(null);

  const PAGE_SIZE = 20;

  // ── 메타데이터 로드 ─────────────────────────────────────────

  const loadMeta = useCallback(async () => {
    const [catData, pmData] = await Promise.all([
      apiFetch<{ categories: LedgerCategory[] }>("/api/ledger/categories"),
      apiFetch<{ methods: LedgerPaymentMethod[] }>("/api/ledger/payment-methods"),
    ]);
    setCategories(catData.categories);
    setPaymentMethods(pmData.methods);
  }, []);

  useEffect(() => {
    loadMeta().catch(() => { /* 실패 시 빈 목록 유지 */ });
  }, [loadMeta]);

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
      // 상세 패널이 열려 있던 항목이면 닫기
      if (detailEntry?.id === entry.id) setDetailEntry(null);
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

  // ── CSV 내보내기 ─────────────────────────────────────────────

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month) });
      if (filterType !== "all") params.set("type", filterType);
      const res = await apiFetchRaw(`/api/ledger/entries/export?${params}`);
      if (!res.ok) throw new Error("내보내기 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger-${year}${String(month).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setViewError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

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
      label: "수단",
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
      width: "120px",
      render: (_v, row) => (
        <div className="ledger-cell-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ledger-action-btn"
            onClick={() => setDetailEntry(row as unknown as LedgerEntry)}
          >
            보기
          </button>
          <button
            type="button"
            className="ledger-action-btn edit"
            onClick={() => openEdit(row as unknown as LedgerEntry)}
          >
            수정
          </button>
          <button
            type="button"
            className="ledger-action-btn delete"
            disabled={deletingId === row.id}
            onClick={() => { void handleDelete(row as unknown as LedgerEntry); }}
          >
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
          <div className="ledger-header-actions">
            <Button variant="ghost" size="sm" onClick={() => setManageOpen(true)}>
              카테고리·수단
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
              CSV 가져오기
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { void handleExport(); }}
              loading={exporting}
              disabled={exporting}
            >
              CSV 내보내기
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>+ 추가</Button>
          </div>
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

      {/* 필터 탭 + 뷰 모드 토글 */}
      <div className="ledger-toolbar-row">
        <div className="ledger-filter-tabs">
          {(["all", "income", "expense"] as const).map((t) => (
            <button key={t} type="button"
              className={`ledger-filter-tab ${filterType === t ? "active" : ""}`}
              onClick={() => setFilterType(t)}>
              {t === "all" ? "전체" : t === "income" ? "수입" : "지출"}
            </button>
          ))}
        </div>

        <div className="ledger-view-toggle">
          <button
            type="button"
            className={`ledger-view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            목록
          </button>
          <button
            type="button"
            className={`ledger-view-toggle-btn ${viewMode === "chart" ? "active" : ""}`}
            onClick={() => setViewMode("chart")}
          >
            차트
          </button>
        </div>
      </div>

      {/* 에러 */}
      {viewError && (
        <Alert variant="error" onClose={() => setViewError(null)}>{viewError}</Alert>
      )}

      {/* 목록 or 차트 */}
      {viewMode === "list" ? (
        loadingEntries ? (
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
        )
      ) : (
        <ChartView summary={summary} loading={loadingSummary} categories={categories} />
      )}

      {/* 총 건수 표시 (목록 모드, 페이지네이션 외부) */}
      {viewMode === "list" && !loadingEntries && total > PAGE_SIZE && (
        <p className="ledger-total-hint">전체 {total.toLocaleString()}건 중 {PAGE_SIZE}건씩 표시</p>
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

      {/* 카테고리·결제수단 관리 모달 */}
      {manageOpen && (
        <ManageModal
          categories={categories}
          paymentMethods={paymentMethods}
          onClose={() => setManageOpen(false)}
          onChanged={loadMeta}
        />
      )}

      {/* CSV 가져오기 모달 */}
      {importOpen && (
        <CsvImportModal
          onClose={() => setImportOpen(false)}
          onImported={async () => {
            await loadEntries();
            await loadSummary();
          }}
        />
      )}

      {/* 항목 상세 패널 */}
      {detailEntry && (
        <EntryDetailPanel
          entry={detailEntry}
          deleting={deletingId === detailEntry.id}
          onClose={() => setDetailEntry(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onEntryUpdated={(updated) => {
            setDetailEntry(updated);
            setEntries((prev) =>
              prev.map((e) => (e.id === updated.id ? (updated as EntryRow) : e)),
            );
          }}
        />
      )}

    </div>
  );
}
