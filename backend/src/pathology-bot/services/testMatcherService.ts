/**
 * testMatcherService.ts
 *
 * Fuzzy-matches user free-text input against the pathology_tests catalog.
 * Uses Fuse.js for fuzzy search over canonical names AND aliases.
 *
 * Matching logic:
 * 1. Split user input by commas to get individual test request segments.
 * 2. For each segment, run Fuse.js against the flattened name+alias index.
 * 3. If the top-hit score >= MATCH_THRESHOLD, mark as matched.
 * 4. If below threshold (or no hit), mark as unmatched → caller asks for clarification.
 */
import Fuse from 'fuse.js';
import { botPool } from '../db';
import type { PathologyTest, MatchedTest } from '../types';

/** Similarity threshold. Fuse.js score is 0 (perfect) → 1 (worst).
 *  We convert to 1 – score for readability (1 = perfect, 0 = no match).
 *  A segment is accepted if similarity >= MATCH_THRESHOLD. */
const MATCH_THRESHOLD = 0.45;

// ---- In-memory catalog cache (refreshed on demand) ----
let catalogCache: PathologyTest[] = [];
let fuseIndex: Fuse<{ testId: number; text: string; canonicalName: string }> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface FlatEntry {
  testId: number;
  text: string; // the alias or canonical name
  canonicalName: string;
}

async function ensureCatalogLoaded(): Promise<void> {
  if (fuseIndex && Date.now() - lastCacheTime < CACHE_TTL_MS) return;

  const result = await botPool.query<{
    id: number;
    canonical_name: string;
    aliases: string[];
    category: string | null;
  }>(`SELECT id, canonical_name, aliases, category FROM pathology_tests ORDER BY id`);

  catalogCache = result.rows.map(r => ({
    id: r.id,
    canonical_name: r.canonical_name,
    aliases: Array.isArray(r.aliases) ? r.aliases : JSON.parse(r.aliases as any),
    category: r.category,
  }));

  // Flatten: one entry per name/alias so Fuse can match all of them
  const flat: FlatEntry[] = [];
  for (const test of catalogCache) {
    flat.push({ testId: test.id, text: test.canonical_name.toLowerCase(), canonicalName: test.canonical_name });
    for (const alias of test.aliases) {
      flat.push({ testId: test.id, text: alias.toLowerCase(), canonicalName: test.canonical_name });
    }
  }

  fuseIndex = new Fuse(flat, {
    keys: ['text'],
    includeScore: true,
    threshold: 0.6, // Fuse internal threshold — we filter more strictly below
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  lastCacheTime = Date.now();
}

/** Invalidate the in-memory cache (call after seeding new tests). */
export function invalidateTestCache(): void {
  fuseIndex = null;
  lastCacheTime = 0;
}

/** Get the full test catalog (for display purposes). */
export async function getAllTests(): Promise<PathologyTest[]> {
  await ensureCatalogLoaded();
  return catalogCache;
}

export interface MatchResult {
  matched: MatchedTest[];
  unmatched: string[];
}

/**
 * Match a raw user string (possibly comma-separated) against the test catalog.
 *
 * @param userInput  raw free text from WhatsApp message body
 * @returns { matched: MatchedTest[], unmatched: string[] }
 */
export async function matchTests(userInput: string): Promise<MatchResult> {
  await ensureCatalogLoaded();

  // Split by comma or "and", trim each segment
  const segments = userInput
    .split(/[,&]|\band\b/i)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length >= 2);

  const matched: MatchedTest[] = [];
  const unmatched: string[] = [];
  const seenTestIds = new Set<number>();

  for (const segment of segments) {
    const results = fuseIndex!.search(segment);
    if (results.length === 0) {
      unmatched.push(segment);
      continue;
    }

    const top = results[0];
    const similarity = 1 - (top.score ?? 1); // convert Fuse score to 0–1 similarity

    if (similarity >= MATCH_THRESHOLD) {
      const { testId, canonicalName } = top.item;
      if (!seenTestIds.has(testId)) {
        matched.push({ id: testId, canonical_name: canonicalName, score: similarity });
        seenTestIds.add(testId);
      }
      // Silently deduplicate if the same test appears twice
    } else {
      unmatched.push(segment);
    }
  }

  return { matched, unmatched };
}

/**
 * Match a single numeric selection from a list (user typed "1", "2", etc.).
 * Used as a fallback when the user is shown a numbered list instead of an interactive list.
 */
export async function matchTestByIndex(oneBased: number): Promise<PathologyTest | null> {
  await ensureCatalogLoaded();
  return catalogCache[oneBased - 1] ?? null;
}
