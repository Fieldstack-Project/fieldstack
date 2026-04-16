import type { DbProvider } from '../../db/index.js';
import type { WhitelistRule, WhitelistService } from '../index.js';

export class WhitelistServiceImpl implements WhitelistService {
  public constructor(private readonly db: DbProvider) {}

  public async listRules(): Promise<WhitelistRule[]> {
    type Row = { id: string; type: string; value: string; enabled: boolean };
    const rows = await this.db.query<Row>(
      'SELECT id, type, value, enabled FROM whitelist_rules ORDER BY created_at',
    );
    return rows as WhitelistRule[];
  }

  public async addRule(rule: Omit<WhitelistRule, 'id'>): Promise<WhitelistRule> {
    type Row = { id: string; type: string; value: string; enabled: boolean };
    const [row] = await this.db.query<Row>(
      `INSERT INTO whitelist_rules (type, value, enabled)
       VALUES ($1, $2, $3)
       RETURNING id, type, value, enabled`,
      [rule.type, rule.value, rule.enabled],
    );
    return row as WhitelistRule;
  }

  public async removeRule(ruleId: string): Promise<void> {
    await this.db.query('DELETE FROM whitelist_rules WHERE id = $1', [ruleId]);
  }

  public async isAllowed(email: string): Promise<boolean> {
    const rules = await this.listRules();
    const active = rules.filter((r) => r.enabled);
    // 활성 룰이 없으면 전체 허용 — 의도된 동작.
    // Setup 직후나 룰을 모두 비활성화한 경우에도 로그인이 막히지 않도록 하기 위함.
    // 보안을 강화하려면 룰을 명시적으로 추가해야 한다.
    if (active.length === 0) return true;

    const domain = email.split('@')[1] ?? '';
    return active.some((r) => {
      if (r.type === 'email') return r.value.toLowerCase() === email.toLowerCase();
      if (r.type === 'domain') return r.value.toLowerCase() === domain.toLowerCase();
      return false;
    });
  }
}
