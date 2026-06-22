import express from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Lazy initializer for Gemini to ensure process.env is loaded
let genAI: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing from environment');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

// Helper to convert file to GoogleGenerativeAI.Part
function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

router.post('/analyze/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Check if we already have an insight to avoid redundant API calls
    const existingInsight = await prisma.aIInsight.findUnique({
      where: { orderId }
    });
    if (existingInsight) {
      return res.json(existingInsight.insightData);
    }

    // 2. Fetch order and report path
    const order = await prisma.patientOrder.findUnique({
      where: { id: orderId },
      include: { tests: true }
    });

    if (!order || !order.reportUrl) {
      return res.status(404).json({ error: 'Order or report not found' });
    }

    // Extract filename from URL (assuming format: http://localhost:5000/uploads/filename)
    const fileName = order.reportUrl.split('/').pop();
    if (!fileName) return res.status(400).json({ error: 'Invalid report URL' });

    const filePath = path.join(process.cwd(), 'uploads', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report file not found on server' });
    }

    // 2.5 Fetch all available tests to provide as context to AI
    const availableTests = await prisma.test.findMany({
      select: { name: true, category: true }
    });
    const testsContext = availableTests.map(t => `${t.name} (${t.category})`).join(', ');

    // 3. Prepare Gemini Prompt
    const model = getGenAI().getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an expert medical diagnostic assistant. Analyze the provided pathology report PDF and extract health insights.
      
      Return ONLY a JSON object with the following structure:
      {
        "overallHealthScore": number (0-100, where 100 is perfect health),
        "summary": "string",
        "summaryPoints": ["string (7-8 points explaining specific findings and their significance)"],
        "oneLineTip": "string (A single, encouraging, actionable health tip based on the report)",
        "riskMeters": {
          "diabetes": number (0-100 risk level),
          "heart": number (0-100 risk level),
          "thyroid": number (0-100 risk level),
          "anemia": number (0-100 risk level),
          "liver": number (0-100 risk level),
          "kidney": number (0-100 risk level)
        },
        "attentionRequired": [
          {
            "parameter": "string (e.g., Hemoglobin)",
            "value": "string (e.g., 10.2)",
            "referenceRange": "string (e.g., 13.5-17.5)",
            "severity": "LOW|MEDIUM|HIGH",
            "observation": "string"
          }
        ],
        "naturalRemedies": {
          "fruits": ["string"],
          "vegetables": ["string"],
          "exercises": ["string"]
        },
        "nextSteps": [
          {
            "testName": "string",
            "reason": "string"
          }
        ],
        "flagged": boolean (set to true if any risk meter is > 75 or health score < 60)
      }

      Context for specific logic:
      - Available Tests in our system: [${testsContext}]
      - ALWAYS try to map recommended tests to the "Available Tests" listed above. Use the EXACT name from the list if it fits the clinical need.
      - If Hemoglobin is low, suggest iron-rich fruits (pomegranate, apples), green leafy vegetables (spinach), and light exercises.
      - If any bone-related parameter is low, suggest Calcium or Vitamin D tests in nextSteps.
      - Be very careful with medical accuracy based strictly on the provided report.
    `;

    const pdfPart = fileToGenerativePart(filePath, "application/pdf");

    const result = await model.generateContent([prompt, pdfPart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handling potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }
    
    const insightData = JSON.parse(jsonMatch[0]);

    // 4. Save to DB
    const newInsight = await prisma.aIInsight.create({
      data: {
        orderId,
        insightData
      }
    });

    res.json(newInsight.insightData);
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: 'AI Analysis failed', details: error.message });
  }
});

// Fetch the latest insight for a patient to show on the main insights dashboard
router.get('/latest/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const latestInsight = await prisma.aIInsight.findFirst({
      where: {
        order: {
          userId: patientId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!latestInsight) {
      return res.status(404).json({ error: 'No insights found for this patient' });
    }

    res.json(latestInsight.insightData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest insight' });
  }
});

export default router;
