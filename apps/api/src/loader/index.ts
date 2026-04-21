import fs from 'node:fs';
import path from 'node:path';

export interface ModuleRoutes {
  frontend: string;
  api: string;
}

export interface ModuleManifest {
  name: string;
  displayName: string;
  description: string;
  version: string;
  enabled: boolean;
  dependencies: string[];
  routes: ModuleRoutes;
}

export interface BackendRouteRegistration {
  moduleName: string;
  apiBasePath: string;
}

export interface BackendModuleEntry {
  name: string;
  manifestJson: string;
}

/**
 * module.json 문자열을 파싱해 ModuleManifest 객체로 변환한다.
 *
 * 필수 필드 규칙:
 * - name: 비어 있으면 호출자(scanBackendModules)에서 디렉터리 이름으로 대체.
 * - enabled: 기본 false — 명시적으로 true를 지정한 모듈만 활성화된다.
 * - routes.api: 비어 있으면 해당 모듈은 백엔드 라우트 없음(프론트 전용 모듈).
 */
export function parseModuleJson(content: string): ModuleManifest {
  const parsed = JSON.parse(content) as Partial<ModuleManifest>;

  return {
    name: parsed.name ?? "",
    displayName: parsed.displayName ?? parsed.name ?? "",
    description: parsed.description ?? "",
    version: parsed.version ?? "0.0.0",
    enabled: parsed.enabled ?? false,
    dependencies: parsed.dependencies ?? [],
    routes: {
      frontend: parsed.routes?.frontend ?? "",
      api: parsed.routes?.api ?? "",
    },
  };
}

export async function scanBackendModules(
  entries: BackendModuleEntry[],
): Promise<ModuleManifest[]> {
  const manifests = entries.map((entry) => {
    const manifest = parseModuleJson(entry.manifestJson);
    return {
      ...manifest,
      // manifest.name이 비어 있을 경우 디렉터리 이름(entry.name)으로 폴백.
      // module.json에 name 필드를 생략해도 디렉터리 이름이 모듈 식별자가 된다.
      name: manifest.name || entry.name,
    };
  });

  // enabled: true 인 모듈만 반환 — false/미지정 모듈은 부트스트랩에서 완전히 무시됨
  return manifests.filter((manifest) => manifest.enabled);
}

/**
 * 활성화된 모듈 목록을 백엔드 라우트 등록 정보로 변환한다.
 *
 * routes.api가 빈 문자열인 모듈(프론트 전용)도 포함되어 반환된다.
 * 실제 라우터 마운트 시점(app.ts)에서 빈 apiBasePath를 가진 항목을 건너뛰어야 한다.
 */
export function buildBackendRouteRegistrations(
  manifests: ModuleManifest[],
): BackendRouteRegistration[] {
  return manifests.map((manifest) => ({
    moduleName: manifest.name,
    apiBasePath: manifest.routes.api,
  }));
}

export interface DependencyIssue {
  moduleName: string;
  missingDependencies: string[];
}

export function validateModuleDependencies(manifests: ModuleManifest[]): DependencyIssue[] {
  const installedModules = new Set(manifests.map((manifest) => manifest.name));

  return manifests
    .map((manifest) => {
      const missingDependencies = manifest.dependencies.filter(
        (dependency) => !installedModules.has(dependency),
      );

      return {
        moduleName: manifest.name,
        missingDependencies,
      };
    })
    .filter((issue) => issue.missingDependencies.length > 0);
}

export async function loadModulesFromDisk(modulesDir: string): Promise<BackendModuleEntry[]> {
  if (!fs.existsSync(modulesDir)) return [];

  const dirs = fs.readdirSync(modulesDir, { withFileTypes: true }).filter((d) => d.isDirectory());

  const entries: BackendModuleEntry[] = [];
  for (const dir of dirs) {
    const manifestPath = path.join(modulesDir, dir.name, 'module.json');
    if (fs.existsSync(manifestPath)) {
      const manifestJson = fs.readFileSync(manifestPath, 'utf-8');
      entries.push({ name: dir.name, manifestJson });
    }
  }

  return entries;
}

export default {
  parseModuleJson,
  scanBackendModules,
  buildBackendRouteRegistrations,
  validateModuleDependencies,
  loadModulesFromDisk,
};
