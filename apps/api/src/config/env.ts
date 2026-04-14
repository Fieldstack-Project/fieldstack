import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  INSTALL_MODE: z.enum(['normal', 'bypass']).optional(),
  // Database
  DB_PROVIDER: z.enum(['postgres', 'sqlite']).default('postgres'),
  DATABASE_URL: z.string().url().optional(),
  SQLITE_PATH: z.string().optional(),
}).refine(
  (env) => env.DB_PROVIDER !== 'postgres' || Boolean(env.DATABASE_URL),
  { message: 'DATABASE_URL is required when DB_PROVIDER=postgres', path: ['DATABASE_URL'] },
);

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
