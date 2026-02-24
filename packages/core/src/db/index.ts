export interface DbProvider {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface MigrationRunner {
  up(): Promise<void>;
  down(): Promise<void>;
}
