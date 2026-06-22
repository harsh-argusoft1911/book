import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testCategories = {
  "Routine Health Checkups": [
    "Complete Blood Count (CBC)",
    "ESR (Erythrocyte Sedimentation Rate)",
    "Blood Sugar (Fasting)",
    "Blood Sugar (Random)",
    "Urine Routine Examination",
    "Peripheral Smear",
    "Blood Group & Rh Typing"
  ],
  "Diabetes & Metabolic Tests": [
    "Fasting Blood Sugar (FBS)",
    "Postprandial Blood Sugar (PPBS)",
    "HbA1c",
    "Glucose Tolerance Test (GTT)",
    "Insulin (Fasting)",
    "C-Peptide",
    "HOMA-IR",
    "Fructosamine"
  ],
  "Liver Function Tests (LFT)": [
    "SGPT (ALT)",
    "SGOT (AST)",
    "Alkaline Phosphatase (ALP)",
    "Gamma GT (GGT)",
    "Bilirubin Total",
    "Bilirubin Direct",
    "Bilirubin Indirect",
    "Albumin",
    "Globulin",
    "A/G Ratio",
    "Total Protein"
  ],
  "Kidney Function Tests (KFT/RFT)": [
    "Serum Creatinine",
    "Blood Urea",
    "BUN",
    "Uric Acid",
    "Sodium",
    "Potassium",
    "Chloride",
    "Calcium",
    "Phosphorus",
    "eGFR"
  ],
  "Cardiac Tests": [
    "Lipid Profile",
    "Troponin I",
    "Troponin T",
    "CK-MB",
    "LDH",
    "Homocysteine",
    "hs-CRP",
    "Apolipoprotein A1",
    "Apolipoprotein B"
  ],
  "Thyroid Tests": [
    "T3",
    "T4",
    "TSH",
    "Free T3",
    "Free T4",
    "Anti-TPO Antibodies",
    "Anti-Thyroglobulin Antibodies"
  ],
  "Vitamin & Deficiency Tests": [
    "Vitamin D (25-OH)",
    "Vitamin B12",
    "Folate",
    "Iron",
    "Ferritin",
    "TIBC",
    "Transferrin Saturation",
    "Calcium",
    "Magnesium",
    "Zinc"
  ],
  "Hormonal Tests": [
    "Testosterone",
    "Free Testosterone",
    "Estradiol (E2)",
    "Progesterone",
    "Prolactin",
    "LH",
    "FSH",
    "Cortisol",
    "DHEA-S",
    "AMH"
  ],
  "Infection & Serology Tests": [
    "HIV 1 & 2",
    "HBsAg (Hepatitis B)",
    "HCV (Hepatitis C)",
    "Dengue NS1 Antigen",
    "Dengue IgG",
    "Dengue IgM",
    "Malaria Parasite",
    "Widal Test (Typhoid)",
    "COVID-19 RT-PCR",
    "CRP",
    "Procalcitonin"
  ],
  "Urine Tests": [
    "Urine Routine",
    "Urine Microscopy",
    "Urine Culture",
    "Urine Protein",
    "Urine Microalbumin",
    "24 Hour Urine Protein",
    "Urine Creatinine"
  ],
  "Stool Tests": [
    "Stool Routine",
    "Stool Microscopy",
    "Stool Culture",
    "Occult Blood Test",
    "Ova & Parasites"
  ],
  "Cancer / Tumor Markers": [
    "PSA",
    "CEA",
    "AFP",
    "CA-125",
    "CA 19-9",
    "CA 15-3",
    "Beta-hCG",
    "Calcitonin"
  ],
  "Coagulation Tests": [
    "Prothrombin Time (PT)",
    "INR",
    "aPTT",
    "D-Dimer",
    "Fibrinogen"
  ],
  "Autoimmune Tests": [
    "ANA",
    "Anti-dsDNA",
    "Rheumatoid Factor (RF)",
    "Anti-CCP",
    "CRP",
    "ESR",
    "ANCA"
  ],
  "Allergy Tests": [
    "Total IgE",
    "Specific IgE",
    "Allergy Panel (Food)",
    "Allergy Panel (Inhalants)"
  ],
  "Genetic & Specialized Tests": [
    "Karyotyping",
    "PCR Tests",
    "BRCA Mutation",
    "Thalassemia Screening",
    "HLA Typing"
  ],
  "Electrolyte & Mineral Panel": [
    "Sodium",
    "Potassium",
    "Chloride",
    "Calcium",
    "Magnesium",
    "Phosphorus"
  ]
};

async function main() {
  console.log('Seeding tests from categories...');
  
  // Clear existing tests first to avoid duplicates or messy data
  await prisma.test.deleteMany();

  for (const [category, tests] of Object.entries(testCategories)) {
    console.log(`Adding ${category}...`);
    for (const testName of tests) {
      await prisma.test.create({
        data: {
          name: testName,
          category: category,
          price: Math.floor(Math.random() * (2500 - 300 + 1)) + 300, // Random price between 300 and 2500
          description: `${testName} for ${category} assessment.`
        }
      });
    }
  }

  console.log('Test seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
