import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ko from './locales/ko.json';
import en from './locales/en.json';

const savedLang = (() => {
  try { return localStorage.getItem('fs_language') ?? undefined; } catch { return undefined; }
})();

i18n
  .use(initReactI18next)
  .init({
    lng: savedLang ?? 'ko',
    fallbackLng: 'ko',
    resources: {
      ko: { common: ko },
      en: { common: en },
    },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;

/** 언어 변경 + localStorage 저장 */
export function changeLanguage(lang: string): Promise<void> {
  try { localStorage.setItem('fs_language', lang); } catch { /* ignore */ }
  return i18n.changeLanguage(lang).then(() => undefined);
}
