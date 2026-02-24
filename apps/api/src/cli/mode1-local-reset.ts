export interface Mode1ResetCommandOptions {
  userId: string;
  temporaryPassword: string;
  adminPin: string;
}

export interface Mode1ResetResult {
  userId: string;
  resetAt: string;
}

export type Mode1ResetExecutor = (options: Mode1ResetCommandOptions) => Promise<void>;

function parseFlag(argv: string[], flag: string): string {
  const index = argv.indexOf(flag);
  if (index < 0) {
    return "";
  }

  return argv[index + 1] ?? "";
}

export function parseMode1ResetArgs(argv: string[]): Mode1ResetCommandOptions {
  return {
    userId: parseFlag(argv, "--user-id"),
    temporaryPassword: parseFlag(argv, "--temp-password"),
    adminPin: parseFlag(argv, "--admin-pin"),
  };
}

export async function runMode1LocalReset(
  argv: string[],
  executor: Mode1ResetExecutor,
): Promise<Mode1ResetResult> {
  const options = parseMode1ResetArgs(argv);
  await executor(options);

  return {
    userId: options.userId,
    resetAt: new Date().toISOString(),
  };
}
