/**
 * @fieldstack/core/browser의 apiFetch를 re-export합니다.
 * 실제 구현은 packages/core/src/browser-fetch.ts에 있습니다.
 */
export { apiFetch, apiCall, setSessionExpiredHandler, FS_TOKEN, FS_REFRESH } from '@fieldstack/core/browser';
