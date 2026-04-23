export type LogLevel = 'info' | 'warn' | 'error' | 'success';

// 운영에서는 ANSI 색상을 제거하고, 개발 환경에서만 색상을 적용한다.
const IS_COLOR_ENABLED = process.env['NODE_ENV'] !== 'production';

const LOG_COLORS = IS_COLOR_ENABLED
  ? {
      reset: '\x1b[0m',
      dim: '\x1b[2m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      cyan: '\x1b[36m',
      blue: '\x1b[34m',
      gray: '\x1b[90m',
    }
  : {
      reset: '',
      dim: '',
      green: '',
      yellow: '',
      red: '',
      cyan: '',
      blue: '',
      gray: '',
    };

export { LOG_COLORS };

// 모든 API 로그가 동일한 밀리초 타임스탬프를 사용하도록 통일.
export function logTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

function tagColor(level: LogLevel): string {
  if (level === 'warn') return LOG_COLORS.yellow;
  if (level === 'error') return LOG_COLORS.red;
  if (level === 'success') return LOG_COLORS.green;
  return LOG_COLORS.cyan;
}

function messageColor(level: LogLevel): string {
  if (level === 'warn') return LOG_COLORS.yellow;
  if (level === 'error') return LOG_COLORS.red;
  if (level === 'success') return LOG_COLORS.green;
  return '';
}

export function formatLogLine(tag: string, message: string, level: LogLevel = 'info'): string {
  // 목표 포맷: "YYYY-MM-DD HH:mm:ss.SSS [tag] message"
  // 태그/메시지 색상은 level에 따라 선택적으로 적용한다.
  const tagStyled = `${tagColor(level)}[${tag}]${LOG_COLORS.reset}`;
  const msgColor = messageColor(level);
  const messageStyled = msgColor.length > 0
    ? `${msgColor}${message}${LOG_COLORS.reset}`
    : message;
  return `${LOG_COLORS.gray}${logTimestamp()}${LOG_COLORS.reset} ${tagStyled} ${messageStyled}`;
}
