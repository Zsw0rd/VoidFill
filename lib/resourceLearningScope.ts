import displayIndex from "../ml/data/lessons/resource-display-index.json";

// Detailed descriptions and citations load only on cards that need them.
const guides = new Set(displayIndex.guide_urls);
const corrections = new Set(displayIndex.correction_urls);
export function isUngradedResource(url: string | null | undefined): boolean {
  return !!url && guides.has(url.trim());
}
export function hasResourceSourceNotes(url: string | null | undefined): boolean {
  return !!url && corrections.has(url.trim());
}
export const UNGRADED_GUIDE_MESSAGE = "This is an ungraded guide. Read it for context, then use a teaching lesson or the skill assessment to check your understanding.";
