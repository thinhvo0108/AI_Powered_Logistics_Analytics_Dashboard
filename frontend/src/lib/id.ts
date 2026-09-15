/**
 * Generates a UUID-like unique id for client-side use (React keys,
 * conversation/turn tracking — never anything security-sensitive).
 *
 * Prefers `crypto.randomUUID()`, but that API only exists in a secure
 * context (HTTPS or localhost) — accessed over plain HTTP (e.g. a demo box
 * without TLS yet), `crypto.randomUUID` is undefined entirely and throws.
 * Falls back to building a UUID v4 from `crypto.getRandomValues()`, which
 * has no such restriction.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Extremely old browser with no Web Crypto API at all — not
  // cryptographically random, but fine for a non-security-sensitive id.
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
