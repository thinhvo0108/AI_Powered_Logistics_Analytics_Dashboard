const ADVICE_PHRASES = [
  "consult a lawyer",
  "consult a doctor",
  "legal advice",
  "medical advice",
  "i cannot provide",
];

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export function checkOutput(answer: string): string {
  const lower = answer.toLowerCase();

  if (ADVICE_PHRASES.some((phrase) => lower.includes(phrase))) {
    return `${answer}\n\n*This is an analytical summary based on historical logistics data only.*`;
  }

  return answer.replace(EMAIL_PATTERN, "[redacted]");
}
