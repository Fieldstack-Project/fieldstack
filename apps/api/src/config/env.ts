import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  INSTALL_MODE: z.enum(['normal', 'bypass']).optional(),
  // Database
  DB_PROVIDER: z.enum(['postgres', 'sqlite']).default('postgres'),
  DATABASE_URL: z.string().url().optional(),
  SQLITE_PATH: z.string().optional(),
  // Auth
  JWT_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  TOTP_ISSUER: z.string().default('Fieldstack'),
  // Shared Link
  PUBLIC_URL: z.string().url().optional(),
});
// DATABASE_URL 존재 여부는 initDb() 호출 시 검증한다.
// Setup 모드에서는 DB 설정이 아직 없으므로 여기서 강제 검증하지 않는다.

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: NodeJS.ProcessEnv): Env {
  const result = EnvSchema.safeParse(raw);

  if (!result.success) {
    console.error('[fieldstack][api] Invalid environment variables:');
    for (const [field, issue] of Object.entries(result.error.flatten().fieldErrors)) {
      console.error(`  ${field}: ${(issue as string[]).join(', ')}`);
    }
    process.exit(1);
  }

  return result.data;
}
