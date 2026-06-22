export const patients = [
  {
    id: "P-12345",
    name: "Alex Johnson",
    age: 32,
    gender: "Male",
    healthScore: 84,
    points: 1250,
  }
];

export const categories = [
  "All", "Diabetes", "Thyroid", "Heart", "Liver", "Vitamins", "Full Body", "Women's Health"
];

export const tests = [
  { id: "T1", name: "Complete Blood Count (CBC)", category: "Full Body", price: 499, time: "24 hrs" },
  { id: "T2", name: "HbA1c (Diabetes)", category: "Diabetes", price: 599, time: "12 hrs" },
  { id: "T3", name: "Thyroid Profile (T3, T4, TSH)", category: "Thyroid", price: 899, time: "24 hrs" },
  { id: "T4", name: "Lipid Profile (Heart)", category: "Heart", price: 799, time: "12 hrs" },
  { id: "T5", name: "Liver Function Test (LFT)", category: "Liver", price: 699, time: "24 hrs" },
  { id: "T6", name: "Vitamin D (25-OH)", category: "Vitamins", price: 1299, time: "48 hrs" },
  { id: "T7", name: "Vitamin B12", category: "Vitamins", price: 999, time: "48 hrs" },
  { id: "T8", name: "Kidney Function Test (KFT)", category: "Full Body", price: 799, time: "24 hrs" },
];

export const labs = [
  {
    id: "L1",
    name: "City Diagnostics",
    address: "123 Health Ave, Downtown",
    distance: "1.2 km",
    rating: 4.8,
    homeCollection: true,
    nabl: true
  },
  {
    id: "L2",
    name: "Metro Labs",
    address: "456 Main St, Westside",
    distance: "3.5 km",
    rating: 4.5,
    homeCollection: true,
    nabl: true
  },
  {
    id: "L3",
    name: "Care Pathlabs",
    address: "789 Park Rd, Northside",
    distance: "5.1 km",
    rating: 4.2,
    homeCollection: false,
    nabl: true
  },
  {
    id: "L4",
    name: "Quick Diagnostics",
    address: "101 Speed Ln, Eastside",
    distance: "6.2 km",
    rating: 4.0,
    homeCollection: true,
    nabl: false
  },
  {
    id: "L5",
    name: "Elite Medical Center",
    address: "202 Luxury Way, Southside",
    distance: "8.4 km",
    rating: 4.9,
    homeCollection: true,
    nabl: true
  }
];

export const reports = [
  {
    id: "R1",
    testName: "Full Body Checkup",
    date: "15 Oct 2023",
    lab: "City Diagnostics",
    status: "Ready",
    results: [
      { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", range: "13.5-17.5", status: "Normal" },
      { parameter: "Blood Sugar (F)", value: "105", unit: "mg/dL", range: "70-100", status: "High" }
    ]
  },
  {
    id: "R2",
    testName: "Vitamin D Test",
    date: "02 Sep 2023",
    lab: "Metro Labs",
    status: "Ready",
    results: [
      { parameter: "Vitamin D", value: "24", unit: "ng/mL", range: "30-100", status: "Low" }
    ]
  }
];

export const biomarkerData = [
  { month: "May", glucose: 98, hemoglobin: 13.8 },
  { month: "Jun", glucose: 102, hemoglobin: 14.0 },
  { month: "Jul", glucose: 95, hemoglobin: 13.9 },
  { month: "Aug", glucose: 110, hemoglobin: 14.1 },
  { month: "Sep", glucose: 105, hemoglobin: 14.2 },
  { month: "Oct", glucose: 105, hemoglobin: 14.2 },
];
