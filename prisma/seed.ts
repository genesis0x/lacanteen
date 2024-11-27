import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Create staff user
  await prisma.user.upsert({
    where: { email: 'staff@school.com' },
    update: {},
    create: {
      email: 'staff@school.com',
      name: 'Staff User',
      password: hashedPassword,
      role: 'STAFF',
    },
  });

  // Create student
  await prisma.student.upsert({
    where: { cardId: '0005235426' }, // Change to a unique cardId
    update: {},
    create: {
      name: 'Student One',
      cardId: '0005235426', // Unique identifier for the student
      grade: '5th Grade', // Specify the grade
      balance: 9950.0, // Initial balance
      email : 'lacanteen@elitelac.com'
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
