import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  INSTALL_MODE: z.enum(['normal', 'bypass']).optional(),
});

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
