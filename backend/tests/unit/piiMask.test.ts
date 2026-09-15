import { describe, it, expect } from "vitest";
import { maskPII } from "../../src/guardrails/piiMask.js";

describe("maskPII", () => {
  it("masks email addresses", () => {
    const result = maskPII("Contact me at jane.doe@example.com about my order");

    expect(result).not.toContain("jane.doe@example.com");
    expect(result).toContain("[EMAIL]");
  });

  it("masks phone numbers", () => {
    expect(maskPII("Call me at 555-123-4567")).toContain("[PHONE]");
    expect(maskPII("Call me at (555) 123-4567")).toContain("[PHONE]");
  });

  it("masks credit card numbers", () => {
    const result = maskPII("My card is 4111111111111111, please refund it");

    expect(result).not.toContain("4111111111111111");
    expect(result).toContain("[CREDIT_CARD]");
  });

  it("masks SSNs", () => {
    const result = maskPII("My SSN is 123-45-6789");

    expect(result).not.toContain("123-45-6789");
    expect(result).toContain("[SSN]");
  });

  it("masks IP addresses", () => {
    expect(maskPII("My IP is 192.168.1.1")).toContain("[IP_ADDRESS]");
  });

  it("leaves ordinary logistics questions unchanged", () => {
    const query = "Which carrier has the highest delay rate for order ORD-2026-267300-0001?";

    expect(maskPII(query)).toBe(query);
  });

  it("does not false-positive on dash-separated order/SKU/client IDs", () => {
    const query = "What happened to CL-1023 / ORD-2026-267300-0001 / PAPER-0197?";

    expect(maskPII(query)).toBe(query);
  });
});
