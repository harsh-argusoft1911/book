import express from 'express';
import { PrismaClient } from '@prisma/client';

// Geocode an Indian pincode → lat/lng
// Uses Google Geocoding API if GOOGLE_MAPS_KEY is set, else falls back to Nominatim
async function geocodePincode(pincode: string): Promise<{ lat: number; lng: number } | null> {
  const googleKey = process.env.GOOGLE_MAPS_KEY;

  // ── Google Geocoding API ──────────────────────────────────────────────────
  if (googleKey && googleKey !== 'YOUR_KEY_HERE') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode},India&key=${googleKey}`;
      const res = await fetch(url);
      const data: any = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
      console.warn(`Google Geocoding failed for ${pincode}: ${data.status}`);
    } catch (err) {
      console.error('Google Geocoding error:', err);
    }
  }

  // ── Nominatim fallback ────────────────────────────────────────────────────
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'BookMyPathology/1.0' } });
    const data: any[] = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    console.error('Nominatim fallback error:', err);
  }

  return null;
}

const router = express.Router();
const prisma = new PrismaClient();

// Helper to calculate distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

router.get('/', async (req, res) => {
  try {
    const { lat, lng, sortBy } = req.query;
    let labs = await prisma.lab.findMany();

    // Map distance if coords provided
    const userLat = lat ? parseFloat(lat as string) : null;
    const userLng = lng ? parseFloat(lng as string) : null;

    let labsWithDistance = labs.map(lab => {
      let distance = null;
      if (userLat && userLng && lab.lat && lab.lng) {
        distance = getDistance(userLat, userLng, lab.lat, lab.lng);
      }
      return { ...lab, distance };
    });

    // Sorting logic
    if (sortBy === 'popularity') {
      labsWithDistance.sort((a, b) => a.popularity - b.popularity);
    } else if (sortBy === 'discount') {
      labsWithDistance.sort((a, b) => b.discount - a.discount);
    } else if (sortBy === 'distance' && userLat && userLng) {
      labsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    res.json(labsWithDistance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// Create a new Lab (Admin Route)
router.post('/', async (req, res) => {
  try {
    let { name, address, pincode, password, rating, discount, nabl, homeCollection, lat, lng } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Generate sequential Lab ID: L-001, L-002, ...
    const labCount = await prisma.lab.count();
    const labId = `L-${String(labCount + 1).padStart(3, '0')}`;

    // Geocode pincode to coordinates only if lat/lng are not explicitly passed
    let resolvedLat: number | null = lat !== undefined && lat !== null ? parseFloat(lat) : null;
    let resolvedLng: number | null = lng !== undefined && lng !== null ? parseFloat(lng) : null;

    if (resolvedLat === null || resolvedLng === null) {
      if (pincode) {
        const coords = await geocodePincode(String(pincode));
        if (coords) {
          resolvedLat = coords.lat;
          resolvedLng = coords.lng;
        } else {
          console.warn(`Could not geocode pincode: ${pincode}`);
        }
      }
    }

    const lab = await prisma.lab.create({
      data: {
        id: labId,
        name,
        address,
        password,
        lat: resolvedLat,
        lng: resolvedLng,
        rating: rating ? parseFloat(rating) : 4.5,
        popularity: 1,
        discount: discount ? parseInt(discount) : 0,
        nabl: nabl === undefined ? true : Boolean(nabl),
        homeCollection: homeCollection === undefined ? true : Boolean(homeCollection),
      }
    });

    res.json({ ...lab, geocoded: resolvedLat !== null && resolvedLng !== null });
  } catch (error) {
    console.error('Failed to create lab:', error);
    res.status(500).json({ error: 'Failed to create lab' });
  }
});

export default router;
