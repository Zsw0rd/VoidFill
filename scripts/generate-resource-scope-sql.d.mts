export const RESOURCE_SCOPE_SOURCE: string;
export const RESOURCE_SCOPE_SEED: string;
export function projectUngradedResourceUrls(rows: unknown): string[];
export function renderUngradedResourceSeed(rows: unknown): string;
export function runResourceScopeSeedCli(args?: string[]): { checked: boolean; urls: number };
