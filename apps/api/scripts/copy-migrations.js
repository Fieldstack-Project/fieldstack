#!/usr/bin/env node
// apps/api 빌드 시 SQL 마이그레이션 파일을 dist에 복사

import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', 'src', 'db', 'migrations');
const dest = join(__dirname, '..', 'dist', 'db', 'migrations');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('[fieldstack] Migrations copied to dist/db/migrations');
