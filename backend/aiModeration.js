const blockedPatterns = [
  /(\+?234|0)\d{10}/i,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /(whatsapp|telegram|call me|email me|dm me)/i,
  /(https?:\/\/|www\.)/i,
];

export function moderateMessage(input) {
  const text = String(input ?? "").trim();
  const violations = blockedPatterns.filter((pattern) => pattern.test(text));

  return {
    clean: violations.length === 0,
    flagged: violations.length > 0,
    sanitizedText: violations.length > 0 ? "[REDACTED: external contact blocked by VetPro AI]" : text,
    reason: violations.length > 0 ? "External contact details are not allowed in closed-loop chat." : null,
    severity: violations.length > 0 ? "high" : "none",
  };
}
