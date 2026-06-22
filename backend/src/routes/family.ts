import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get family members for a patient
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { family: { include: { members: true } } }
    });

    if (!patient || !patient.family) {
      // If no family exists, return just the patient as a family of one
      return res.json([patient]);
    }

    res.json(patient.family.members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// Add a new family member (Saved Profile)
router.post('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, age, gender, relation, height, weight, email, phone, addressLine1, addressLine2, pincode } = req.body;

    // Basic Validations
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone are required' });
    }

    if (phone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    let patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { family: true }
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    let familyId = patient.familyId;

    // Create a family group if it doesn't exist
    if (!familyId) {
      const newFamily = await prisma.family.create({
        data: { name: `${patient.name}'s Saved Profiles` }
      });
      familyId = newFamily.id;
      
      // Update original patient with the new familyId
      await prisma.patient.update({
        where: { id: patientId },
        data: { familyId, relation: 'Self' }
      });
    }

    // Check if phone or email already exists to avoid unique constraint violation
    const existing = await prisma.patient.findFirst({
      where: {
        OR: [
          { phone: phone },
          ...(email ? [{ email: email }] : [])
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'A profile with this phone or email already exists' });
    }

    const newMember = await prisma.patient.create({
      data: {
        name,
        age: age ? parseInt(age) : null,
        gender,
        relation,
        height: (height && !isNaN(parseFloat(height))) ? parseFloat(height) : null,
        weight: (weight && !isNaN(parseFloat(weight))) ? parseFloat(weight) : null,
        email: email || null,
        phone,
        addressLine1,
        addressLine2,
        pincode,
        familyId: familyId as string
      }
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add saved profile' });
  }
});

export default router;
