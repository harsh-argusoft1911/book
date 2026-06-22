import express from 'express';
import { PrismaClient } from '@prisma/client';

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

export default router;
