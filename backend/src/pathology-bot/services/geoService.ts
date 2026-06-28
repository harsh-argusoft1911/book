/**
 * geoService.ts — Haversine-based nearest-lab finder.
 * Queries pathology_labs + pathology_lab_pricing to find the
 * 5 nearest labs and compute per-lab total cost for selected tests.
 */
import { botPool } from '../db';
import type { NearbyLab } from '../types';

const EARTH_RADIUS_KM = 6371;

/** Haversine formula — returns distance in km between two lat/lng points. */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the 5 nearest labs and compute pricing for the given test set.
 *
 * Labs that don't offer ALL selected tests are still included but
 * missing_tests is populated so the bot can inform the user.
 *
 * @param userLat     User's latitude
 * @param userLng     User's longitude
 * @param testIds     Array of pathology_tests.id values the user wants
 * @param maxDistance Maximum search radius in km (default: 50 km)
 */
export async function findNearbyLabs(
  userLat: number,
  userLng: number,
  testIds: number[],
  maxDistance = 50
): Promise<NearbyLab[]> {
  // Fetch all labs (typically small table — no pagination needed)
  const labsResult = await botPool.query<{
    id: number; name: string; address: string | null;
    lat: number; lng: number; phone: string | null; nabl: boolean;
  }>(`SELECT id, name, address, lat, lng, phone, nabl FROM pathology_labs`);

  const labs = labsResult.rows;
  if (labs.length === 0) return [];

  // For each lab fetch pricing for the desired tests
  // Single query for all labs at once
  let pricingResult: { lab_id: number; test_id: number; price: string }[] = [];
  if (testIds.length > 0) {
    const res = await botPool.query<{ lab_id: number; test_id: number; price: string }>(
      `SELECT lab_id, test_id, price::TEXT
       FROM pathology_lab_pricing
       WHERE test_id = ANY($1::int[])`,
      [testIds]
    );
    pricingResult = res.rows;
  }

  // Build lookup: labId → { testId → price }
  const pricingMap = new Map<number, Map<number, number>>();
  for (const row of pricingResult) {
    if (!pricingMap.has(row.lab_id)) pricingMap.set(row.lab_id, new Map());
    pricingMap.get(row.lab_id)!.set(row.test_id, parseFloat(row.price));
  }

  // Fetch canonical names for missing-test reporting
  let testNames: Map<number, string> = new Map();
  if (testIds.length > 0) {
    const nameRes = await botPool.query<{ id: number; canonical_name: string }>(
      `SELECT id, canonical_name FROM pathology_tests WHERE id = ANY($1::int[])`,
      [testIds]
    );
    testNames = new Map(nameRes.rows.map(r => [r.id, r.canonical_name]));
  }

  // Compute distance and pricing for each lab
  const nearby: NearbyLab[] = [];

  for (const lab of labs) {
    const dist = haversine(userLat, userLng, Number(lab.lat), Number(lab.lng));
    if (dist > maxDistance) continue;

    const labPricing = pricingMap.get(lab.id) ?? new Map<number, number>();
    let total = 0;
    const missingTests: string[] = [];

    for (const tid of testIds) {
      const price = labPricing.get(tid);
      if (price !== undefined) {
        total += price;
      } else {
        missingTests.push(testNames.get(tid) ?? `Test #${tid}`);
      }
    }

    nearby.push({
      ...lab,
      lat: Number(lab.lat),
      lng: Number(lab.lng),
      distance_km: Math.round(dist * 10) / 10,
      total_price: total,
      missing_tests: missingTests,
    });
  }

  // Sort by distance, take top 5
  nearby.sort((a, b) => a.distance_km - b.distance_km);
  return nearby.slice(0, 5);
}
