const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test data...');

  // ===== ROLES =====
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

  // ===== ADMIN USER =====
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@test.com' },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('password123', 12);

    adminUser = await prisma.user.create({
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

  // ===== EVENT TYPES =====
  const eventTypes = [
    { name: 'KSEC', shortCode: 'KSEC', description: 'Karnataka State Equestrian Championship' },
    { name: 'EPL', shortCode: 'EPL', description: 'Equestrian Premier League' },
    { name: 'EIRS Show', shortCode: 'EIRS', description: 'EIRS Championship Show' },
  ];

  for (const type of eventTypes) {
    const existing = await prisma.eventType.findUnique({
      where: { shortCode: type.shortCode },
    });
    if (!existing) {
      await prisma.eventType.create({ data: type });
    }
  }
  console.log('✓ Created event types');

  // ===== CLUBS =====
  const clubs = [
    {
      name: 'Bangalore Equestrian Club',
      shortCode: 'BEC',
      email: 'contact@bec.in',
      city: 'Bangalore',
      state: 'Karnataka',
    },
    {
      name: 'Delhi Horse Trials',
      shortCode: 'DHT',
      email: 'contact@dht.in',
      city: 'Delhi',
      state: 'Delhi',
    },
    {
      name: 'Mumbai Riding Association',
      shortCode: 'MRA',
      email: 'contact@mra.in',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  ];

  const createdClubs = [];
  for (const club of clubs) {
    let existing = await prisma.club.findUnique({
      where: { shortCode: club.shortCode },
    });
    if (!existing) {
      existing = await prisma.club.create({
        data: {
          ...club,
          registrationNumber: `REG-${club.shortCode}-2026`,
          contactNumber: '+91-9876543210',
          address: '123 Main Street',
          country: 'India',
          pincode: '560001',
          gstNumber: `GST-${club.shortCode}-2026`,
          description: `${club.name} - Premier equestrian facility`,
          isActive: true,
          primaryContact: { connect: { id: adminUser.id } },
        },
      });
    }
    createdClubs.push(existing);
  }
  console.log(`✓ Available clubs: ${createdClubs.length}`);

  // ===== EVENT CATEGORIES =====
  const categories = [
    { name: 'Working Hunter', price: 5000, cgst: 450, sgst: 450, igst: 0 },
    { name: 'Dressage', price: 6000, cgst: 540, sgst: 540, igst: 0 },
    { name: 'Cross Country', price: 7500, cgst: 675, sgst: 675, igst: 0 },
  ];

  const createdCategories = [];
  for (const category of categories) {
    let existing = await prisma.eventCategory.findFirst({
      where: { name: category.name },
    });
    if (!existing) {
      existing = await prisma.eventCategory.create({
        data: { ...category, isActive: true },
      });
    }
    createdCategories.push(existing);
  }
  console.log(`✓ Available event categories: ${createdCategories.length}`);

  // ===== VENUE =====
  let venue = await prisma.venue.findFirst({
    where: { name: 'Premier Equestrian Complex' },
  });

  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: 'Premier Equestrian Complex',
        address: '123 Equestrian Lane, Bangalore',
        isDefault: true,
      },
    });
    console.log('✓ Created venue');
  }

  // ===== EVENTS =====
  const events = [
    {
      eventType: 'KSEC',
      name: 'Spring Dressage Championship 2026',
      description: 'Annual spring dressage championship for all levels',
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-04-17'),
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      venueName: 'Premier Equestrian Complex',
    },
    {
      eventType: 'EPL',
      name: 'Summer Working Hunter Series',
      description: 'Premier league working hunter competition',
      startDate: new Date('2026-05-20'),
      endDate: new Date('2026-05-22'),
      startTime: '08:00 AM',
      endTime: '06:00 PM',
      venueName: 'Premier Equestrian Complex',
    },
    {
      eventType: 'EIRS',
      name: 'Annual Cross Country Challenge',
      description: 'Exciting cross country event for experienced riders',
      startDate: new Date('2026-06-10'),
      endDate: new Date('2026-06-12'),
      startTime: '07:00 AM',
      endTime: '04:00 PM',
      venueName: 'Premier Equestrian Complex',
    },
  ];

  const createdEvents = [];
  for (const event of events) {
    let existing = await prisma.event.findFirst({
      where: { name: event.name },
    });
    if (!existing) {
      existing = await prisma.event.create({
        data: {
          ...event,
          isPublished: false,
          venueId: venue.id,
          categories: {
            connect: createdCategories.map(cat => ({ id: cat.id })),
          },
        },
      });
    }
    createdEvents.push(existing);
  }
  console.log(`✓ Available events: ${createdEvents.length}`);

  // ===== RIDERS =====
  const riders = [
    {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'rajesh.rider@test.com',
      gender: 'Male',
      mobile: '+919876543210',
    },
    {
      firstName: 'Priya',
      lastName: 'Singh',
      email: 'priya.rider@test.com',
      gender: 'Female',
      mobile: '+919876543211',
    },
    {
      firstName: 'Arjun',
      lastName: 'Patel',
      email: 'arjun.rider@test.com',
      gender: 'Male',
      mobile: '+919876543212',
    },
  ];

  const riderPassword = await bcrypt.hash('rider123', 12);

  const createdRiders = [];
  for (let i = 0; i < riders.length; i++) {
    let existing = await prisma.rider.findUnique({
      where: { email: riders[i].email },
    });
    if (!existing) {
      // Create User account for the rider
      let riderUser = await prisma.user.findUnique({
        where: { email: riders[i].email },
      });
      if (!riderUser) {
        riderUser = await prisma.user.create({
          data: {
            email: riders[i].email,
            password: riderPassword,
            firstName: riders[i].firstName,
            lastName: riders[i].lastName,
            gender: riders[i].gender,
            phone: riders[i].mobile,
            isActive: true,
            isApproved: true,
            profileComplete: true,
            isGoogleAuth: false,
            roles: {
              connect: [{ id: riderRole.id }],
            },
          },
        });
      }

      existing = await prisma.rider.create({
        data: {
          ...riders[i],
          clubId: createdClubs[i % createdClubs.length].id,
          userId: riderUser.id,
          isActive: true,
        },
      });
    }
    createdRiders.push(existing);
  }
  console.log(`✓ Available riders: ${createdRiders.length}`);

  // ===== HORSES =====
  const horses = [
    {
      name: 'Thunder',
      color: 'Bay',
      passportNumber: 'IND-2020-001',
      gender: 'Stallion',
      yearOfBirth: 2015,
    },
    {
      name: 'Lady',
      color: 'Chestnut',
      passportNumber: 'IND-2018-005',
      gender: 'Mare',
      yearOfBirth: 2016,
    },
    {
      name: 'Storm',
      color: 'Grey',
      passportNumber: 'IND-2019-012',
      gender: 'Gelding',
      yearOfBirth: 2017,
    },
  ];

  const createdHorses = [];
  for (let i = 0; i < horses.length; i++) {
    let existing = await prisma.horse.findFirst({
      where: { passportNumber: horses[i].passportNumber },
    });
    if (!existing) {
      existing = await prisma.horse.create({
        data: {
          ...horses[i],
          riderId: createdRiders[i].id,
          clubId: createdClubs[i % createdClubs.length].id,
          isActive: true,
        },
      });
    }
    createdHorses.push(existing);
  }
  console.log(`✓ Available horses: ${createdHorses.length}`);

  // ===== REGISTRATIONS =====
  const createdRegistrations = [];
  if (createdEvents.length > 0 && createdRiders.length > 0 && createdHorses.length > 0) {
    for (let i = 0; i < Math.min(3, createdEvents.length); i++) {
      let registration = await prisma.registration.findFirst({
        where: {
          eventId: createdEvents[i].id,
          riderId: createdRiders[i].id,
          horseId: createdHorses[i].id,
        },
      });
      
      if (!registration) {
        registration = await prisma.registration.create({
          data: {
            eventId: createdEvents[i].id,
            riderId: createdRiders[i].id,
            horseId: createdHorses[i].id,
            clubId: createdClubs[i % createdClubs.length].id,
            categoryId: createdCategories[i % createdCategories.length].id,
            eventAmount: createdCategories[i % createdCategories.length].price,
            stableAmount: 1500,
            gstAmount: createdCategories[i % createdCategories.length].cgst + createdCategories[i % createdCategories.length].sgst,
            totalAmount: createdCategories[i % createdCategories.length].price + 1500 + createdCategories[i % createdCategories.length].cgst + createdCategories[i % createdCategories.length].sgst,
            paymentStatus: 'UNPAID',
          },
        });
      }
      
      createdRegistrations.push(registration);
    }
    console.log(`✓ Available registrations: ${createdRegistrations.length}`);
  }

  // ===== TRANSACTIONS (with GST breakdown) =====
  if (createdRegistrations.length > 0) {
    for (let i = 0; i < createdRegistrations.length; i++) {
      const reg = createdRegistrations[i];
      const category = createdCategories[i % createdCategories.length];
      
      // Check if transaction already exists
      const existingTxn = await prisma.transaction.findFirst({
        where: { registrationId: reg.id },
      });
      
      if (!existingTxn) {
        // Calculate GST values
        const cgstAmount = category.cgst;
        const sgstAmount = category.sgst;
        const igstAmount = 0; // Using CGST + SGST (inter-state not applicable here)
        
        await prisma.transaction.create({
          data: {
            registrationId: reg.id,
            amount: reg.eventAmount,
            gstAmount: reg.gstAmount, // Legacy field
            cgstAmount: cgstAmount,
            sgstAmount: sgstAmount,
            igstAmount: igstAmount,
            totalAmount: reg.totalAmount,
            status: 'UNPAID',
            paymentMethod: 'online',
            referenceNumber: `TXN-${Date.now()}-${i}`,
            notes: `Transaction for ${category.name} registration`,
          },
        });
      }
    }
    console.log(`✓ Transactions with GST: ${createdRegistrations.length}`);
  }

  console.log('');
  console.log('✅ Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Events: ${createdEvents.length}`);
  console.log(`   Clubs: ${createdClubs.length}`);
  console.log(`   Event Categories: ${createdCategories.length}`);
  console.log(`   Riders: ${createdRiders.length}`);
  console.log(`   Horses: ${createdHorses.length}`);
  console.log(`   Registrations: ${createdRegistrations.length}`);
  console.log(`   Transactions: ${createdRegistrations.length}`);
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('   Email: admin@test.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
