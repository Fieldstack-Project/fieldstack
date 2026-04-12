export function MarketplaceView() {
  return (
    <section className="panel" aria-labelledby="marketplace-title">
      <div style={{ textAlign: "center", padding: "80px 24px", display: "grid", gap: "12px" }}>
        <span style={{ fontSize: "40px", lineHeight: 1 }} aria-hidden="true">⬡</span>
        <h1
          id="marketplace-title"
          style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--text)" }}
        >
          Marketplace
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          모듈 탐색, 설치, 관리 기능은 Phase 3에서 제공됩니다.
        </p>
      </div>
    </section>
  );
}
