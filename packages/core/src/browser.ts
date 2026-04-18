/**
 * @fieldstack/core/browser
 *
 * Browser-safe exports only.
 * Does NOT include server-only modules (auth services, DB, shared-link service)
 * which depend on Node.js built-ins (crypto, bcryptjs, jsonwebtoken, otplib, etc.).
 *
 * Web app (Vite) must import from this entry, not from '@fieldstack/core'.
 */
export * from "./types/index.js";
export * from "./utils/index.js";
export * from "./browser-fetch.js";
