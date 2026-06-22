import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const coupons = [
  { code: "SAVE10", discountPercent: 10, description: "Get 10% off on all tests" },
  { code: "HEALTH20", discountPercent: 20, description: "New user special: 20% off" },
  { code: "MEDICARE30", discountPercent: 30, description: "Limited time flat 30% discount" },
];

async function main() {
  console.log('Seeding coupons...');
  
  await prisma.coupon.deleteMany();

  for (const coupon of coupons) {
    await prisma.coupon.create({
      data: coupon
    });
  }

  console.log('Coupon seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
