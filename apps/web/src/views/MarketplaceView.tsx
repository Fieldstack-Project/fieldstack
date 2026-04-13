import { EmptyState } from "@fieldstack/controls";

export function MarketplaceView() {
  return (
    <section className="panel" aria-labelledby="marketplace-title">
      <EmptyState
        icon="⬡"
        title="Marketplace"
        description="모듈 탐색, 설치, 관리 기능은 Phase 3에서 제공됩니다."
      />
    </section>
  );
}
