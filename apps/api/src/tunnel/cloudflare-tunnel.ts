import fs from 'fs';
import path from 'path';

import { log } from '../middleware/logger';

// ── 타입 ──────────────────────────────────────────────────────────

export type TunnelMode = 'quick' | 'named';

export interface TunnelConfig {
  mode: TunnelMode;
  token: string;
}

export interface TunnelStatus {
  running: boolean;
  url: string | null;
  mode: TunnelMode | null;
}

// ── 설정 파일 경로 ────────────────────────────────────────────────

const CONFIG_PATH = path.resolve(process.cwd(), 'tunnel.config.json');

function loadConfig(): TunnelConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as TunnelConfig;
  } catch {
    return { mode: 'quick', token: '' };
  }
}

function saveConfig(cfg: TunnelConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

// ── 터널 매니저 (싱글턴) ──────────────────────────────────────────

class CloudflareTunnelManager {
  private _running = false;
  private _url: string | null = null;
  private _mode: TunnelMode | null = null;
  private _tunnelInstance: { stop: () => boolean } | null = null;

  get status(): TunnelStatus {
    return { running: this._running, url: this._url, mode: this._mode };
  }

  getConfig(): TunnelConfig {
    return loadConfig();
  }

  setConfig(cfg: TunnelConfig): void {
    saveConfig(cfg);
  }

  async start(): Promise<{ url: string }> {
    if (this._running) {
      if (this._url) return { url: this._url };
      throw new Error('터널이 이미 시작 중입니다.');
    }

    const cfg = loadConfig();

    // cloudflared 패키지 동적 import
    let TunnelClass: typeof import('cloudflared').Tunnel;
    try {
      const mod = await import('cloudflared');
      TunnelClass = mod.Tunnel;
    } catch {
      throw new Error('cloudflared 패키지가 설치되어 있지 않습니다. pnpm install을 실행해주세요.');
    }

    this._running = true;
    this._mode = cfg.mode;

    try {
      // 개발 모드에서는 Vite dev server(5173)로, 프로덕션에서는 API 서버로 연결
      // localhost 대신 127.0.0.1 사용 — WSL2에서 localhost가 ::1(IPv6)로 해석되어
      // Vite가 응답하지 못하는 Error 1033 방지
      const isDev = process.env['NODE_ENV'] !== 'production';
      const localUrl = isDev
        ? `http://127.0.0.1:${process.env['VITE_PORT'] ?? 5173}`
        : `http://127.0.0.1:${process.env['PORT'] ?? 3000}`;

      log.info('tunnel', `starting ${cfg.mode} tunnel → ${localUrl}`);

      const tunnelInstance =
        cfg.mode === 'named'
          ? (() => {
              if (!cfg.token) throw new Error('Named Tunnel 토큰이 설정되어 있지 않습니다.');
              return TunnelClass.withToken(cfg.token);
            })()
          : TunnelClass.quick(localUrl);

      this._tunnelInstance = tunnelInstance;

      // cloudflared stdout/stderr를 서버 로그로 중계
      tunnelInstance.on('stdout', (data: string) => {
        for (const line of data.trim().split('\n')) {
          if (line.trim()) log.info('cloudflared', line.trim());
        }
      });
      tunnelInstance.on('stderr', (data: string) => {
        for (const line of data.trim().split('\n')) {
          if (line.trim()) log.info('cloudflared', line.trim());
        }
      });

      const url = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('터널 URL을 가져오는 데 시간이 초과되었습니다 (60초).'));
        }, 60_000);

        tunnelInstance.once('url', (tunnelUrl: string) => {
          clearTimeout(timeout);
          log.success('tunnel', `tunnel active → ${tunnelUrl}`);
          resolve(tunnelUrl);
        });

        tunnelInstance.once('error', (err: Error) => {
          clearTimeout(timeout);
          log.error('tunnel', `tunnel error: ${err.message}`);
          reject(err);
        });

        tunnelInstance.once('exit', (code: number | null) => {
          clearTimeout(timeout);
          reject(new Error(`cloudflared 프로세스가 예상치 못하게 종료되었습니다 (code: ${code}).`));
        });
      });

      this._url = url;

      // 프로세스 종료 시 상태 초기화 및 로그
      tunnelInstance.once('exit', (code: number | null) => {
        log.warn('tunnel', `cloudflared exited (code: ${code ?? 'null'})`);
        this._running = false;
        this._url = null;
        this._mode = null;
        this._tunnelInstance = null;
      });

      return { url };
    } catch (err) {
      this._running = false;
      this._mode = null;
      this._tunnelInstance = null;
      throw err;
    }
  }

  stop(): void {
    if (!this._running || !this._tunnelInstance) throw new Error('실행 중인 터널이 없습니다.');
    log.info('tunnel', 'stopping tunnel…');
    this._tunnelInstance.stop();
    this._running = false;
    this._url = null;
    this._mode = null;
    this._tunnelInstance = null;
  }
}

export const tunnelManager = new CloudflareTunnelManager();
