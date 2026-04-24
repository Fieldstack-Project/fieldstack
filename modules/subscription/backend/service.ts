import type { DbProvider } from '@fieldstack/core' with { 'resolution-mode': 'import' };

import type {
  BillingCycle,
  CreateHistoryEventDto,
  CreateNoteDto,
  CreateSubscriptionDto,
  CumulativePeriod,
  CumulativeResult,
  HistoryEvent,
  HistoryEventType,
  Subscription,
  SubscriptionCurrency,
  SubscriptionNote,
  SubscriptionSummary,
  UpdateSubscriptionDto,
} from '../types/index.js';

// ── 날짜 유틸 ────────────────────────────────────────────────────

/** Date → YYYY-MM-DD (로컬 시간 기준, toISOString은 UTC 변환으로 KST에서 하루 밀림) */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** DB DATE 컬럼을 YYYY-MM-DD 문자열로 정규화 (Date 객체·문자열 모두 처리) */
function parseDateField(v: unknown): string {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
}

function calcNextPaymentDate(billingDay: number, billingCycle: BillingCycle, from?: string): string {
  const base = from ? new Date(from) : new Date();
  base.setHours(0, 0, 0, 0);

  const year = base.getFullYear();
  const month = base.getMonth();

  // 이번 달 결제일
  const thisMonth = new Date(year, month, Math.min(billingDay, daysInMonth(year, month)));

  if (thisMonth > base) {
    return toDateString(thisMonth);
  }

  // 다음 결제일 계산
  if (billingCycle === 'monthly') {
    const nextM = month + 1;
    const nextY = nextM > 11 ? year + 1 : year;
    const nm = nextM > 11 ? 0 : nextM;
    return toDateString(new Date(nextY, nm, Math.min(billingDay, daysInMonth(nextY, nm))));
  } else {
    // yearly: 1년 후
    const nextY = year + 1;
    return toDateString(new Date(nextY, month, Math.min(billingDay, daysInMonth(nextY, month))));
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ── SubscriptionService ───────────────────────────────────────────

export class SubscriptionService {
  constructor(private readonly db: DbProvider) {}

  // ── 구독 CRUD ─────────────────────────────────────────────────

  async create(userId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
    const nextPaymentDate = calcNextPaymentDate(dto.billingDay, dto.billingCycle);
    const tags = JSON.stringify(dto.tags ?? []);

    const startedAt = dto.startedAt ?? toDateString(new Date());

    const rows = await this.db.query<Subscription>(
      `INSERT INTO subscription_services
         (user_id, service_name, current_amount, currency, billing_cycle, billing_day,
          started_at, next_payment_date, is_active, category, description, url, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        userId,
        dto.serviceName,
        dto.currentAmount,
        dto.currency,
        dto.billingCycle,
        dto.billingDay,
        startedAt,
        nextPaymentDate,
        true,
        dto.category ?? null,
        dto.description ?? null,
        dto.url ?? null,
        tags,
      ],
    );

    const sub = this.mapRow(rows[0]);

    // 초기 가격을 히스토리에 기록 (구독 시작일 기준)
    await this.addHistoryEvent(userId, sub.id, {
      eventType: 'price_change',
      effectiveDate: startedAt,
      amount: dto.currentAmount,
      currency: dto.currency,
      reason: '최초 등록',
    });

    return sub;
  }

  async findAll(userId: string): Promise<Subscription[]> {
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM subscription_services WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findById(userId: string, id: string): Promise<Subscription | null> {
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM subscription_services WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto): Promise<Subscription | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    const billingDay = dto.billingDay ?? existing.billingDay;
    const billingCycle = dto.billingCycle ?? existing.billingCycle;
    // 기존 nextPaymentDate는 parseDateField로 YYYY-MM-DD 보장됨;
    // billingDay/billingCycle 변경 시에만 재계산
    const nextPaymentDate = (dto.billingDay !== undefined || dto.billingCycle !== undefined)
      ? calcNextPaymentDate(billingDay, billingCycle)
      : existing.nextPaymentDate;

    // cancelled_at: undefined → 기존 값 유지 / null → 명시적 null 설정 / 날짜 → 업데이트
    const cancelledAt = dto.cancelledAt !== undefined ? dto.cancelledAt : existing.cancelledAt;

    const tags = dto.tags !== undefined ? JSON.stringify(dto.tags) : undefined;

    const rows = await this.db.query<Record<string, unknown>>(
      `UPDATE subscription_services SET
         service_name      = COALESCE($3, service_name),
         current_amount    = COALESCE($4, current_amount),
         currency          = COALESCE($5, currency),
         billing_cycle     = COALESCE($6, billing_cycle),
         billing_day       = COALESCE($7, billing_day),
         next_payment_date = $8,
         is_active         = COALESCE($9, is_active),
         cancelled_at      = $10,
         category          = COALESCE($11, category),
         description       = COALESCE($12, description),
         url               = COALESCE($13, url),
         tags              = COALESCE($14, tags),
         updated_at        = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        userId,
        dto.serviceName ?? null,
        dto.currentAmount ?? null,
        dto.currency ?? null,
        dto.billingCycle ?? null,
        dto.billingDay ?? null,
        nextPaymentDate,
        dto.isActive ?? null,
        cancelledAt,
        dto.category ?? null,
        dto.description ?? null,
        dto.url ?? null,
        tags ?? null,
      ],
    );

    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM subscription_services WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId],
    );
    return rows.length > 0;
  }

  // ── 히스토리 이벤트 ──────────────────────────────────────────

  async addHistoryEvent(
    userId: string,
    subscriptionId: string,
    dto: CreateHistoryEventDto,
  ): Promise<HistoryEvent> {
    const owned = await this.db.query<{ id: string }>(
      `SELECT id FROM subscription_services WHERE id = $1 AND user_id = $2`,
      [subscriptionId, userId],
    );
    if (!owned.length) throw new Error('Forbidden');

    const isPriceChange = dto.eventType === 'price_change';
    const rows = await this.db.query<Record<string, unknown>>(
      `INSERT INTO subscription_price_history
         (subscription_id, event_type, effective_date, amount, currency, reason, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        subscriptionId,
        dto.eventType,
        dto.effectiveDate,
        isPriceChange ? (dto.amount ?? 0) : 0,
        isPriceChange ? (dto.currency ?? 'KRW') : 'KRW',
        dto.reason ?? null,
        dto.note ?? null,
      ],
    );

    if (isPriceChange && dto.amount !== undefined && dto.currency !== undefined) {
      await this.db.query(
        `UPDATE subscription_services
         SET current_amount = $1, currency = $2, updated_at = NOW()
         WHERE id = $3`,
        [dto.amount, dto.currency, subscriptionId],
      );
    }

    return this.mapHistoryRow(rows[0]);
  }

  async getHistory(subscriptionId: string): Promise<HistoryEvent[]> {
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM subscription_price_history
       WHERE subscription_id = $1
       ORDER BY effective_date ASC, created_at ASC`,
      [subscriptionId],
    );
    return rows.map((r) => this.mapHistoryRow(r));
  }

  async deleteHistoryEvent(userId: string, subscriptionId: string, historyId: string): Promise<boolean> {
    const owned = await this.db.query<{ id: string }>(
      `SELECT id FROM subscription_services WHERE id = $1 AND user_id = $2`,
      [subscriptionId, userId],
    );
    if (!owned.length) throw new Error('Forbidden');

    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM subscription_price_history
       WHERE id = $1 AND subscription_id = $2
       RETURNING id`,
      [historyId, subscriptionId],
    );
    return rows.length > 0;
  }

  /** @deprecated getHistory 사용 */
  async getPriceHistory(subscriptionId: string): Promise<HistoryEvent[]> {
    return this.getHistory(subscriptionId);
  }

  // ── 메모 ──────────────────────────────────────────────────────

  async getNotes(subscriptionId: string): Promise<SubscriptionNote[]> {
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM subscription_notes WHERE subscription_id = $1 ORDER BY created_at DESC`,
      [subscriptionId],
    );
    return rows.map((r) => this.mapNoteRow(r));
  }

  async addNote(subscriptionId: string, dto: CreateNoteDto): Promise<SubscriptionNote> {
    const rows = await this.db.query<Record<string, unknown>>(
      `INSERT INTO subscription_notes (subscription_id, content) VALUES ($1, $2) RETURNING *`,
      [subscriptionId, dto.content.trim()],
    );
    return this.mapNoteRow(rows[0]);
  }

  async deleteNote(subscriptionId: string, noteId: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM subscription_notes WHERE id = $1 AND subscription_id = $2 RETURNING id`,
      [noteId, subscriptionId],
    );
    return rows.length > 0;
  }

  // ── 누적 결제 금액 ────────────────────────────────────────────

  async getCumulative(userId: string, id: string): Promise<CumulativeResult | null> {
    const sub = await this.findById(userId, id);
    if (!sub) return null;

    const allHistory = await this.getHistory(id);
    const history = allHistory.filter((h) => h.eventType === 'price_change' && h.amount !== null);
    if (history.length === 0) return null;

    const startDate = new Date(sub.startedAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / 86400000);

    const periods: CumulativePeriod[] = [];
    let totalKrw = 0;

    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      const periodStart = new Date(h.effectiveDate);
      const periodEnd = history[i + 1] ? new Date(history[i + 1].effectiveDate) : today;

      const paymentCount = countPayments(sub.billingCycle, sub.billingDay, periodStart, periodEnd);
      const periodTotal = paymentCount * (h.amount ?? 0);

      periods.push({
        effectiveDate: h.effectiveDate,
        endDate: history[i + 1]?.effectiveDate ?? null,
        amount: h.amount,
        currency: h.currency,
        paymentCount,
        periodTotal,
      });

      totalKrw += periodTotal;
    }

    // 현재 가격 구간 누적
    const lastPeriod = periods[periods.length - 1];
    const currentPricePaid = lastPeriod?.periodTotal ?? 0;

    const monthsElapsed = Math.max(daysSinceStart / 30, 1);
    const averageMonthly = Math.round(totalKrw / monthsElapsed);

    return {
      subscriptionId: id,
      currency: sub.currency,
      totalPaid: Math.round(totalKrw),
      currentPricePaid: Math.round(currentPricePaid),
      priceChangeCount: Math.max(history.length - 1, 0),
      averageMonthly,
      daysSinceStart,
      periods,
    };
  }

  // ── 요약 통계 ────────────────────────────────────────────────

  async getSummary(userId: string): Promise<SubscriptionSummary> {
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM subscription_services WHERE user_id = $1`,
      [userId],
    );

    const subs = rows.map((r) => this.mapRow(r));
    const active = subs.filter((s) => s.isActive);
    const inactive = subs.filter((s) => !s.isActive);

    let totalMonthlyKrw = 0;
    for (const s of active) {
      const monthly = s.billingCycle === 'monthly' ? s.currentAmount : s.currentAmount / 12;
      totalMonthlyKrw += monthly;
    }

    // 가장 가까운 결제일
    const sorted = [...active].sort(
      (a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime(),
    );
    const nextDate = sorted[0]?.nextPaymentDate ?? null;
    const nextServices = nextDate
      ? sorted.filter((s) => s.nextPaymentDate === nextDate).map((s) => s.serviceName)
      : [];

    return {
      totalMonthlyKrw: Math.round(totalMonthlyKrw),
      totalYearlyKrw: Math.round(totalMonthlyKrw * 12),
      activeCount: active.length,
      inactiveCount: inactive.length,
      nextPaymentDate: nextDate,
      nextPaymentServices: nextServices,
    };
  }

  // ── 결제일 도래 구독 조회 (Scheduler용) ──────────────────────

  async findDueToday(): Promise<Subscription[]> {
    const today = toDateString(new Date());
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM subscription_services
       WHERE next_payment_date = $1 AND is_active = $2`,
      [today, true],
    );
    return rows.map((r) => this.mapRow(r));
  }

  /** 결제 처리 후 다음 결제일 갱신 */
  async advanceNextPaymentDate(id: string): Promise<void> {
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT billing_day, billing_cycle, next_payment_date FROM subscription_services WHERE id = $1`,
      [id],
    );
    if (!rows.length) return;

    const { billing_day, billing_cycle, next_payment_date } = rows[0] as {
      billing_day: number;
      billing_cycle: BillingCycle;
      next_payment_date: string;
    };

    const next = calcNextPaymentDate(billing_day, billing_cycle, next_payment_date);
    await this.db.query(
      `UPDATE subscription_services SET next_payment_date = $1, updated_at = NOW() WHERE id = $2`,
      [next, id],
    );
  }

  // ── 행 매핑 ──────────────────────────────────────────────────

  private mapRow(r: Record<string, unknown>): Subscription {
    return {
      id: r['id'] as string,
      userId: r['user_id'] as string,
      serviceName: r['service_name'] as string,
      currentAmount: Number(r['current_amount']),
      currency: r['currency'] as SubscriptionCurrency,
      billingCycle: r['billing_cycle'] as BillingCycle,
      billingDay: Number(r['billing_day']),
      startedAt: parseDateField(r['started_at']),
      nextPaymentDate: parseDateField(r['next_payment_date']),
      isActive: Boolean(r['is_active']),
      cancelledAt: r['cancelled_at'] ? parseDateField(r['cancelled_at']) : null,
      category: (r['category'] as string) ?? null,
      description: (r['description'] as string) ?? null,
      url: (r['url'] as string) ?? null,
      tags: (() => {
        try { return JSON.parse(r['tags'] as string) as string[]; } catch { return []; }
      })(),
      totalPaid: Number(r['total_paid']),
      createdAt: r['created_at'] as string,
      updatedAt: r['updated_at'] as string,
    };
  }

  private mapNoteRow(r: Record<string, unknown>): SubscriptionNote {
    return {
      id: r['id'] as string,
      subscriptionId: r['subscription_id'] as string,
      content: r['content'] as string,
      createdAt: r['created_at'] as string,
    };
  }

  private mapHistoryRow(r: Record<string, unknown>): HistoryEvent {
    const eventType = ((r['event_type'] as string) ?? 'price_change') as HistoryEventType;
    const isPriceChange = eventType === 'price_change';
    return {
      id: r['id'] as string,
      subscriptionId: r['subscription_id'] as string,
      eventType,
      effectiveDate: parseDateField(r['effective_date']),
      amount: isPriceChange ? Number(r['amount']) : null,
      currency: isPriceChange ? (r['currency'] as SubscriptionCurrency) : null,
      reason: (r['reason'] as string) ?? null,
      note: (r['note'] as string) ?? null,
      createdAt: r['created_at'] as string,
    };
  }
}

// ── 결제 횟수 계산 ────────────────────────────────────────────────

function countPayments(
  cycle: BillingCycle,
  billingDay: number,
  from: Date,
  to: Date,
): number {
  let count = 0;
  const cursor = new Date(from.getFullYear(), from.getMonth(), billingDay);

  while (cursor <= to) {
    if (cursor >= from) count++;
    if (cycle === 'monthly') {
      cursor.setMonth(cursor.getMonth() + 1);
    } else {
      cursor.setFullYear(cursor.getFullYear() + 1);
    }
  }
  return count;
}
