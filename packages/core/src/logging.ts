// core 패키지(DB/마이그레이션) 공통 로그 포맷터.
// API 레이어와 동일하게 "timestamp [tag] message" 형태를 사용한다.
export function logTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

// 운영에서는 무색, 개발에서는 ANSI 색상으로 가독성 향상.
const IS_COLOR_ENABLED = process.env['NODE_ENV'] !== 'production';

const LOG_COLORS = IS_COLOR_ENABLED
  ? {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
    }
  : {
      reset: '',
      green: '',
      yellow: '',
      red: '',
      cyan: '',
      gray: '',
    };

type LogLevel = 'info' | 'warn' | 'error' | 'success';

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
  const tagStyled = `${tagColor(level)}[${tag}]${LOG_COLORS.reset}`;
  const msgColor = messageColor(level);
  const messageStyled = msgColor.length > 0
    ? `${msgColor}${message}${LOG_COLORS.reset}`
    : message;
  return `${LOG_COLORS.gray}${logTimestamp()}${LOG_COLORS.reset} ${tagStyled} ${messageStyled}`;
}

// DB/provider 코드에서 직접 console.*를 쓰지 않고
// 공통 진입점(coreLog)만 사용하도록 래핑한다.
export const coreLog = {
  info(tag: string, message: string): void {
    console.log(formatLogLine(tag, message, 'info'));
  },
  warn(tag: string, message: string): void {
    console.warn(formatLogLine(tag, message, 'warn'));
  },
  error(tag: string, message: string): void {
    console.error(formatLogLine(tag, message, 'error'));
  },
  success(tag: string, message: string): void {
    console.log(formatLogLine(tag, message, 'success'));
  },
};
