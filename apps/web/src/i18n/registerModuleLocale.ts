import i18n from './index';

/**
 * 모듈 번역 리소스를 i18next에 등록한다.
 * 각 모듈의 frontend/index.ts 또는 LedgerView.tsx 진입점에서 호출.
 *
 * @param moduleName  i18next 네임스페이스 (예: 'ledger')
 * @param ko          한국어 번역 객체
 * @param en          영어 번역 객체
 */
export function registerModuleLocale(
  moduleName: string,
  ko: Record<string, unknown>,
  en: Record<string, unknown>,
): void {
  if (!i18n.hasResourceBundle('ko', moduleName)) {
    i18n.addResourceBundle('ko', moduleName, ko);
  }
  if (!i18n.hasResourceBundle('en', moduleName)) {
    i18n.addResourceBundle('en', moduleName, en);
  }
}
