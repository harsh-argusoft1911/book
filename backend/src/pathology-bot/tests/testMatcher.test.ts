/**
 * testMatcher.test.ts — Unit tests for the fuzzy test matcher.
 *
 * These tests run OFFLINE using a mock catalog (no DB needed).
 * Run with: npx tsx src/pathology-bot/tests/testMatcher.test.ts
 */

// ── Minimal in-process mock — bypasses the real DB ───────────────────────────
// We monkey-patch the botPool query BEFORE importing the service.
import { botPool } from '../db';

const MOCK_CATALOG = [
  { id: 1, canonical_name: 'Complete Blood Count', aliases: ['cbc','complete blood test','blood count','haematology','cbp'], category: 'Haematology' },
  { id: 2, canonical_name: 'Liver Function Test',  aliases: ['lft','liver function','liver panel','hepatic function'], category: 'Biochemistry' },
  { id: 3, canonical_name: 'Thyroid Stimulating Hormone', aliases: ['tsh','thyroid','thyroid profile','t3 t4 tsh','thyroid function'], category: 'Endocrinology' },
  { id: 4, canonical_name: 'Blood Glucose Fasting', aliases: ['fbs','fasting sugar','blood sugar fasting','sugar test','glucose fasting'], category: 'Biochemistry' },
  { id: 5, canonical_name: 'HbA1c', aliases: ['hba1c','glycated haemoglobin','a1c','diabetes test'], category: 'Endocrinology' },
  { id: 6, canonical_name: 'Lipid Profile',        aliases: ['lipid profile','cholesterol','lipid panel'], category: 'Biochemistry' },
  { id: 7, canonical_name: 'Vitamin D',            aliases: ['vitamin d','vit d','25-oh vitamin d','vitamin d3'], category: 'Biochemistry' },
];

// Stub out the DB query to return the mock catalog
const originalQuery = botPool.query.bind(botPool);
(botPool as any).query = async (sql: string) => {
  if (sql.includes('FROM pathology_tests')) {
    return { rows: MOCK_CATALOG };
  }
  return originalQuery(sql);
};

// ── Now import the service (will use the mock) ───────────────────────────────
import { matchTests, invalidateTestCache } from '../services/testMatcherService';

// ── Tiny assertion helper ────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌  ${name}`);
    console.error(`      ${err.message ?? err}`);
    failed++;
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan: (n: number) => {
      if (!(actual > n)) throw new Error(`Expected ${actual} > ${n}`);
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toContain: (item: string) => {
      if (!actual.includes(item)) throw new Error(`Expected array to contain "${item}", got ${JSON.stringify(actual)}`);
    },
    toHaveLength: (n: number) => {
      if (actual.length !== n) throw new Error(`Expected length ${n}, got ${actual.length}`);
    },
  };
}

/** Safe first-element access — throws if array is empty, satisfying noUncheckedIndexedAccess. */
function first<T>(arr: T[], label = 'array'): T {
  const item = arr[0];
  if (item === undefined) throw new Error(`Expected ${label} to have at least one element`);
  return item;
}

// ── Test suite ────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n[pathology-bot] Running testMatcher unit tests...\n');

  // Force-clear any cached state
  invalidateTestCache();

  await test('Exact acronym: "cbc" → Complete Blood Count', async () => {
    const { matched, unmatched } = await matchTests('cbc');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Complete Blood Count');
    expect(unmatched).toHaveLength(0);
  });

  await test('Exact acronym: "lft" → Liver Function Test', async () => {
    const { matched, unmatched } = await matchTests('lft');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Liver Function Test');
    expect(unmatched).toHaveLength(0);
  });

  await test('Alias: "complete blood test" → Complete Blood Count', async () => {
    invalidateTestCache();
    const { matched } = await matchTests('complete blood test');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Complete Blood Count');
  });

  await test('Alias: "thyroid" → Thyroid Stimulating Hormone', async () => {
    const { matched } = await matchTests('thyroid');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Thyroid Stimulating Hormone');
  });

  await test('Alias: "sugar test" → Blood Glucose Fasting', async () => {
    const { matched } = await matchTests('sugar test');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Blood Glucose Fasting');
  });

  await test('Alias: "cholesterol" → Lipid Profile', async () => {
    const { matched } = await matchTests('cholesterol');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Lipid Profile');
  });

  await test('Alias: "vitamin d3" → Vitamin D', async () => {
    const { matched } = await matchTests('vitamin d3');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Vitamin D');
  });

  await test('Multi-input: "cbc, lft, thyroid"', async () => {
    const { matched, unmatched } = await matchTests('cbc, lft, thyroid');
    expect(matched).toHaveLength(3);
    expect(unmatched).toHaveLength(0);
    const names = matched.map(m => m.canonical_name);
    expect(names).toContain('Complete Blood Count');
    expect(names).toContain('Liver Function Test');
    expect(names).toContain('Thyroid Stimulating Hormone');
  });

  await test('Multi-input with "&": "cbc & lft"', async () => {
    const { matched, unmatched } = await matchTests('cbc & lft');
    expect(matched).toHaveLength(2);
    expect(unmatched).toHaveLength(0);
  });

  await test('Multi-input with "and": "cbc and sugar test"', async () => {
    const { matched, unmatched } = await matchTests('cbc and sugar test');
    expect(matched).toHaveLength(2);
    expect(unmatched).toHaveLength(0);
  });

  await test('Partial match: "cbc, blablatest"', async () => {
    const { matched, unmatched } = await matchTests('cbc, blablatest');
    expect(matched).toHaveLength(1);
    expect(first(matched, 'matched').canonical_name).toBe('Complete Blood Count');
    expect(unmatched).toHaveLength(1);
    expect(first(unmatched, 'unmatched')).toBe('blablatest');
  });

  await test('Completely unrecognised: "xyztest123"', async () => {
    const { matched, unmatched } = await matchTests('xyztest123');
    expect(matched).toHaveLength(0);
    expect(unmatched).toHaveLength(1);
  });

  await test('Fuzzy: "complte blood count" (typo)', async () => {
    const { matched } = await matchTests('complte blood count');
    // Should still match despite a typo (Fuse.js fuzzy)
    expect(matched.length).toBeGreaterThan(0);
    expect(first(matched, 'matched').canonical_name).toBe('Complete Blood Count');
  });

  await test('Deduplication: "cbc, complete blood count" → 1 result', async () => {
    const { matched } = await matchTests('cbc, complete blood count');
    expect(matched).toHaveLength(1);
  });

  await test('Score is in 0–1 range', async () => {
    const { matched } = await matchTests('cbc');
    expect(matched).toHaveLength(1);
    const score = first(matched, 'matched').score;
    if (score < 0 || score > 1) throw new Error(`Score out of range: ${score}`);
  });

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
