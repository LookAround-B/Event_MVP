const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ===== RANDOM DATA HELPERS =====
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPhone() {
  return `+91${randInt(7000000000, 9999999999)}`;
}

function randDate(startMonth, endMonth, year = 2026) {
  const month = randInt(startMonth, endMonth);
  const day = randInt(1, 28);
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
}

const firstNamesMale = ['Rajesh', 'Arjun', 'Vikram', 'Sanjay', 'Amit', 'Rohan', 'Karan', 'Nikhil', 'Aditya', 'Manish', 'Suresh', 'Deepak', 'Rahul', 'Ajay', 'Ravi', 'Pranav', 'Gaurav', 'Harsh', 'Vivek', 'Ankur'];
const firstNamesFemale = ['Priya', 'Ananya', 'Kavya', 'Neha', 'Shruti', 'Pooja', 'Divya', 'Meera', 'Isha', 'Tanvi', 'Ritu', 'Swati', 'Nisha', 'Sakshi', 'Aditi', 'Sneha', 'Pallavi', 'Komal', 'Jyoti', 'Sonal'];
const lastNames = ['Kumar', 'Singh', 'Patel', 'Sharma', 'Verma', 'Gupta', 'Reddy', 'Nair', 'Rao', 'Joshi', 'Mehta', 'Chauhan', 'Das', 'Iyer', 'Malhotra', 'Bhat', 'Pillai', 'Saxena', 'Kapoor', 'Thakur'];

const horseNames = ['Thunder', 'Lady', 'Storm', 'Blaze', 'Shadow', 'Spirit', 'Apollo', 'Midnight', 'Pegasus', 'Arrow', 'Comet', 'Mustang', 'Phoenix', 'Titan', 'Zephyr', 'Eclipse', 'Maverick', 'Duchess', 'Gallant', 'Whisper'];
const horseColors = ['Bay', 'Chestnut', 'Grey', 'Black', 'Palomino', 'Roan', 'Dun', 'Buckskin', 'Pinto', 'Appaloosa'];
const horseGenders = ['Stallion', 'Mare', 'Gelding'];
const horseBreeds = ['Thoroughbred', 'Arabian', 'Marwari', 'Kathiawari', 'Hanoverian', 'Warmblood', 'Quarter Horse', 'Friesian', 'Andalusian', 'Lipizzaner'];

const indianCities = [
  { city: 'Bangalore', state: 'Karnataka', pin: '560001' },
  { city: 'Delhi', state: 'Delhi', pin: '110001' },
  { city: 'Mumbai', state: 'Maharashtra', pin: '400001' },
  { city: 'Chennai', state: 'Tamil Nadu', pin: '600001' },
  { city: 'Hyderabad', state: 'Telangana', pin: '500001' },
  { city: 'Pune', state: 'Maharashtra', pin: '411001' },
  { city: 'Jaipur', state: 'Rajasthan', pin: '302001' },
  { city: 'Kolkata', state: 'West Bengal', pin: '700001' },
  { city: 'Ahmedabad', state: 'Gujarat', pin: '380001' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pin: '226001' },
  { city: 'Chandigarh', state: 'Chandigarh', pin: '160001' },
  { city: 'Dehradun', state: 'Uttarakhand', pin: '248001' },
  { city: 'Goa', state: 'Goa', pin: '403001' },
  { city: 'Mysore', state: 'Karnataka', pin: '570001' },
  { city: 'Coimbatore', state: 'Tamil Nadu', pin: '641001' },
  { city: 'Nagpur', state: 'Maharashtra', pin: '440001' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pin: '462001' },
  { city: 'Indore', state: 'Madhya Pradesh', pin: '452001' },
  { city: 'Udaipur', state: 'Rajasthan', pin: '313001' },
  { city: 'Cochin', state: 'Kerala', pin: '682001' },
];

const startTimes = ['06:00 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM'];
const endTimes = ['03:00 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'];
const paymentStatuses = ['UNPAID', 'PAID', 'PARTIAL'];
const paymentMethods = ['online', 'cash', 'bank_transfer', 'cheque'];

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

  let clubRole = await prisma.role.findUnique({
    where: { name: 'club' },
  });

  if (!clubRole) {
    clubRole = await prisma.role.create({
      data: {
        name: 'club',
        description: 'Club role',
        isActive: true,
      },
    });
    console.log('✓ Created club role');
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
    { name: 'National Championship', shortCode: 'NATL', description: 'National Equestrian Championship' },
    { name: 'Club Series', shortCode: 'CLUB', description: 'Inter-Club Competition Series' },
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

  // ===== CLUBS (20) =====
  const clubPassword = await bcrypt.hash('club123', 12);

  const clubData = [
    { name: 'Bangalore Equestrian Club', shortCode: 'BEC' },
    { name: 'Delhi Horse Trials', shortCode: 'DHT' },
    { name: 'Mumbai Riding Association', shortCode: 'MRA' },
    { name: 'Chennai Equestrian Centre', shortCode: 'CEC' },
    { name: 'Hyderabad Polo & Riding Club', shortCode: 'HPRC' },
    { name: 'Pune Equestrian Academy', shortCode: 'PEA' },
    { name: 'Jaipur Royal Riders', shortCode: 'JRR' },
    { name: 'Kolkata Saddle Club', shortCode: 'KSC' },
    { name: 'Ahmedabad Equine Sports', shortCode: 'AES' },
    { name: 'Lucknow Riding School', shortCode: 'LRS' },
    { name: 'Chandigarh Horse Club', shortCode: 'CHC' },
    { name: 'Dehradun Valley Riders', shortCode: 'DVR' },
    { name: 'Goa Equestrian Society', shortCode: 'GES' },
    { name: 'Mysore Heritage Riders', shortCode: 'MHR' },
    { name: 'Coimbatore Cavalry Club', shortCode: 'CCC' },
    { name: 'Nagpur Equestrian Forum', shortCode: 'NEF' },
    { name: 'Bhopal Riding Institute', shortCode: 'BRI' },
    { name: 'Indore Horse Sports', shortCode: 'IHS' },
    { name: 'Udaipur Royal Equestrians', shortCode: 'URE' },
    { name: 'Cochin Equine Academy', shortCode: 'CEA' },
  ];

  const createdClubs = [];
  for (let i = 0; i < clubData.length; i++) {
    const club = clubData[i];
    const loc = indianCities[i % indianCities.length];
    const clubEmail = `contact@${club.shortCode.toLowerCase()}.in`;

    // Create a user account for the club if it doesn't exist
    let clubUser = await prisma.user.findUnique({ where: { email: clubEmail } });
    if (!clubUser) {
      clubUser = await prisma.user.create({
        data: {
          email: clubEmail,
          password: clubPassword,
          firstName: club.name,
          lastName: 'Admin',
          gender: 'Other',
          phone: randPhone(),
          isActive: true,
          isApproved: true,
          profileComplete: true,
          isGoogleAuth: false,
          roles: { connect: [{ id: clubRole.id }] },
        },
      });
    }

    let existing = await prisma.club.findUnique({
      where: { shortCode: club.shortCode },
    });
    if (!existing) {
      existing = await prisma.club.create({
        data: {
          name: club.name,
          shortCode: club.shortCode,
          email: clubEmail,
          registrationNumber: `REG-${club.shortCode}-2026`,
          contactNumber: randPhone(),
          address: `${randInt(1, 500)} ${pick(['MG Road', 'Station Road', 'Race Course Road', 'Cantonment Area', 'Ring Road', 'Lake View Road'])}`,
          city: loc.city,
          state: loc.state,
          country: 'India',
          pincode: loc.pin,
          gstNumber: `GST-${club.shortCode}-2026`,
          description: `${club.name} - Premier equestrian facility in ${loc.city}`,
          isActive: true,
          primaryContact: { connect: { id: clubUser.id } },
        },
      });
    }
    createdClubs.push(existing);
  }
  console.log(`✓ Available clubs: ${createdClubs.length}`);

  // ===== EVENT CATEGORIES (20) =====
  const categoryData = [
    { name: 'Working Hunter', price: 5000 },
    { name: 'Dressage', price: 6000 },
    { name: 'Cross Country', price: 7500 },
    { name: 'Show Jumping 60cm', price: 4000 },
    { name: 'Show Jumping 80cm', price: 4500 },
    { name: 'Show Jumping 100cm', price: 5500 },
    { name: 'Show Jumping 120cm', price: 6500 },
    { name: 'Eventing Beginner', price: 5000 },
    { name: 'Eventing Intermediate', price: 7000 },
    { name: 'Eventing Advanced', price: 9000 },
    { name: 'Polo Exhibition', price: 8000 },
    { name: 'Tent Pegging', price: 3500 },
    { name: 'Endurance 40km', price: 6000 },
    { name: 'Endurance 80km', price: 8500 },
    { name: 'Para Dressage', price: 5500 },
    { name: 'Mounted Games', price: 3000 },
    { name: 'Reining', price: 5000 },
    { name: 'Vaulting', price: 4500 },
    { name: 'Combined Driving', price: 7000 },
    { name: 'Hunter Trials', price: 5500 },
  ];

  const createdCategories = [];
  for (const cat of categoryData) {
    const cgst = Math.round(cat.price * 0.09);
    const sgst = Math.round(cat.price * 0.09);
    let existing = await prisma.eventCategory.findFirst({
      where: { name: cat.name },
    });
    if (!existing) {
      existing = await prisma.eventCategory.create({
        data: { name: cat.name, price: cat.price, cgst, sgst, igst: 0, isActive: true },
      });
    }
    createdCategories.push(existing);
  }
  console.log(`✓ Available event categories: ${createdCategories.length}`);

  // ===== VENUES =====
  const venueData = [
    { name: 'Premier Equestrian Complex', address: '123 Equestrian Lane, Bangalore' },
    { name: 'Royal Grounds Arena', address: '45 Race Course Road, Delhi' },
    { name: 'Lakeside Riding Arena', address: '78 Lake View, Pune' },
    { name: 'Heritage Polo Grounds', address: '12 Polo Drive, Jaipur' },
    { name: 'Coastal Equine Park', address: '56 Beach Road, Goa' },
  ];

  const createdVenues = [];
  for (let i = 0; i < venueData.length; i++) {
    let existing = await prisma.venue.findFirst({
      where: { name: venueData[i].name },
    });
    if (!existing) {
      existing = await prisma.venue.create({
        data: { ...venueData[i], isDefault: i === 0 },
      });
    }
    createdVenues.push(existing);
  }
  console.log(`✓ Available venues: ${createdVenues.length}`);

  // ===== EVENTS (20) =====
  const eventTypeShortCodes = ['KSEC', 'EPL', 'EIRS', 'NATL', 'CLUB'];
  const eventNames = [
    'Spring Dressage Championship 2026',
    'Summer Working Hunter Series',
    'Annual Cross Country Challenge',
    'Monsoon Show Jumping Grand Prix',
    'Autumn Eventing Trials',
    'Winter Polo Cup',
    'National Dressage Finals',
    'Premier League Round 1',
    'Premier League Round 2',
    'Premier League Round 3',
    'EIRS Classic Show',
    'Young Riders Championship',
    'Junior Equestrian Meet',
    'Inter-Club Jumping Challenge',
    'Heritage Cup Cross Country',
    'Endurance Championship 2026',
    'Para Equestrian Nationals',
    'Reining Masters Open',
    'Combined Driving Festival',
    'Year-End Gala Show',
  ];

  const createdEvents = [];
  for (let i = 0; i < 20; i++) {
    const startDate = randDate(4 + Math.floor(i / 3), Math.min(12, 4 + Math.floor(i / 3) + 1));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + randInt(1, 3));

    let existing = await prisma.event.findFirst({
      where: { name: eventNames[i] },
    });
    if (!existing) {
      const assignedCategories = [];
      const numCats = randInt(2, 5);
      const catIndices = new Set();
      while (catIndices.size < numCats) {
        catIndices.add(randInt(0, createdCategories.length - 1));
      }
      catIndices.forEach(idx => assignedCategories.push(createdCategories[idx]));

      existing = await prisma.event.create({
        data: {
          eventType: pick(eventTypeShortCodes),
          name: eventNames[i],
          description: `${eventNames[i]} - a premier equestrian competition featuring top riders from across India`,
          startDate,
          endDate,
          startTime: pick(startTimes),
          endTime: pick(endTimes),
          venueName: createdVenues[i % createdVenues.length].name,
          isPublished: i < 10, // first 10 published
          venueId: createdVenues[i % createdVenues.length].id,
          categories: {
            connect: assignedCategories.map(cat => ({ id: cat.id })),
          },
        },
      });
    }
    createdEvents.push(existing);
  }
  console.log(`✓ Available events: ${createdEvents.length}`);

  // ===== RIDERS (20) =====
  const riders = [];
  for (let i = 0; i < 20; i++) {
    const gender = i % 2 === 0 ? 'Male' : 'Female';
    const firstName = gender === 'Male' ? firstNamesMale[i % firstNamesMale.length] : firstNamesFemale[i % firstNamesFemale.length];
    const lastName = lastNames[i % lastNames.length];
    riders.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.com`,
      gender,
      mobile: randPhone(),
    });
  }

  const riderPassword = await bcrypt.hash('rider123', 12);

  const createdRiders = [];
  for (let i = 0; i < riders.length; i++) {
    let existing = await prisma.rider.findUnique({
      where: { email: riders[i].email },
    });
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
          isApproved: i < 16, // 4 riders pending approval
          profileComplete: true,
          isGoogleAuth: false,
          roles: {
            connect: [{ id: riderRole.id }],
          },
        },
      });
      console.log(`  ✓ Created user account for ${riders[i].email}`);
    }

    if (!existing) {
      existing = await prisma.rider.create({
        data: {
          ...riders[i],
          clubId: createdClubs[i % createdClubs.length].id,
          userId: riderUser.id,
          isActive: true,
        },
      });
    } else if (!existing.userId) {
      await prisma.rider.update({
        where: { id: existing.id },
        data: { userId: riderUser.id },
      });
    }
    createdRiders.push(existing);
  }
  console.log(`✓ Available riders: ${createdRiders.length}`);

  // ===== HORSES (20) =====
  const createdHorses = [];
  for (let i = 0; i < 20; i++) {
    const passportNumber = `IND-${2018 + (i % 5)}-${String(i + 1).padStart(3, '0')}`;
    let existing = await prisma.horse.findFirst({
      where: { passportNumber },
    });
    if (!existing) {
      existing = await prisma.horse.create({
        data: {
          name: horseNames[i % horseNames.length],
          breed: pick(horseBreeds),
          color: pick(horseColors),
          passportNumber,
          gender: pick(horseGenders),
          yearOfBirth: randInt(2010, 2020),
          riderId: createdRiders[i % createdRiders.length].id,
          clubId: createdClubs[i % createdClubs.length].id,
          isActive: true,
        },
      });
    }
    createdHorses.push(existing);
  }
  console.log(`✓ Available horses: ${createdHorses.length}`);

  // ===== REGISTRATIONS (20) =====
  const createdRegistrations = [];
  if (createdEvents.length > 0 && createdRiders.length > 0 && createdHorses.length > 0) {
    for (let i = 0; i < 20; i++) {
      const eventIdx = i % createdEvents.length;
      const riderIdx = i % createdRiders.length;
      const horseIdx = i % createdHorses.length;
      const clubIdx = i % createdClubs.length;
      const catIdx = i % createdCategories.length;

      let registration = await prisma.registration.findFirst({
        where: {
          eventId: createdEvents[eventIdx].id,
          riderId: createdRiders[riderIdx].id,
          horseId: createdHorses[horseIdx].id,
        },
      });
      
      if (!registration) {
        const category = createdCategories[catIdx];
        const stableAmount = pick([0, 1000, 1500, 2000, 2500]);
        const gstAmount = (category.cgst || 0) + (category.sgst || 0);
        const totalAmount = category.price + stableAmount + gstAmount;
        const payStatus = pick(paymentStatuses);

        registration = await prisma.registration.create({
          data: {
            eventId: createdEvents[eventIdx].id,
            riderId: createdRiders[riderIdx].id,
            horseId: createdHorses[horseIdx].id,
            clubId: createdClubs[clubIdx].id,
            categoryId: category.id,
            eventAmount: category.price,
            stableAmount,
            gstAmount,
            totalAmount,
            paymentStatus: payStatus,
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
      
      const existingTxn = await prisma.transaction.findFirst({
        where: { registrationId: reg.id },
      });
      
      if (!existingTxn) {
        const cgstAmount = category.cgst || 0;
        const sgstAmount = category.sgst || 0;
        const txnStatus = reg.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID';
        
        await prisma.transaction.create({
          data: {
            registrationId: reg.id,
            amount: reg.eventAmount,
            gstAmount: reg.gstAmount,
            cgstAmount: cgstAmount,
            sgstAmount: sgstAmount,
            igstAmount: 0,
            totalAmount: reg.totalAmount,
            status: txnStatus,
            paymentMethod: pick(paymentMethods),
            referenceNumber: `TXN-${Date.now()}-${i}-${randInt(1000, 9999)}`,
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
  console.log('   Admin  - Email: admin@test.com / Password: password123');
  console.log('   Clubs  - Email: contact@{shortcode}.in / Password: club123');
  console.log('   Riders - Email: {firstname}.{lastname}{n}@test.com / Password: rider123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
