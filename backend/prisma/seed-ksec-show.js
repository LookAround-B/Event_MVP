const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ===== KSEC Show 2026 - April 26th Sunday Data =====

const EVENT_DATE = new Date('2026-04-26');

// Clubs from the PDF
const CLUBS = [
  { name: 'SADDLEBROOK', shortCode: 'SADDLEBROOK' },
  { name: 'FSS', shortCode: 'FSS' },
  { name: 'REA', shortCode: 'REA' },
  { name: 'EIRS', shortCode: 'EIRS' },
  { name: 'ZIPPY EQUESTRIAN', shortCode: 'ZIPPY' },
];

// Event Categories from the PDF
const CATEGORIES = [
  { name: '40CM Show Jumping', code: 'SJ1', price: 2000, description: 'Show Jumping 40cm - Class SJ1' },
  { name: '60CM Show Jumping', code: 'SJ2', price: 2500, description: 'Show Jumping 60cm - Class SJ2' },
  { name: '80CM Show Jumping', code: 'SJ3', price: 3000, description: 'Show Jumping 80cm - Class SJ3' },
  { name: '100CM Show Jumping', code: 'SJ4', price: 3500, description: 'Show Jumping 100cm - Class SJ4' },
  { name: '110CM Show Jumping', code: 'SJ5', price: 4000, description: 'Show Jumping 110cm - Class SJ5' },
  { name: '120CM Show Jumping', code: 'SJ6', price: 4500, description: 'Show Jumping 120cm - Class SJ6' },
  { name: 'Introductory Dressage Test', code: 'D3', price: 2000, description: 'Introductory Dressage Test - Class D3' },
  { name: 'Preliminary Dressage Test', code: 'D4', price: 2500, description: 'Preliminary Dressage Test - Class D4' },
  { name: 'Pre-Novice Dressage Test', code: 'D5', price: 3000, description: 'Pre-Novice Dressage Test - Class D5' },
  { name: 'Novice Dressage Test', code: 'D6', price: 3500, description: 'Novice Dressage Test - Class D6' },
];

// All entries from the PDF organized by category
const ENTRIES = {
  'SJ1': [
    { time: '06:15', srNo: 1, rider: 'MAHESH', horse: 'DEEMED TO FIRE', club: 'SADDLEBROOK' },
    { time: '06:17', srNo: 2, rider: 'JEREMY SAM ASHISH', horse: 'CHIEF OF COMMAND', club: 'FSS' },
    { time: '06:19', srNo: 3, rider: 'AARUSH HONAVAR', horse: 'ACASTER', club: 'REA' },
    { time: '06:21', srNo: 4, rider: 'HARDIK HURKAT', horse: 'WAR SOLDIER', club: 'REA' },
    { time: '06:23', srNo: 5, rider: 'JAYANTH', horse: 'DEEMED TO FIRE', club: 'SADDLEBROOK' },
    { time: '06:25', srNo: 6, rider: 'SHIVEN GHOSH', horse: 'ACASTER', club: 'REA' },
    { time: '06:27', srNo: 7, rider: 'ASHISH', horse: 'DEEMED TO FIRE', club: 'SADDLEBROOK' },
  ],
  'D3': [
    { time: '06:30', srNo: 1, rider: 'BHAVYA SHREE', horse: 'BLACK HAWK', club: 'ZIPPY' },
    { time: '06:35', srNo: 2, rider: 'JEREMY SAM ASHISH', horse: 'SULTAN', club: 'FSS' },
    { time: '06:40', srNo: 3, rider: 'ARAVINDH A V', horse: 'HERCULES', club: 'ZIPPY' },
    { time: '06:45', srNo: 4, rider: 'JAYANTH', horse: 'BLACK HAWK', club: 'SADDLEBROOK' },
    { time: '06:50', srNo: 5, rider: 'BISHAL', horse: 'KHUMBA', club: 'EIRS' },
    { time: '06:55', srNo: 6, rider: 'RAYNA', horse: 'BUCE', club: 'EIRS' },
    { time: '07:00', srNo: 7, rider: 'MANIL RAO', horse: 'SULTAN', club: 'FSS' },
    { time: '07:05', srNo: 8, rider: 'MOHAMMED AHYAN', horse: 'BLACK HAWK', club: 'SADDLEBROOK' },
  ],
  'D4': [
    { time: '07:10', srNo: 1, rider: 'G SHUSHRITHA', horse: 'LAVENDEL', club: 'EIRS' },
    { time: '07:15', srNo: 2, rider: 'KRIPA', horse: 'IMAGINE', club: 'EIRS' },
    { time: '07:20', srNo: 3, rider: 'TANUSH', horse: 'LEONA', club: 'EIRS' },
    { time: '07:25', srNo: 4, rider: 'SAMARTH NAYAK', horse: 'ULTIMATE WARRIOR', club: 'REA' },
    { time: '07:30', srNo: 5, rider: 'MOKSH PATEL', horse: 'KNOTTY DANCER', club: 'EIRS' },
    { time: '07:35', srNo: 6, rider: 'ZOYA', horse: 'PROMETHEUS', club: 'EIRS' },
  ],
  'D5': [
    { time: '07:40', srNo: 1, rider: 'NIKSHITA', horse: 'ELLIOT', club: 'EIRS' },
    { time: '07:45', srNo: 2, rider: 'TANUSH', horse: 'LEONA', club: 'EIRS' },
  ],
  'D6': [
    { time: '07:50', srNo: 1, rider: 'KRIPA', horse: 'CHRISTY', club: 'EIRS' },
    { time: '07:55', srNo: 2, rider: 'HEM KILARU', horse: 'ABRA', club: 'EIRS' },
    { time: '08:00', srNo: 3, rider: 'KIARA', horse: 'RIO', club: 'EIRS' },
    { time: '08:05', srNo: 4, rider: 'MANYA', horse: 'TINA', club: 'EIRS' },
    { time: '08:10', srNo: 5, rider: 'BHARGAV', horse: 'VADIM', club: 'EIRS' },
    { time: '08:15', srNo: 6, rider: 'ARYA CHANNAGIRI', horse: 'CLOUD 9', club: 'FSS' },
  ],
  'SJ2': [
    { time: '08:05', srNo: 1, rider: 'JEREMY SAM ASHISH', horse: 'DASHING GREY', club: 'FSS' },
    { time: null, srNo: 2, rider: 'ARYA CHANNAGIRI', horse: 'BLACK BEAUTY', club: 'FSS' },
    { time: null, srNo: 3, rider: 'MOKSH PATEL', horse: 'TRANSFORMER', club: 'EIRS' },
    { time: null, srNo: 4, rider: 'SUHANI', horse: 'PAT', club: 'EIRS' },
    { time: null, srNo: 5, rider: 'ANANYA AJAY', horse: 'HERCULES', club: 'ZIPPY' },
    { time: null, srNo: 6, rider: 'MANIL RAO', horse: 'CHIEF OF COMMAND', club: 'FSS' },
    { time: null, srNo: 7, rider: 'NITYA S', horse: 'ACASTER', club: 'REA' },
    { time: null, srNo: 8, rider: 'HARDIK HURKAT', horse: 'WAR SOLDIER', club: 'REA' },
    { time: null, srNo: 9, rider: 'MAHESH', horse: 'TWILIGHT FRAME', club: 'SADDLEBROOK' },
    { time: null, srNo: 10, rider: 'AKSHARA', horse: 'STARTINA', club: 'EIRS' },
    { time: null, srNo: 11, rider: 'KRIPA', horse: 'IMAGINE', club: 'EIRS' },
    { time: null, srNo: 12, rider: 'TANUSH', horse: 'LEGEND', club: 'EIRS' },
    { time: null, srNo: 13, rider: 'JEREMY SAM ASHISH', horse: 'RING TONE', club: 'FSS' },
    { time: null, srNo: 14, rider: 'JOSEFINE', horse: 'SPIRIT', club: 'EIRS' },
    { time: null, srNo: 15, rider: 'RAYNA', horse: 'PAT', club: 'EIRS' },
    { time: null, srNo: 16, rider: 'DHANVI CHERUVU', horse: 'BLACK BEAUTY', club: 'FSS' },
    { time: null, srNo: 17, rider: 'JEREMY SAM ASHISH', horse: 'CHIEF OF COMMAND', club: 'FSS' },
    { time: null, srNo: 18, rider: 'MOHAMMED AHYAN', horse: 'TWILIGHT FRAME', club: 'SADDLEBROOK' },
    { time: null, srNo: 19, rider: 'NITYA S', horse: 'ULTIMATE WARRIOR', club: 'REA' },
    { time: null, srNo: 20, rider: 'MOKSH PATEL', horse: 'CONRAD', club: 'EIRS' },
  ],
  'SJ3': [
    { time: '09:15', srNo: 1, rider: 'MOKSH PATEL', horse: 'PLUTO', club: 'EIRS' },
    { time: null, srNo: 2, rider: 'NIKOLAY', horse: 'CLAUDIA', club: 'EIRS' },
    { time: null, srNo: 3, rider: 'TANUSH', horse: 'LEGEND', club: 'EIRS' },
    { time: null, srNo: 4, rider: 'BHARGAV', horse: 'GUCCI', club: 'EIRS' },
    { time: null, srNo: 5, rider: 'SAMARTH NAYAK', horse: 'ALIGHTING', club: 'REA' },
    { time: null, srNo: 6, rider: 'MOKSH PATEL', horse: 'HAMMER', club: 'EIRS' },
    { time: null, srNo: 7, rider: 'MANIL RAO', horse: 'RING TONE', club: 'FSS' },
    { time: null, srNo: 8, rider: 'DHANVI CHERUVU', horse: 'BLACK BIRD', club: 'FSS' },
    { time: null, srNo: 9, rider: 'ARYA CHANNAGIRI', horse: 'CLOUD 9', club: 'FSS' },
    { time: null, srNo: 10, rider: 'MANIL RAO', horse: 'DASHING GREY', club: 'FSS' },
    { time: null, srNo: 11, rider: 'MOKSH PATEL', horse: 'APPHIRA', club: 'EIRS' },
    { time: null, srNo: 12, rider: 'MAHESH', horse: 'TWILIGHT FRAME', club: 'SADDLEBROOK' },
    { time: null, srNo: 13, rider: 'AKSHARA', horse: 'STARTINA', club: 'EIRS' },
    { time: null, srNo: 14, rider: 'KRIPA', horse: 'IMAGINE', club: 'EIRS' },
    { time: null, srNo: 15, rider: 'ZOYA', horse: 'PROMETHEUS', club: 'EIRS' },
    { time: null, srNo: 16, rider: 'RISHAAN', horse: 'HERO', club: 'EIRS' },
    { time: null, srNo: 17, rider: 'MOKSH PATEL', horse: 'BELLA', club: 'EIRS' },
    { time: null, srNo: 18, rider: 'SHUSHRUTHA', horse: 'FELLOTI', club: 'EIRS' },
    { time: null, srNo: 19, rider: 'MANYA', horse: 'BARNABY', club: 'EIRS' },
    { time: null, srNo: 20, rider: 'SAMARTH NAYAK', horse: 'NIGHT HUNT', club: 'REA' },
    { time: null, srNo: 21, rider: 'DHANVI CHERUVU', horse: 'BHIMA', club: 'FSS' },
    { time: null, srNo: 22, rider: 'MOKSH PATEL', horse: 'BONAFE', club: 'EIRS' },
    { time: null, srNo: 23, rider: 'JEREMY SAM ASHISH', horse: 'RING TONE', club: 'FSS' },
    { time: null, srNo: 24, rider: 'HEM KILARU', horse: 'DREAM BOY', club: 'EIRS' },
    { time: null, srNo: 25, rider: 'MOHAMMED SHYAM', horse: 'HERCULES', club: 'SADDLEBROOK' },
    { time: null, srNo: 26, rider: 'MOKSH PATEL', horse: 'DAKAR', club: 'EIRS' },
  ],
  'SJ4': [
    { time: '16:45', srNo: 1, rider: 'NIKOLAY', horse: 'CATHERINA', club: 'EIRS' },
    { time: null, srNo: 2, rider: 'ANAGHA G', horse: 'ROXETTE', club: 'ZIPPY' },
    { time: null, srNo: 3, rider: 'ARNAV NAVARATNA', horse: 'VEDETTE', club: 'ZIPPY' },
    { time: null, srNo: 4, rider: 'ARYA CHANNAGIRI', horse: 'BLACK BIRD', club: 'FSS' },
    { time: null, srNo: 5, rider: 'YASHAS TUPAKULA', horse: 'BHIMA', club: 'FSS' },
    { time: null, srNo: 6, rider: 'NIKSHITA', horse: 'ELLIOT', club: 'EIRS' },
    { time: null, srNo: 7, rider: 'MANYA', horse: 'BARNABY', club: 'EIRS' },
    { time: null, srNo: 8, rider: 'RISHAB', horse: 'HERO', club: 'EIRS' },
    { time: null, srNo: 9, rider: 'G SHUSHRITHA', horse: 'FELLOTI', club: 'EIRS' },
    { time: null, srNo: 10, rider: 'SAMARTH NAYAK', horse: 'NIGHT HUNT', club: 'REA' },
    { time: null, srNo: 11, rider: 'MOKSH PATEL', horse: 'APPHIRA', club: 'EIRS' },
    { time: null, srNo: 12, rider: 'NIKOLAY', horse: 'COCOBAR', club: 'EIRS' },
    { time: null, srNo: 13, rider: 'YASHAS TUPAKULA', horse: 'FREEZING RAIN', club: 'FSS' },
    { time: null, srNo: 14, rider: 'HEM KILARU', horse: 'DREAM BOY', club: 'EIRS' },
    { time: null, srNo: 15, rider: 'SIDDARTH', horse: 'CADILLAC', club: 'EIRS' },
  ],
  'SJ5': [
    { time: '18:00', srNo: 1, rider: 'NIKOLAY', horse: 'CARAIDA', club: 'EIRS' },
  ],
  'SJ6': [
    { time: '18:02', srNo: 1, rider: 'HIBA GABREIL', horse: 'ASCOT DE JAF', club: 'FSS' },
    { time: null, srNo: 2, rider: 'NIKOLAY', horse: 'CAMPARI', club: 'EIRS' },
    { time: null, srNo: 3, rider: 'HIBA GABREIL', horse: 'FREEZING RAIN', club: 'FSS' },
  ],
};

// Helper to generate random phone
function randPhone() {
  return `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`;
}

// Normalize name for email
function normalizeForEmail(name) {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
}

async function main() {
  console.log('🏇 Seeding KSEC Show 2026 - April 26th Sunday data...\n');

  // ===== ROLES =====
  let riderRole = await prisma.role.findUnique({ where: { name: 'rider' } });
  if (!riderRole) {
    riderRole = await prisma.role.create({
      data: { name: 'rider', description: 'Rider role', isActive: true },
    });
  }

  let clubRole = await prisma.role.findUnique({ where: { name: 'club' } });
  if (!clubRole) {
    clubRole = await prisma.role.create({
      data: { name: 'club', description: 'Club role', isActive: true },
    });
  }

  // ===== CLUBS =====
  const clubPassword = await bcrypt.hash('club123', 12);
  const clubMap = {};

  for (const club of CLUBS) {
    const clubEmail = `contact@${club.shortCode.toLowerCase()}.club`;

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
          roles: { connect: [{ id: clubRole.id }] },
        },
      });
    }

    let existingClub = await prisma.club.findUnique({ where: { shortCode: club.shortCode } });
    if (!existingClub) {
      existingClub = await prisma.club.create({
        data: {
          name: club.name,
          shortCode: club.shortCode,
          email: clubEmail,
          contactNumber: randPhone(),
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          isActive: true,
          primaryContact: { connect: { id: clubUser.id } },
        },
      });
    }
    clubMap[club.shortCode] = existingClub;
    console.log(`  ✓ Club: ${club.name}`);
  }
  console.log(`\n✓ Created/verified ${CLUBS.length} clubs\n`);

  // ===== EVENT CATEGORIES =====
  const categoryMap = {};

  for (const cat of CATEGORIES) {
    const cgst = Math.round(cat.price * 0.09);
    const sgst = Math.round(cat.price * 0.09);

    let existing = await prisma.eventCategory.findFirst({ where: { name: cat.name } });
    if (!existing) {
      existing = await prisma.eventCategory.create({
        data: {
          name: cat.name,
          price: cat.price,
          cgst,
          sgst,
          igst: 0,
          description: cat.description,
          isActive: true,
        },
      });
    }
    categoryMap[cat.code] = existing;
    console.log(`  ✓ Category: ${cat.name} (${cat.code})`);
  }
  console.log(`\n✓ Created/verified ${CATEGORIES.length} categories\n`);

  // ===== VENUE =====
  let venue = await prisma.venue.findFirst({ where: { name: 'EIRS Arena' } });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: 'EIRS Arena',
        address: 'Embassy International Riding School, Bangalore',
        isDefault: false,
      },
    });
  }
  console.log(`✓ Venue: ${venue.name}\n`);

  // ===== EVENT =====
  let event = await prisma.event.findFirst({
    where: { name: 'KSEC Show 2026 - 26th April' },
  });

  const categoryIds = Object.values(categoryMap).map(c => ({ id: c.id }));

  if (!event) {
    event = await prisma.event.create({
      data: {
        eventType: 'KSEC',
        name: 'KSEC Show 2026 - 26th April',
        description: 'Karnataka State Equestrian Competition 2026 / EIRS Show - Sunday 26th April featuring Show Jumping and Dressage classes',
        startDate: EVENT_DATE,
        endDate: EVENT_DATE,
        startTime: '05:45 AM',
        endTime: '07:00 PM',
        venueName: venue.name,
        venueId: venue.id,
        isPublished: true,
        categories: { connect: categoryIds },
      },
    });
    console.log(`✓ Event created: ${event.name}\n`);
  } else {
    console.log(`ℹ Event already exists: ${event.name}\n`);
  }

  // ===== EXTRACT UNIQUE RIDERS AND HORSES =====
  const uniqueRiders = new Map(); // rider name -> club shortcode
  const uniqueHorses = new Map(); // horse name -> club shortcode
  const riderHorseLinks = []; // [{rider, horse, club, category, srNo}]

  for (const [catCode, entries] of Object.entries(ENTRIES)) {
    for (const entry of entries) {
      const riderKey = entry.rider.toUpperCase();
      const horseKey = entry.horse.toUpperCase();

      if (!uniqueRiders.has(riderKey)) {
        uniqueRiders.set(riderKey, entry.club);
      }
      if (!uniqueHorses.has(horseKey)) {
        uniqueHorses.set(horseKey, entry.club);
      }

      riderHorseLinks.push({
        rider: riderKey,
        horse: horseKey,
        club: entry.club,
        category: catCode,
        srNo: entry.srNo,
        time: entry.time,
      });
    }
  }

  console.log(`Found ${uniqueRiders.size} unique riders and ${uniqueHorses.size} unique horses\n`);

  // ===== CREATE RIDERS =====
  const riderPassword = await bcrypt.hash('rider123', 12);
  const riderMap = {};

  for (const [riderName, clubCode] of uniqueRiders) {
    const nameParts = riderName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Rider';
    const email = `${normalizeForEmail(riderName)}@ksec.rider`;

    let riderUser = await prisma.user.findUnique({ where: { email } });
    if (!riderUser) {
      riderUser = await prisma.user.create({
        data: {
          email,
          password: riderPassword,
          firstName,
          lastName,
          phone: randPhone(),
          isActive: true,
          isApproved: true,
          profileComplete: true,
          roles: { connect: [{ id: riderRole.id }] },
        },
      });
    }

    let rider = await prisma.rider.findUnique({ where: { email } });
    if (!rider) {
      rider = await prisma.rider.create({
        data: {
          firstName,
          lastName,
          email,
          mobile: randPhone(),
          clubId: clubMap[clubCode]?.id,
          userId: riderUser.id,
          isActive: true,
        },
      });
    }
    riderMap[riderName] = rider;
  }
  console.log(`✓ Created/verified ${uniqueRiders.size} riders\n`);

  // ===== CREATE HORSES =====
  const horseMap = {};
  const horseGenders = ['Stallion', 'Mare', 'Gelding'];

  for (const [horseName, clubCode] of uniqueHorses) {
    let horse = await prisma.horse.findFirst({ where: { name: horseName } });
    if (!horse) {
      horse = await prisma.horse.create({
        data: {
          name: horseName,
          gender: horseGenders[Math.floor(Math.random() * horseGenders.length)],
          clubId: clubMap[clubCode]?.id,
          yearOfBirth: 2015 + Math.floor(Math.random() * 8),
          isActive: true,
        },
      });
    }
    horseMap[horseName] = horse;
  }
  console.log(`✓ Created/verified ${uniqueHorses.size} horses\n`);

  // ===== CREATE REGISTRATIONS =====
  let registrationCount = 0;
  const processedCombos = new Set();

  for (const link of riderHorseLinks) {
    const rider = riderMap[link.rider];
    const horse = horseMap[link.horse];
    const club = clubMap[link.club];
    const category = categoryMap[link.category];

    if (!rider || !horse || !category) {
      console.log(`  ⚠ Skipping: Missing data for ${link.rider} / ${link.horse} / ${link.category}`);
      continue;
    }

    // Check unique constraint - eventId + riderId + horseId
    const comboKey = `${event.id}-${rider.id}-${horse.id}`;
    if (processedCombos.has(comboKey)) {
      // Same rider+horse already registered in a different category - skip (DB constraint)
      continue;
    }

    const existing = await prisma.registration.findFirst({
      where: {
        eventId: event.id,
        riderId: rider.id,
        horseId: horse.id,
      },
    });

    if (!existing) {
      const gstAmount = (category.cgst || 0) + (category.sgst || 0);
      const totalAmount = category.price + gstAmount;

      await prisma.registration.create({
        data: {
          eventId: event.id,
          riderId: rider.id,
          horseId: horse.id,
          clubId: club?.id,
          categoryId: category.id,
          startNumber: link.srNo,
          eventAmount: category.price,
          stableAmount: 0,
          gstAmount,
          totalAmount,
          paymentStatus: 'PAID',
          approvalStatus: 'APPROVED',
          isScheduled: true,
        },
      });
      registrationCount++;
      processedCombos.add(comboKey);
    }
  }

  console.log(`✓ Created ${registrationCount} registrations\n`);

  // ===== SUMMARY =====
  const totalEntries = Object.values(ENTRIES).reduce((sum, arr) => sum + arr.length, 0);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    KSEC SHOW 2026 - SEEDING SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n📅 Event: ${event.name}`);
  console.log(`   Date: Sunday, 26th April 2026`);
  console.log(`   Venue: ${venue.name}\n`);

  console.log('📊 Statistics:');
  console.log(`   • Clubs: ${CLUBS.length}`);
  console.log(`   • Categories: ${CATEGORIES.length}`);
  console.log(`   • Unique Riders: ${uniqueRiders.size}`);
  console.log(`   • Unique Horses: ${uniqueHorses.size}`);
  console.log(`   • Total Entries: ${totalEntries}`);
  console.log(`   • Registrations Created: ${registrationCount}\n`);

  console.log('🏆 Categories & Entry Count:');
  for (const [code, entries] of Object.entries(ENTRIES)) {
    const cat = CATEGORIES.find(c => c.code === code);
    console.log(`   • ${cat?.name || code}: ${entries.length} entries`);
  }

  console.log('\n🏠 Clubs:');
  for (const club of CLUBS) {
    const entries = riderHorseLinks.filter(l => l.club === club.shortCode).length;
    console.log(`   • ${club.name}: ${entries} entries`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ Seeding completed successfully!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
