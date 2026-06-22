import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding orders for Lab accounts...');
  
  const tests = await prisma.test.findMany({ take: 10 });
  
  if (tests.length === 0) {
    console.error('No tests found. Please seed them first.');
    return;
  }

  // Ensure patient exists
  await prisma.patient.upsert({
    where: { id: 'P-12345' },
    update: {},
    create: { id: 'P-12345', name: 'Demo Patient', email: 'demo@example.com', phone: '1234567890' }
  });

  await prisma.patientOrder.deleteMany();

  const today = new Date();

  const mockOrders = [
    {
      bookingId: "BK-1001",
      userId: "P-12345",
      labId: "L-001",
      amountPaid: 1250,
      status: "REPORT_GENERATED" as any,
      priority: "MEDIUM" as any,
      appointmentDate: setMinutes(setHours(today, 9), 0),
      timeSlot: "Today, 09:00 AM",
      tests: { connect: [{ id: tests[0].id }, { id: tests[1].id }] }
    },
    {
      bookingId: "BK-1003",
      userId: "P-12345",
      labId: "L-001",
      amountPaid: 850,
      status: "SCHEDULED" as any,
      priority: "LOW" as any,
      appointmentDate: setMinutes(setHours(addDays(today, 1), 10), 30),
      timeSlot: "Tomorrow, 10:30 AM",
      tests: { connect: [{ id: tests[4].id }] }
    },
    {
      bookingId: "BK-1004",
      userId: "P-12345",
      labId: "L-001",
      amountPaid: 1500,
      status: "SCHEDULED" as any,
      priority: "HIGH" as any,
      appointmentDate: setMinutes(setHours(addDays(today, 2), 11), 0),
      timeSlot: "May 20, 11:00 AM",
      tests: { connect: [{ id: tests[5].id }] }
    },
    {
      bookingId: "BK-1002",
      userId: "P-12345",
      labId: "L-002",
      amountPaid: 2100,
      status: "PICKEDUP" as any,
      priority: "HIGH" as any,
      appointmentDate: setMinutes(setHours(today, 14), 0),
      timeSlot: "Today, 02:00 PM",
      tests: { connect: [{ id: tests[2].id }, { id: tests[3].id }] }
    }
  ];

  for (const o of mockOrders) {
    await prisma.patientOrder.create({
      data: o
    });
  }

  console.log('Detailed order seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
