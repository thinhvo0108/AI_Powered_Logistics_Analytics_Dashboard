interface PiiPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
}

// Patterns are deliberately narrow (real-world formats, not "any digit run") so
// they don't false-positive on this dataset's dash-separated order/SKU/client
// IDs (e.g. "ORD-2026-267300-0001").
const PII_PATTERNS: PiiPattern[] = [
  { name: "email", pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, replacement: "[EMAIL]" },
  {
    name: "credit_card",
    // Visa / Mastercard / Amex / Discover — an unbroken digit run, so it
    // won't match dash-grouped IDs.
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    replacement: "[CREDIT_CARD]",
  },
  { name: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
  {
    name: "phone",
    // Requires a 3-3-4 digit grouping with separators, e.g. "555-123-4567" or
    // "(555) 123-4567" — distinct from this dataset's variable-length,
    // dash-separated ID groups.
    pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: "[PHONE]",
  },
  { name: "ip_address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: "[IP_ADDRESS]" },
];

/**
 * Masks common PII (emails, phone numbers, credit card numbers, SSNs, IP
 * addresses) in free-text user input before it's sent to any LLM provider.
 * Applied unconditionally — not just for cloud providers (OpenAI, RunPod) —
 * so behavior stays identical regardless of LLM_PROVIDER.
 */
export function maskPII(text: string): string {
  return PII_PATTERNS.reduce(
    (masked, { pattern, replacement }) => masked.replace(pattern, replacement),
    text
  );
}
