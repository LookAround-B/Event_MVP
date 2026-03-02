const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin role if it doesn't exist
  let adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'Administrator role',
        isActive: true,
      },
    });
    console.log('✓ Created admin role');
  }

  // Create rider role if it doesn't exist
  let riderRole = await prisma.role.findUnique({
    where: { name: 'rider' },
  });

  if (!riderRole) {
    riderRole = await prisma.role.create({
      data: {
        name: 'rider',
        description: 'Rider role',
        isActive: true,
      },
    });
    console.log('✓ Created rider role');
  }

  // Create admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@test.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('password123', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        gender: 'Other',
        phone: '+1234567890',
        isActive: true,
        isApproved: true,
        profileComplete: true,
        isGoogleAuth: false,
        roles: {
          connect: [{ id: adminRole.id }],
        },
      },
    });
    console.log('✓ Created admin user (admin@test.com)');
  } else {
    console.log('ℹ Admin user already exists');
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
