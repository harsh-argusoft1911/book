import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Master Seed...');

  // 1. Run Tests Seed
  console.log('Seeding Tests...');
  execSync('npx ts-node prisma/seed_tests.ts', { stdio: 'inherit' });

  // 2. Run Labs Seed
  console.log('Seeding Labs...');
  execSync('npx ts-node prisma/seed_labs.ts', { stdio: 'inherit' });

  // 3. Run Coupons Seed
  console.log('Seeding Coupons...');
  execSync('npx ts-node prisma/seed_coupons.ts', { stdio: 'inherit' });

  // 4. Run Bookings Seed (depends on tests and labs)
  console.log('Seeding Bookings...');
  execSync('npx ts-node prisma/seed_bookings.ts', { stdio: 'inherit' });

  console.log('Master Seed Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
