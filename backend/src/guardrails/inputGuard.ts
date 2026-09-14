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
  "delivery",
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
]);

export function checkInput(query: string): GuardrailResult {
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
