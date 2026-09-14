export interface GuardrailResult {
  passed: boolean;
  violationType: "injection" | "off_topic" | null;
  detail: string | null;
}

const INJECTION_PATTERNS = [
  "ignore your instructions",
  "disregard previous",
  "you are now",
  "pretend you are",
  " dan ",
  "jailbreak",
  "ignore all previous",
];

const DOMAIN_KEYWORDS = new Set([
  "order",
  "orders",
  "delivery",
  "delayed",
  "demand",
  "carrier",
  "shipment",
  "delay",
  "warehouse",
  "sku",
  "inventory",
  "forecast",
  "route",
  "region",
  "freight",
  "logistics",
  "supply",
  "dispatch",
  "tracking",
  "product",
  "quantity",
  "revenue",
  "performance",
  "rate",
  "customer",
  "late",
  "on-time",
  "ontime",
  "transit",
  "pending",
  "data",
  "fedex",
  "ups",
  "usps",
  "dhl",
  "dpd",
  "gls",
  "lasership",
  "ontrac",
]);

export interface CheckInputOptions {
  /** True when this query follows earlier turns in the same conversation. Short
   * follow-ups ("what about UPS?", "and last quarter?") naturally carry none of
   * the domain keywords on their own, so the off-topic check is skipped once a
   * logistics conversation is already established — injection checks still
   * always run regardless of context. */
  hasContext?: boolean;
}

export function checkInput(query: string, options: CheckInputOptions = {}): GuardrailResult {
  const lowered = query.toLowerCase();

  for (const pattern of INJECTION_PATTERNS) {
    if (lowered.includes(pattern)) {
      return {
        passed: false,
        violationType: "injection",
        detail: `Query contains a potential prompt injection pattern: "${pattern.trim()}"`,
      };
    }
  }

  if (options.hasContext) {
    return { passed: true, violationType: null, detail: null };
  }

  const words = lowered.split(/\s+/).filter(Boolean);
  const hasDomainOverlap = words.some((word) => DOMAIN_KEYWORDS.has(word));

  if (!hasDomainOverlap) {
    return {
      passed: false,
      violationType: "off_topic",
      detail: "Query does not appear related to logistics analytics.",
    };
  }

  return { passed: true, violationType: null, detail: null };
}
