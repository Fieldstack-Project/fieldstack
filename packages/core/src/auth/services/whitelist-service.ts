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
    if (active.length === 0) return true; // 화이트리스트 비어있으면 전체 허용

    const domain = email.split('@')[1] ?? '';
    return active.some((r) => {
      if (r.type === 'email') return r.value.toLowerCase() === email.toLowerCase();
      if (r.type === 'domain') return r.value.toLowerCase() === domain.toLowerCase();
      return false;
    });
  }
}
