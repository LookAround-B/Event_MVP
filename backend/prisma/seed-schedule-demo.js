/**
 * seed-schedule-demo.js
 *
 * Creates:
 *   • 1 demo event  "EPL Show — Start List Demo 2026"
 *   • 3 categories  (Show Jumping 80cm / 100cm / Dressage)
 *   • Per category  105 entries spread across:
 *       - 15 riders × 3 horses  =  45 entries  (gap ≈ 35 slots)
 *       - 15 riders × 2 horses  =  30 entries  (gap ≈ 52 slots)
 *       - 30 riders × 1 horse   =  30 entries
 *   • Applies the start-position spacing algorithm and saves results
 *
 * Run: node prisma/seed-schedule-demo.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const FIRST_NAMES = [
  'Arjun','Priya','Vikram','Ananya','Rahul','Kavya','Rohit','Neha','Karan','Shruti',
  'Aditya','Pooja','Manish','Divya','Suresh','Meera','Deepak','Isha','Gaurav','Tanvi',
  'Vivek','Ritu','Nikhil','Swati','Pranav','Nisha','Harsh','Sakshi','Ankur','Aditi',
];
const LAST_NAMES = [
  'Kumar','Singh','Patel','Sharma','Verma','Gupta','Reddy','Nair','Rao','Joshi',
  'Mehta','Chauhan','Das','Iyer','Malhotra','Bhat','Pillai','Saxena','Kapoor','Thakur',
];
const HORSE_NAMES = [
  'Thunder','Lady','Storm','Blaze','Shadow','Spirit','Apollo','Midnight','Pegasus','Arrow',
  'Comet','Mustang','Phoenix','Titan','Zephyr','Eclipse','Maverick','Duchess','Gallant','Whisper',
  'Bravado','Cascade','Dazzle','Ember','Falcon','Glory','Haven','Ivory','Jetstream','Karma',
  'Legend','Mirage','Noble','Orbit','Presto','Quest','Rebel','Saber','Tempo','Valor',
];
const BREEDS  = ['Thoroughbred','Arabian','Marwari','Hanoverian','Warmblood','Quarter Horse','Friesian'];
const COLORS  = ['Bay','Chestnut','Grey','Black','Palomino','Roan'];
const GENDERS = ['Stallion','Mare','Gelding'];
const PAY_STATUSES = ['UNPAID','PAID','PARTIAL'];

// ─── scheduling algorithm (mirrors src/lib/scheduling.ts) ────────────────────
function assignStartPositions(entries) {
  const N = entries.length;
  if (N === 0) return [];

  const riderMap = new Map();
  for (const e of entries) {
    const g = riderMap.get(e.riderId) ?? [];
    g.push(e);
    riderMap.set(e.riderId, g);
  }

  const riders = [...riderMap.values()].sort((a, b) => b.length - a.length);
  const schedule = new Array(N).fill(null);

  for (const riderEntries of riders) {
    const k   = riderEntries.length;
    const gap = Math.max(1, Math.floor(N / k));

    let bestOffset = 0, bestFree = -1;
    for (let off = 0; off < gap; off++) {
      let free = 0;
      for (let i = 0; i < k; i++) if (schedule[(off + i * gap) % N] === null) free++;
      if (free > bestFree) { bestFree = free; bestOffset = off; }
    }

    for (let i = 0; i < k; i++) {
      let slot = (bestOffset + i * gap) % N;
      while (schedule[slot] !== null) slot = (slot + 1) % N;
      schedule[slot] = riderEntries[i].id;
    }
  }

  return schedule.map((id, i) => ({ id, startPosition: i + 1 }));
}

// ─── constants ──────────────────────────────────────────────────────────────
const DEMO_EVENT_NAME     = 'EPL Show \u2014 Start List Demo 2026';
const DEMO_CATEGORY_NAMES = ['Show Jumping 80cm', 'Show Jumping 100cm', 'Dressage'];

// Each group = 60 riders using a non-overlapping offset so same-event
// unique([eventId, riderId, horseId]) constraint is never hit.
// Group 0 → riders demo.0.0 … demo.0.59   (for SJ 80cm)
// Group 1 → riders demo.1.0 … demo.1.59   (for SJ 100cm)
// Group 2 → riders demo.2.0 … demo.2.59   (for Dressage)

// Per group entry distribution:
//   r 0-14  (15 riders) × 3 horses = 45 entries  heavy
//   r 15-29 (15 riders) × 2 horses = 30 entries  medium
//   r 30-59 (30 riders) × 1 horse  = 30 entries  light
//   total                             105 entries

function numHorsesForRiderIndex(r) {
  if (r < 15) return 3;
  if (r < 30) return 2;
  return 1;
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱  Seeding schedule demo …');

  // 1. Categories ──────────────────────────────────────────────────────────
  const CATEGORY_PRICES = { 'Show Jumping 80cm': 4500, 'Show Jumping 100cm': 5500, 'Dressage': 6000 };
  const demoCategories = [];
  for (const name of DEMO_CATEGORY_NAMES) {
    let cat = await prisma.eventCategory.findFirst({ where: { name } });
    if (!cat) {
      const price = CATEGORY_PRICES[name];
      cat = await prisma.eventCategory.create({
        data: { name, price, cgst: Math.round(price * 0.09), sgst: Math.round(price * 0.09), igst: 0, isActive: true },
      });
      console.log(`  ✓ Created category: ${name}`);
    }
    demoCategories.push(cat);
  }

  // 2. Event ───────────────────────────────────────────────────────────────
  let demoEvent = await prisma.event.findFirst({ where: { name: DEMO_EVENT_NAME } });
  if (!demoEvent) {
    demoEvent = await prisma.event.create({
      data: {
        eventType: 'EPL',
        name: DEMO_EVENT_NAME,
        description: 'Demo event — 105 entries per category with rider entry-spacing rule applied.',
        startDate: new Date('2026-09-26'),
        endDate:   new Date('2026-09-27'),
        startTime: '07:00 AM',
        endTime:   '05:00 PM',
        venueName: 'Premier Equestrian Complex',
        isPublished: true,
        categories: { connect: demoCategories.map(c => ({ id: c.id })) },
      },
    });
    console.log(`  ✓ Created event: ${DEMO_EVENT_NAME}`);
  } else {
    // Ensure categories are linked even if event already existed
    await prisma.event.update({
      where: { id: demoEvent.id },
      data: { categories: { connect: demoCategories.map(c => ({ id: c.id })) } },
    });
    console.log(`  ℹ  Event already exists — categories re-linked`);
  }

  // 3. Riders, horses, registrations — one group per category ──────────────
  for (let g = 0; g < demoCategories.length; g++) {
    const category = demoCategories[g];
    console.log(`\n  ── Category "${category.name}" (group ${g}) ──`);

    const registrationEntries = []; // { id, riderId } for scheduler

    for (let r = 0; r < 60; r++) {
      const email = `demo.${g}.${r}@schedule.test`;

      // Rider ──────────────────────────────────────────────────────────────
      let rider = await prisma.rider.findUnique({ where: { email } });
      if (!rider) {
        const nameIdx = (g * 60 + r);
        rider = await prisma.rider.create({
          data: {
            firstName: FIRST_NAMES[nameIdx % FIRST_NAMES.length],
            lastName:  LAST_NAMES[Math.floor(nameIdx / FIRST_NAMES.length) % LAST_NAMES.length],
            email,
            isActive: true,
          },
        });
      }

      // Horses ─────────────────────────────────────────────────────────────
      const nHorses = numHorsesForRiderIndex(r);
      for (let h = 0; h < nHorses; h++) {
        const passport = `DEMO-${g}-${String(r).padStart(3,'0')}-${h}`;

        let horse = await prisma.horse.findFirst({ where: { passportNumber: passport } });
        if (!horse) {
          const nameIdx = g * 105 + r * 3 + h;
          horse = await prisma.horse.create({
            data: {
              name:           `${HORSE_NAMES[nameIdx % HORSE_NAMES.length]} ${nameIdx + 1}`,
              breed:          pick(BREEDS),
              color:          pick(COLORS),
              gender:         pick(GENDERS),
              passportNumber: passport,
              yearOfBirth:    randInt(2012, 2020),
              riderId:        rider.id,
              isActive:       true,
            },
          });
        }

        // Registration ───────────────────────────────────────────────────
        let reg = await prisma.registration.findFirst({
          where: { eventId: demoEvent.id, riderId: rider.id, horseId: horse.id },
        });
        if (!reg) {
          const gst = (category.cgst || 0) + (category.sgst || 0);
          reg = await prisma.registration.create({
            data: {
              eventId:     demoEvent.id,
              riderId:     rider.id,
              horseId:     horse.id,
              categoryId:  category.id,
              eventAmount: category.price,
              stableAmount: 0,
              gstAmount:   gst,
              totalAmount: category.price + gst,
              paymentStatus: pick(PAY_STATUSES),
            },
          });
        }

        registrationEntries.push({ id: reg.id, riderId: rider.id });
      }
    }

    console.log(`  ✓ ${registrationEntries.length} registrations ready`);

    // 4. Apply spacing algorithm ──────────────────────────────────────────
    const positioned = assignStartPositions(registrationEntries);
    await prisma.$transaction(
      positioned.map(({ id, startPosition }) =>
        prisma.registration.update({
          where: { id },
          data:  { startPosition, isScheduled: true },
        })
      )
    );

    // 5. Quick sanity: verify no two consecutive slots have the same rider ─
    const scheduled = await prisma.registration.findMany({
      where:   { eventId: demoEvent.id, categoryId: category.id },
      select:  { riderId: true, startPosition: true },
      orderBy: { startPosition: 'asc' },
    });

    let consecutiveViolations = 0;
    for (let i = 1; i < scheduled.length; i++) {
      if (scheduled[i].riderId === scheduled[i - 1].riderId) consecutiveViolations++;
    }
    console.log(`  ✓ Schedule applied — consecutive-rider violations: ${consecutiveViolations}`);

    // Show distribution summary
    const riderCounts = {};
    for (const { riderId } of registrationEntries) {
      riderCounts[riderId] = (riderCounts[riderId] || 0) + 1;
    }
    const dist = { 1: 0, 2: 0, 3: 0 };
    for (const c of Object.values(riderCounts)) dist[c] = (dist[c] || 0) + 1;
    console.log(`     Riders with 1 entry: ${dist[1]}   2 entries: ${dist[2]}   3 entries: ${dist[3]}`);
  }

  console.log('\n✅  Done!');
  console.log(`\n📋  Event: "${DEMO_EVENT_NAME}"`);
  console.log('    Navigate to this event in the dashboard → select a category → view/download start list.');
}

main()
  .catch(e => { console.error('❌  Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
