import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const labs = [
  { id: "L-001", name: "LAB A", address: "Sector 15, Medical Square", lat: 19.0760, lng: 72.8777, discount: 45, popularity: 1, nabl: true, homeCollection: true, rating: 4.9 },
  { id: "L-002", name: "LAB B", address: "Green Valley Road, North Hills", lat: 19.0800, lng: 72.8800, discount: 35, popularity: 2, nabl: true, homeCollection: true, rating: 4.7 },
  { id: "L-003", name: "LAB C", address: "Sunset Boulevard, West Plaza", lat: 19.0700, lng: 72.8700, discount: 30, popularity: 3, nabl: false, homeCollection: true, rating: 4.5 },
];

async function main() {
  console.log('Seeding labs with fixed IDs...');
  
  await prisma.lab.deleteMany();

  for (const lab of labs) {
    await prisma.lab.create({
      data: lab
    });
  }

  console.log('Lab seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
