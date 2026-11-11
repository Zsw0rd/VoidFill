import notes from "../ml/data/lessons/resource-warnings.json";

export function resourceSourceNotes(url: string | null | undefined) {
  return url ? notes.filter(note => note.url === url.trim()) : [];
}
