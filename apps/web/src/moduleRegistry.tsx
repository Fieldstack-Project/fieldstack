import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { registerModuleLocale } from "./i18n/registerModuleLocale";
import ledgerKoLocale from "../../../modules/ledger/frontend/locales/ko.json";
import ledgerEnLocale from "../../../modules/ledger/frontend/locales/en.json";
import subscriptionKoLocale from "../../../modules/subscription/frontend/locales/ko.json";
import subscriptionEnLocale from "../../../modules/subscription/frontend/locales/en.json";

// 모듈 서브 네비게이션 항목 정의.
// key: "" 이면 모듈 기본 화면, "import" 같은 값이면 #module/import 형태로 이동한다.
export interface ModuleSubRoute {
  key: string;
  label: string;
  icon?: string;
}

// AppShell -> 모듈 화면으로 전달되는 공통 props.
export interface ModuleViewProps {
  subRoute: string;
}

type ModuleViewComponent = ComponentType<ModuleViewProps>;

interface ModuleDefinition {
  // lazy 컴포넌트와 별도로 보관하는 원본 loader.
  // 첫 진입 전 preload 시 이 함수를 사용한다.
  load: () => Promise<unknown>;
  component: LazyExoticComponent<ModuleViewComponent>;
  subNav: ModuleSubRoute[];
  locale: {
    ko: Record<string, unknown>;
    en: Record<string, unknown>;
  };
}

// 동적 import 함수는 lazy 로더와 preload 양쪽에서 재사용한다.
const loadLedgerModule = () => import("../../../modules/ledger/frontend/LedgerView");
const loadSubscriptionModule = () => import("../../../modules/subscription/frontend/SubscriptionView");

const LedgerModuleView = lazy(async () => {
  const module = await loadLedgerModule();
  const LedgerRouteComponent: ModuleViewComponent = ({ subRoute }) => (
    <module.LedgerView subRoute={subRoute} />
  );
  return { default: LedgerRouteComponent };
});

const SubscriptionModuleView = lazy(async () => {
  const module = await loadSubscriptionModule();
  const SubscriptionRouteComponent: ModuleViewComponent = () => <module.SubscriptionView />;
  return { default: SubscriptionRouteComponent };
});

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  ledger: {
    load: loadLedgerModule,
    component: LedgerModuleView,
    subNav: [],
    locale: {
      ko: ledgerKoLocale,
      en: ledgerEnLocale,
    },
  },
  subscription: {
    load: loadSubscriptionModule,
    component: SubscriptionModuleView,
    subNav: [],
    locale: {
      ko: subscriptionKoLocale,
      en: subscriptionEnLocale,
    },
  },
};

// routeConfig에서 모듈 라우트 판단에 사용하는 단일 소스.
export const MODULE_ROUTES = Object.keys(MODULE_REGISTRY);

// AppShell이 요구하는 "모듈명 -> 서브네비 목록" 형태로 변환한다.
const moduleSubNav: Record<string, ModuleSubRoute[]> = {};
for (const [moduleName, definition] of Object.entries(MODULE_REGISTRY)) {
  moduleSubNav[moduleName] = definition.subNav;
}
export const MODULE_SUB_NAV = moduleSubNav;

export function getModuleView(route: string): LazyExoticComponent<ModuleViewComponent> | null {
  return MODULE_REGISTRY[route]?.component ?? null;
}

// 앱 부트 시 모듈 번역 리소스를 미리 등록해
// 첫 렌더에서 en -> ko로 바뀌는 깜빡임을 줄인다.
export function registerModuleLocales(): void {
  for (const [moduleName, definition] of Object.entries(MODULE_REGISTRY)) {
    registerModuleLocale(moduleName, definition.locale.ko, definition.locale.en);
  }
}

// 로그인 직후 idle 타이밍에 모듈 청크를 미리 받아서
// 모듈 첫 진입 시 lazy 로딩 대기 시간을 줄인다.
export async function preloadModuleViews(routeNames?: string[]): Promise<void> {
  const targets = routeNames ?? MODULE_ROUTES;
  const loaders = targets
    .map((routeName) => MODULE_REGISTRY[routeName]?.load)
    .filter((loader): loader is () => Promise<unknown> => loader !== undefined);
  await Promise.all(loaders.map((loader) => loader()));
}
