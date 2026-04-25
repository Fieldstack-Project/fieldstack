import { useEffect, useState } from "react";
import "./subscription.css";

import {
  Alert,
  Button,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Spinner,
  Textarea,
} from "@fieldstack/controls";
import { apiCall } from "../../../apps/web/src/lib/apiFetch";
import { registerModuleLocale } from "../../../apps/web/src/i18n/registerModuleLocale";

import koLocale from "./locales/ko.json";
import enLocale from "./locales/en.json";

registerModuleLocale("subscription", koLocale, enLocale);

// ── 타입 ──────────────────────────────────────────────────────────

type BillingCycle = "monthly" | "yearly";
type Currency = "KRW" | "USD" | "EUR" | "JPY" | "GBP";
type HistoryEventType = "price_change" | "cancelled" | "resumed" | "plan_change" | "memo";

interface Subscription {
  id: string;
  serviceName: string;
  currentAmount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  billingDay: number;
  startedAt: string;
  nextPaymentDate: string;
  isActive: boolean;
  cancelledAt: string | null;
  category: string | null;
  description: string | null;
  url: string | null;
  tags: string[];
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

interface HistoryEvent {
  id: string;
  subscriptionId: string;
  eventType: HistoryEventType;
  effectiveDate: string;
  amount: number | null;
  currency: Currency | null;
  reason: string | null;
  note: string | null;
  createdAt: string;
}

interface Summary {
  totalMonthlyKrw: number;
  totalYearlyKrw: number;
  activeCount: number;
  inactiveCount: number;
  nextPaymentDate: string | null;
  nextPaymentServices: string[];
}

interface SubscriptionNote {
  id: string;
  subscriptionId: string;
  content: string;
  createdAt: string;
}

interface CumulativeResult {
  currency: Currency;
  totalPaid: number;
  currentPricePaid: number;
  priceChangeCount: number;
  averageMonthly: number;
  daysSinceStart: number;
  activeDays?: number;
}

// ── 상수 ──────────────────────────────────────────────────────────

const CURRENCY_OPTIONS = [
  { value: "KRW", label: "KRW (₩)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "GBP", label: "GBP (£)" },
];

const BILLING_CYCLE_OPTIONS = [
  { value: "monthly", label: "월간" },
  { value: "yearly",  label: "연간" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "price_change", label: "가격 변경" },
  { value: "cancelled",    label: "구독 해지" },
  { value: "resumed",      label: "구독 재개" },
  { value: "plan_change",  label: "플랜 변경" },
  { value: "memo",         label: "메모/기록" },
];

const PRICE_CHANGE_REASON_OPTIONS = [
  { value: "",               label: "선택 안 함" },
  { value: "가격 인상",     label: "가격 인상" },
  { value: "프로모션 종료", label: "프로모션 종료" },
  { value: "기타",           label: "기타" },
];

const EVENT_TYPE_LABELS: Record<HistoryEventType, string> = {
  price_change: "가격 변경",
  cancelled:    "구독 해지",
  resumed:      "구독 재개",
  plan_change:  "플랜 변경",
  memo:         "메모/기록",
};

const EVENT_TYPE_DOT_CLASS: Record<HistoryEventType, string> = {
  price_change: "dot-price",
  cancelled:    "dot-cancelled",
  resumed:      "dot-resumed",
  plan_change:  "dot-plan",
  memo:         "dot-memo",
};

const CYCLE_LABELS: Record<BillingCycle, string> = { monthly: "월간", yearly: "연간" };

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  KRW: "₩", USD: "$", EUR: "€", JPY: "¥", GBP: "£",
};

function formatAmount(amount: number, currency: Currency): string {
  const sym = CURRENCY_SYMBOLS[currency];
  if (currency === "KRW" || currency === "JPY") {
    return `${sym}${Math.round(amount).toLocaleString()}`;
  }
  return `${sym}${amount.toFixed(2)}`;
}

function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString()}`;
}

function formatDuration(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0 && months > 0) return `${years}년 ${months}개월 (${days.toLocaleString()}일)`;
  if (years > 0) return `${years}년 (${days.toLocaleString()}일)`;
  if (months > 0) return `${months}개월 (${days.toLocaleString()}일)`;
  return `${days.toLocaleString()}일`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── 빈 폼 ─────────────────────────────────────────────────────────

function emptyForm() {
  return {
    serviceName: "",
    currentAmount: "",
    currency: "KRW" as Currency,
    billingCycle: "monthly" as BillingCycle,
    billingDay: "1",
    startedAt: todayStr(),
    category: "",
    url: "",
  };
}

function emptyHistoryForm() {
  return {
    eventType: "price_change" as HistoryEventType,
    effectiveDate: todayStr(),
    amount: "",
    currency: "KRW" as Currency,
    reason: "",
    note: "",
  };
}

// ── SubscriptionView ───────────────────────────────────────────────

export function SubscriptionView() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 상세 패널
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [cumulative, setCumulative] = useState<CumulativeResult | null>(null);
  const [notes, setNotes] = useState<SubscriptionNote[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // 모달
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 폼 상태
  const [form, setForm] = useState(emptyForm());
  const [historyForm, setHistoryForm] = useState(emptyHistoryForm());

  // ── 데이터 로드 ──────────────────────────────────────────────

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [subsData, sumData] = await Promise.all([
        apiCall<Subscription[]>("/api/subscription/services"),
        apiCall<Summary>("/api/subscription/summary"),
      ]);
      setSubs(subsData ?? []);
      setSummary(sumData ?? null);
    } catch {
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);

  async function loadDetail(sub: Subscription) {
    setSelected(sub);
    setHistory([]);
    setCumulative(null);
    setNotes([]);
    setNoteInput("");
    setDetailLoading(true);
    try {
      const [histData, cumData, notesData] = await Promise.all([
        apiCall<HistoryEvent[]>(`/api/subscription/services/${sub.id}/history`),
        apiCall<CumulativeResult>(`/api/subscription/services/${sub.id}/cumulative`),
        apiCall<SubscriptionNote[]>(`/api/subscription/services/${sub.id}/notes`),
      ]);
      setHistory(histData ?? []);
      setCumulative(cumData ?? null);
      setNotes(notesData ?? []);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAddNote() {
    if (!selected || !noteInput.trim()) return;
    setNoteSaving(true);
    try {
      const note = await apiCall<SubscriptionNote>(`/api/subscription/services/${selected.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: noteInput.trim() }),
      });
      if (note) setNotes((prev) => [note, ...prev]);
      setNoteInput("");
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleDeleteHistory(historyId: string) {
    if (!selected) return;
    await apiCall(`/api/subscription/services/${selected.id}/history/${historyId}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((h) => h.id !== historyId));
  }

  async function handleDeleteNote(noteId: string) {
    if (!selected) return;
    await apiCall(`/api/subscription/services/${selected.id}/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  // ── 추가 ─────────────────────────────────────────────────────

  function openAdd() {
    setForm(emptyForm());
    setFormError(null);
    setAddOpen(true);
  }

  async function handleAdd() {
    if (!form.serviceName.trim()) { setFormError("서비스명을 입력해주세요."); return; }
    const amount = parseFloat(form.currentAmount);
    if (isNaN(amount) || amount < 0) { setFormError("금액을 올바르게 입력해주세요."); return; }
    const day = parseInt(form.billingDay);
    if (isNaN(day) || day < 1 || day > 31) { setFormError("결제일은 1~31 사이여야 합니다."); return; }

    setSaving(true);
    setFormError(null);
    try {
      await apiCall("/api/subscription/services", {
        method: "POST",
        body: JSON.stringify({
          serviceName: form.serviceName.trim(),
          currentAmount: amount,
          currency: form.currency,
          billingCycle: form.billingCycle,
          billingDay: day,
          startedAt: form.startedAt || undefined,
          category: form.category || undefined,
          url: form.url || undefined,
        }),
      });
      setAddOpen(false);
      await loadAll();
    } catch {
      setFormError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ── 수정 ─────────────────────────────────────────────────────

  function openEdit() {
    if (!selected) return;
    setForm({
      serviceName: selected.serviceName,
      currentAmount: String(selected.currentAmount),
      currency: selected.currency,
      billingCycle: selected.billingCycle,
      billingDay: String(selected.billingDay),
      startedAt: selected.startedAt,
      category: selected.category ?? "",
      url: selected.url ?? "",
    });
    setFormError(null);
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!selected) return;
    const day = parseInt(form.billingDay);
    if (isNaN(day) || day < 1 || day > 31) { setFormError("결제일은 1~31 사이여야 합니다."); return; }

    setSaving(true);
    setFormError(null);
    try {
      await apiCall(`/api/subscription/services/${selected.id}`, {
        method: "PUT",
        body: JSON.stringify({
          serviceName: form.serviceName.trim() || undefined,
          currency: form.currency,
          billingCycle: form.billingCycle,
          billingDay: day,
          category: form.category || undefined,
          url: form.url || undefined,
        }),
      });
      setEditOpen(false);
      await loadAll();
      const updated = await apiCall<Subscription>(`/api/subscription/services/${selected.id}`);
      if (updated) setSelected(updated);
    } catch {
      setFormError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ── 활성화 토글 ──────────────────────────────────────────────

  async function handleToggleActive() {
    if (!selected) return;
    const nowActive = selected.isActive;
    await apiCall(`/api/subscription/services/${selected.id}`, {
      method: "PUT",
      body: JSON.stringify({
        isActive: !nowActive,
        cancelledAt: nowActive ? todayStr() : null,
      }),
    });
    // 히스토리 자동 기록
    await apiCall(`/api/subscription/services/${selected.id}/history`, {
      method: "POST",
      body: JSON.stringify({
        eventType: nowActive ? "cancelled" : "resumed",
        effectiveDate: todayStr(),
      }),
    });
    setSelected(null);
    await loadAll();
  }

  // ── 히스토리 추가 ─────────────────────────────────────────────

  function openHistory() {
    if (!selected) return;
    setHistoryForm({
      ...emptyHistoryForm(),
      amount: String(selected.currentAmount),
      currency: selected.currency,
    });
    setFormError(null);
    setHistoryOpen(true);
  }

  async function handleAddHistory() {
    if (!selected) return;
    const isAmountEvent = historyForm.eventType === "price_change" || historyForm.eventType === "plan_change";

    if (isAmountEvent) {
      const amount = parseFloat(historyForm.amount);
      if (isNaN(amount) || amount < 0) { setFormError("금액을 올바르게 입력해주세요."); return; }
    }

    setSaving(true);
    setFormError(null);
    try {
      const isAmountEvent = historyForm.eventType === "price_change" || historyForm.eventType === "plan_change";
      const amount = parseFloat(historyForm.amount);
      await apiCall(`/api/subscription/services/${selected.id}/history`, {
        method: "POST",
        body: JSON.stringify({
          eventType: historyForm.eventType,
          effectiveDate: historyForm.effectiveDate,
          ...(isAmountEvent && { amount, currency: historyForm.currency }),
          reason: historyForm.reason || undefined,
          note: historyForm.note || undefined,
        }),
      });
      setHistoryOpen(false);
      await loadAll();
      await loadDetail(selected);
    } catch {
      setFormError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ── 삭제 ─────────────────────────────────────────────────────

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await apiCall(`/api/subscription/services/${selected.id}`, { method: "DELETE" });
      setDeleteOpen(false);
      setSelected(null);
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className="panel">
        <div className="sub-header"><h2>정기 구독</h2></div>
        <div className="sub-summary-row">
          {[1,2,3].map((i) => <Skeleton key={i} variant="rect" height={80} />)}
        </div>
        <div className="sub-grid">
          {[1,2,3].map((i) => <Skeleton key={i} variant="rect" height={130} />)}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="sub-header">
          <h2>정기 구독</h2>
          <Button variant="primary" size="sm" onClick={openAdd}>+ 구독 추가</Button>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem" }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {summary && (
          <div className="sub-summary-row">
            <div className="sub-stat-card">
              <div className="stat-label">월간 구독료</div>
              <div className="stat-value">{formatKrw(summary.totalMonthlyKrw)}</div>
              <div className="stat-sub">연간 {formatKrw(summary.totalYearlyKrw)}</div>
            </div>
            <div className="sub-stat-card">
              <div className="stat-label">활성 구독</div>
              <div className="stat-value">{summary.activeCount}개</div>
              <div className="stat-sub">비활성 {summary.inactiveCount}개</div>
            </div>
            <div className="sub-stat-card">
              <div className="stat-label">다음 결제일</div>
              <div className="stat-value">
                {summary.nextPaymentDate ? `D-${daysUntil(summary.nextPaymentDate)}` : "—"}
              </div>
              <div className="stat-sub">
                {summary.nextPaymentServices.slice(0, 2).join(", ") || "—"}
              </div>
            </div>
          </div>
        )}

        {subs.length === 0 ? (
          <EmptyState
            icon="💳"
            title="구독 서비스가 없습니다"
            description="+ 구독 추가 버튼으로 첫 구독을 등록해보세요."
          />
        ) : (
          <div className="sub-grid">
            {subs.map((sub) => {
              const days = daysUntil(sub.nextPaymentDate);
              return (
                <div
                  key={sub.id}
                  className={`sub-card${sub.isActive ? "" : " inactive"}`}
                  onClick={() => void loadDetail(sub)}
                >
                  <div className="sub-card-top">
                    <span className="sub-card-name">{sub.serviceName}</span>
                    <span className={`sub-badge ${sub.isActive ? "active" : "inactive"}`}>
                      {sub.isActive ? "활성" : "비활성"}
                    </span>
                  </div>
                  <div className="sub-card-amount">
                    {formatAmount(sub.currentAmount, sub.currency)}
                    <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.35rem" }}>
                      / {CYCLE_LABELS[sub.billingCycle]}
                    </span>
                  </div>
                  <div className="sub-card-meta">
                    {sub.category && <span>{sub.category}</span>}
                    <span className={days <= 3 ? "next-date" : ""}>
                      다음 결제 {sub.nextPaymentDate} {sub.isActive ? `(D-${days})` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 상세 패널 ─────────────────────────────────── */}
      {selected && (
        <div className="sub-detail-overlay" onClick={() => setSelected(null)}>
          <div className="sub-detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sub-detail-header">
              <div>
                <h3>{selected.serviceName}</h3>
                <span
                  className={`sub-badge ${selected.isActive ? "active" : "inactive"}`}
                  style={{ marginTop: 4, display: "inline-block" }}
                >
                  {selected.isActive ? "활성" : "비활성"}
                </span>
              </div>
              <div className="sub-detail-header-actions">
                <Button size="sm" variant="ghost" onClick={openHistory}>+ 히스토리</Button>
                <Button size="sm" variant="ghost" onClick={openEdit}>수정</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>✕</Button>
              </div>
            </div>

            <div className="sub-detail-body">
              <div className="sub-detail-section">
                <h4>기본 정보</h4>
                <div className="sub-detail-grid">
                  <div className="sub-detail-item">
                    <div className="di-label">현재 금액</div>
                    <div className="di-value">{formatAmount(selected.currentAmount, selected.currency)}</div>
                  </div>
                  <div className="sub-detail-item">
                    <div className="di-label">결제 주기</div>
                    <div className="di-value">{CYCLE_LABELS[selected.billingCycle]} · 매 {selected.billingDay}일</div>
                  </div>
                  <div className="sub-detail-item">
                    <div className="di-label">다음 결제일</div>
                    <div className="di-value">{selected.nextPaymentDate}</div>
                  </div>
                  <div className="sub-detail-item">
                    <div className="di-label">구독 시작일</div>
                    <div className="di-value">{selected.startedAt}</div>
                  </div>
                  <div className="sub-detail-item">
                    <div className="di-label">카테고리</div>
                    <div className="di-value">{selected.category ?? "—"}</div>
                  </div>
                  {selected.url && (
                    <div className="sub-detail-item" style={{ gridColumn: "1 / -1" }}>
                      <div className="di-label">URL</div>
                      <div className="di-value">
                        <a href={selected.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--accent)", wordBreak: "break-all" }}>
                          {selected.url}
                        </a>
                      </div>
                    </div>
                  )}
                  {selected.description && (
                    <div className="sub-detail-item" style={{ gridColumn: "1 / -1" }}>
                      <div className="di-label">비고</div>
                      <div className="di-value" style={{ whiteSpace: "pre-wrap" }}>
                        {selected.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sub-divider" />

              <div className="sub-detail-section">
                <h4>누적 통계</h4>
                {detailLoading ? (
                  <Skeleton variant="rect" height={100} />
                ) : cumulative ? (
                  <div className="sub-cumulative-grid">
                    <div className="sub-cumul-item">
                      <div className="ci-label">전체 누적</div>
                      <div className="ci-value">{formatAmount(cumulative.totalPaid, cumulative.currency)}</div>
                    </div>
                    <div className="sub-cumul-item">
                      <div className="ci-label">현재 가격 누적</div>
                      <div className="ci-value">{formatAmount(cumulative.currentPricePaid, cumulative.currency)}</div>
                    </div>
                    <div className="sub-cumul-item">
                      <div className="ci-label">월 평균</div>
                      <div className="ci-value">{formatAmount(cumulative.averageMonthly, cumulative.currency)}</div>
                    </div>
                    <div className="sub-cumul-item">
                      <div className="ci-label">사용 기간</div>
                      <div className="ci-value">{formatDuration(cumulative.activeDays ?? cumulative.daysSinceStart)}</div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.82rem", color: "var(--text-faint)" }}>데이터 없음</span>
                )}
              </div>

              <div className="sub-divider" />

              <div className="sub-detail-section">
                <h4>히스토리</h4>
                {detailLoading ? (
                  <Skeleton variant="rect" height={80} />
                ) : history.length === 0 ? (
                  <span style={{ fontSize: "0.82rem", color: "var(--text-faint)" }}>히스토리 없음</span>
                ) : (
                  <div className="sub-history-timeline">
                    {[...history].reverse().map((h) => (
                      <div key={h.id} className="sub-history-item">
                        <div className={`sub-history-dot ${EVENT_TYPE_DOT_CLASS[h.eventType]}`} />
                        <div className="sub-history-content">
                          <div className="sub-history-event-type">{EVENT_TYPE_LABELS[h.eventType]}</div>
                          {h.amount !== null && h.currency !== null && (
                            <div className="sub-history-amount">{formatAmount(h.amount, h.currency)}</div>
                          )}
                          <div className="sub-history-date">적용일: {h.effectiveDate}</div>
                          {h.reason && <div className="sub-history-reason">{h.reason}</div>}
                          {h.note && <div className="sub-history-reason">{h.note}</div>}
                        </div>
                        <button
                          className="sub-note-del-btn"
                          onClick={() => void handleDeleteHistory(h.id)}
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sub-divider" />

              <div className="sub-detail-section">
                <h4>비고/메모</h4>
                <div className="sub-notes-table">
                  <div className="sub-note-input-row">
                    <input
                      className="sub-note-input"
                      placeholder="메모 입력 후 Enter 또는 추가 클릭"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleAddNote(); }}}
                      disabled={noteSaving}
                    />
                    <button
                      className="sub-note-add-btn"
                      onClick={() => void handleAddNote()}
                      disabled={noteSaving || !noteInput.trim()}
                    >
                      추가
                    </button>
                  </div>
                  {detailLoading ? (
                    <Skeleton variant="rect" height={60} />
                  ) : notes.length === 0 ? (
                    <div className="sub-note-empty">메모가 없습니다.</div>
                  ) : (
                    <table className="sub-note-list">
                      <tbody>
                        {notes.map((n) => (
                          <tr key={n.id}>
                            <td className="sub-note-date">
                              {new Date(n.createdAt).toLocaleDateString("ko-KR", {
                                year: "numeric", month: "2-digit", day: "2-digit",
                              })}
                            </td>
                            <td className="sub-note-content">{n.content}</td>
                            <td className="sub-note-delete">
                              <button
                                className="sub-note-del-btn"
                                onClick={() => void handleDeleteNote(n.id)}
                                title="삭제"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="sub-divider" />

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", padding: "1rem 0 0" }}>
                <Button size="sm" variant="ghost" onClick={() => void handleToggleActive()}>
                  {selected.isActive ? "구독 해지" : "구독 재개"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  style={{ color: "var(--err)" }}
                  onClick={() => setDeleteOpen(true)}
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 추가 모달 ─────────────────────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="구독 추가"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={saving}>취소</Button>
            <Button variant="primary" onClick={() => void handleAdd()} disabled={saving}>
              {saving ? <Spinner size="sm" /> : "저장"}
            </Button>
          </>
        }
      >
        <SubscriptionForm form={form} onChange={setForm} error={formError} />
      </Modal>

      {/* ── 수정 모달 ─────────────────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="구독 수정"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>취소</Button>
            <Button variant="primary" onClick={() => void handleEdit()} disabled={saving}>
              {saving ? <Spinner size="sm" /> : "저장"}
            </Button>
          </>
        }
      >
        <SubscriptionForm form={form} onChange={setForm} error={formError} />
      </Modal>

      {/* ── 히스토리 추가 모달 ───────────────────────── */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="히스토리 추가"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setHistoryOpen(false)} disabled={saving}>취소</Button>
            <Button variant="primary" onClick={() => void handleAddHistory()} disabled={saving}>
              {saving ? <Spinner size="sm" /> : "저장"}
            </Button>
          </>
        }
      >
        <div className="sub-form">
          {formError && <Alert variant="error">{formError}</Alert>}
          <FormField label="이벤트 유형" required>
            <Select
              options={EVENT_TYPE_OPTIONS}
              value={historyForm.eventType}
              onChange={(e) => setHistoryForm((p) => ({
                ...p,
                eventType: e.target.value as HistoryEventType,
              }))}
            />
          </FormField>
          <FormField label="적용일" required>
            <Input
              type="date"
              value={historyForm.effectiveDate}
              onChange={(e) => setHistoryForm((p) => ({ ...p, effectiveDate: e.target.value }))}
            />
          </FormField>
          {(historyForm.eventType === "price_change" || historyForm.eventType === "plan_change") && (
            <div className="sub-form-row">
              <FormField label="금액" required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={historyForm.amount}
                  onChange={(e) => setHistoryForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </FormField>
              <FormField label="통화">
                <Select
                  options={CURRENCY_OPTIONS}
                  value={historyForm.currency}
                  onChange={(e) => setHistoryForm((p) => ({ ...p, currency: e.target.value as Currency }))}
                />
              </FormField>
            </div>
          )}
          {historyForm.eventType === "price_change" && (
            <FormField label="변경 사유">
              <Select
                options={PRICE_CHANGE_REASON_OPTIONS}
                value={historyForm.reason}
                onChange={(e) => setHistoryForm((p) => ({ ...p, reason: e.target.value }))}
              />
            </FormField>
          )}
          <FormField label="메모">
            <Textarea
              rows={2}
              value={historyForm.note}
              onChange={(e) => setHistoryForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="추가 메모 (선택)"
            />
          </FormField>
        </div>
      </Modal>

      {/* ── 삭제 확인 모달 ───────────────────────────── */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="구독 삭제"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={saving}>취소</Button>
            <Button
              variant="primary"
              style={{ background: "var(--err)", borderColor: "var(--err)" }}
              onClick={() => void handleDelete()}
              disabled={saving}
            >
              {saving ? <Spinner size="sm" /> : "삭제"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          <strong style={{ color: "var(--text)" }}>{selected?.serviceName}</strong> 구독을 삭제하면
          히스토리도 함께 삭제됩니다. 계속하시겠습니까?
        </p>
      </Modal>
    </>
  );
}

// ── 공통 폼 컴포넌트 ──────────────────────────────────────────────

type FormState = ReturnType<typeof emptyForm>;

function SubscriptionForm({
  form,
  onChange,
  error,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  error: string | null;
}) {
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [key]: e.target.value });

  return (
    <div className="sub-form">
      {error && <Alert variant="error">{error}</Alert>}
      <FormField label="서비스명" required>
        <Input
          value={form.serviceName}
          onChange={set("serviceName")}
          placeholder="Netflix, Spotify..."
        />
      </FormField>
      <div className="sub-form-row">
        <FormField label="금액" required>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.currentAmount}
            onChange={set("currentAmount")}
          />
        </FormField>
        <FormField label="통화">
          <Select
            options={CURRENCY_OPTIONS}
            value={form.currency}
            onChange={(e) => onChange({ ...form, currency: e.target.value as Currency })}
          />
        </FormField>
      </div>
      <div className="sub-form-row">
        <FormField label="결제 주기">
          <Select
            options={BILLING_CYCLE_OPTIONS}
            value={form.billingCycle}
            onChange={(e) => onChange({ ...form, billingCycle: e.target.value as BillingCycle })}
          />
        </FormField>
        <FormField label="결제일" required>
          <Input
            type="number"
            min={1}
            max={31}
            value={form.billingDay}
            onChange={set("billingDay")}
            placeholder="1~31"
          />
        </FormField>
      </div>
      <FormField label="구독 시작일" required>
        <Input
          type="date"
          value={form.startedAt}
          onChange={set("startedAt")}
        />
      </FormField>
      <FormField label="카테고리">
        <Input
          value={form.category}
          onChange={set("category")}
          placeholder="스트리밍, 클라우드..."
        />
      </FormField>
      <FormField label="URL">
        <Input
          value={form.url}
          onChange={set("url")}
          placeholder="https://..."
        />
      </FormField>
    </div>
  );
}
