export function buildExtractionPrompt(rawQuoteText: string): string {
  return `You are a defense procurement data extraction assistant.
Extract all line items from the following supplier quote.
Return ONLY a valid JSON array. No explanation. No markdown. No preamble.

Each object must contain:
- part_number   (string)
- description   (string or null)
- quantity      (number or null)
- unit_price    (number or null)
- lead_time_days (number or null)
- notes         (string or null)

If a field is missing or unclear, return null for that field. Never guess.

Quote text:
${rawQuoteText}`
}
