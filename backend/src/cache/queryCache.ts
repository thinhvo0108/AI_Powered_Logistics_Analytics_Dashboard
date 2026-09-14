import { createHash } from "crypto";
import { config } from "../core/config.js";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

class QueryCache {
  private store = new Map<string, CacheEntry>();

  get(key: string): unknown | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + config.queryCacheTtlSeconds * 1000,
    });
  }

  makeKey(query: string, filters: unknown): string {
    const payload = JSON.stringify({ query: this.normalizeQuery(query), filters });
    return createHash("sha256").update(payload).digest("hex");
  }

  normalizeQuery(q: string): string {
    return q.toLowerCase().replace(/\s+/g, " ").trim();
  }
}

export const queryCache = new QueryCache();
