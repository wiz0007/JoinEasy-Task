import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await hashPassword('Password123!');

  // Seed Admin / Professor
  const admin = await prisma.user.upsert({
    where: { email: 'professor@joineazy.edu' },
    update: {},
    create: {
      name: 'Professor Joineazy',
      email: 'professor@joineazy.edu',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin seeded: ${admin.email}`);

  // Seed Student 1
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@joineazy.edu' },
    update: {},
    create: {
      name: 'Alice Student',
      email: 'student1@joineazy.edu',
      studentId: 'STU-001',
      passwordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Student 1 seeded: ${student1.email} (${student1.studentId})`);

  // Seed Student 2
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@joineazy.edu' },
    update: {},
    create: {
      name: 'Bob Student',
      email: 'student2@joineazy.edu',
      studentId: 'STU-002',
      passwordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Student 2 seeded: ${student2.email} (${student2.studentId})`);

  // Seed Student 3
  const student3 = await prisma.user.upsert({
    where: { email: 'charlie@joineazy.edu' },
    update: {},
    create: {
      name: 'Charlie Student',
      email: 'charlie@joineazy.edu',
      studentId: 'STU-003',
      passwordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Student 3 seeded: ${student3.email} (${student3.studentId})`);

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
