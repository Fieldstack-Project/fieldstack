export type HomeViewState = "ready" | "loading" | "empty" | "error";

interface HomeViewProps {
  homeState: HomeViewState;
  onChangeHomeState: (state: HomeViewState) => void;
}

export function HomeView({ homeState, onChangeHomeState }: HomeViewProps) {
  const statusMeta = {
    ready: { chip: "chip-ready", label: "Ready", desc: "Core dashboard is available and interactive." },
    loading: {
      chip: "chip-loading",
      label: "Loading",
      desc: "Data is being prepared. Use this state while waiting for API responses.",
    },
    empty: { chip: "chip-empty", label: "Empty", desc: "No module data yet. Show CTA links for first actions." },
    error: { chip: "chip-error", label: "Error", desc: "Request failed. Keep retry and summary guidance visible." },
  }[homeState];

  return (
    <section className="panel" aria-labelledby="home-title">
      <h1 className="title" id="home-title">
        Home
      </h1>
      <p className="subtitle">설치 이후 기본 허브 화면 구조(요약/액션/상태)를 검증합니다.</p>
      <div className="stack">
        <div className="grid">
          <article className="status status-ready">
            <h3>Quick Action</h3>
            <p>새 모듈 탐색, 설정 이동, 로그아웃 같은 핵심 행동 진입점.</p>
          </article>
          <article className="status status-loading">
            <h3>Recent Activity</h3>
            <p>설치/인증/설정 변경 이벤트 피드 위치.</p>
          </article>
        </div>
        <div className={`status status-${homeState}`} aria-live="polite">
          <h3>
            View State <span className={`chip ${statusMeta.chip}`}>{statusMeta.label}</span>
          </h3>
          <p>{statusMeta.desc}</p>
        </div>
        <div className="actions">
          <button className="button" type="button" onClick={() => onChangeHomeState("ready")}>
            Ready
          </button>
          <button className="button" type="button" onClick={() => onChangeHomeState("loading")}>
            Loading
          </button>
          <button className="button" type="button" onClick={() => onChangeHomeState("empty")}>
            Empty
          </button>
          <button className="button button-danger" type="button" onClick={() => onChangeHomeState("error")}>
            Error
          </button>
        </div>
      </div>
    </section>
  );
}
