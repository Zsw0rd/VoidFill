// Shared URL rules stay small enough for the editor without importing the career catalogue.
export const PRACTICAL_LINK_LIMIT = 3;
export const PRACTICAL_LINK_LENGTH = 2000;
export const PRACTICAL_LINK_ERROR = "Use a public HTTPS link without a password.";

export function normalizePracticalLink(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > PRACTICAL_LINK_LENGTH) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function parsePracticalLinks(text: string): { links: string[]; error: string | null } {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  if (lines.length > PRACTICAL_LINK_LIMIT) return { links: [], error: "Use up to 3 project links, one public HTTPS link per line." };
  const links: string[] = [];
  for (const [index, line] of lines.entries()) {
    if (line.length > PRACTICAL_LINK_LENGTH) return { links: [], error: `Project link ${index + 1} is too long. Use at most 2,000 characters per link.` };
    const normalized = normalizePracticalLink(line);
    if (!normalized) return { links: [], error: `Project link ${index + 1}: ${PRACTICAL_LINK_ERROR}` };
    links.push(normalized);
  }
  return { links, error: null };
}
