/**
 * 모듈별 사이드바 서브 네비게이션 정의
 *
 * key: "" → 모듈 기본 뷰 (#ledger)
 * key: "xxx" → 서브 뷰 (#ledger/xxx)
 *
 * 새 모듈을 추가할 때 여기에 항목을 등록한다.
 */

export interface ModuleSubRoute {
  key: string;
  label: string;
  icon?: string;
}

export const MODULE_SUB_NAV: Record<string, ModuleSubRoute[]> = {
  // 서브 네비 항목은 추후 계획 후 등록
};
