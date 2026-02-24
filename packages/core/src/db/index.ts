export interface DbProvider {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface MigrationRunner {
  up(): Promise<void>;
  down(): Promise<void>;
}

export interface DbConnectionConfig {
  connectionString: string;
}

export * from "./migrations";
export * from "./providers/postgres";
export * from "./providers/sqlite";
export * from "./providers/supabase";
export * from "./providers/mongodb";
