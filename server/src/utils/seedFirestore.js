/**
 * Seed Firestore with demo data (products + optional categories).
 *
 * Usage:
 *   npm run seed -- --count 50 --categories 8 --clear
 *
 * Notes:
 * - Requires Firebase Admin credentials via `server/src/serviceAccount.json`
 *   (already used by `server/config/firebase.js`).
 * - Images are gaming-related placeholder URLs (no download) via loremflickr.
 */
const { faker } = require('@faker-js/faker');
const { db } = require('../../config/firebase');

const GAME_TITLES = [
  'Counter-Strike 2',
  'Grand Theft Auto V',
  'Red Dead Redemption 2',
  'Cyberpunk 2077',
  'The Witcher 3: Wild Hunt',
  'Elden Ring',
  'Dark Souls III',
  'Sekiro: Shadows Die Twice',
  'Baldur’s Gate 3',
  'Minecraft',
  'Terraria',
  'Stardew Valley',
  'Hades',
  'Hollow Knight',
  'Celeste',
  'DOOM Eternal',
  'Half-Life 2',
  'Portal 2',
  'Left 4 Dead 2',
  'Dota 2',
  'League of Legends',
  'Valorant',
  'Apex Legends',
  'Fortnite',
  'Overwatch 2',
  'Rocket League',
  'FIFA 24',
  'EA SPORTS FC 25',
  'NBA 2K25',
  'Assassin’s Creed Valhalla',
  'Assassin’s Creed Mirage',
  'Far Cry 6',
  'Tom Clancy’s Rainbow Six Siege',
  'Call of Duty: Modern Warfare III',
  'Call of Duty: Warzone',
  'Battlefield 2042',
  'Forza Horizon 5',
  'Need for Speed Unbound',
  'God of War (PC)',
  'Marvel’s Spider-Man Remastered',
  'Hogwarts Legacy',
  'Resident Evil 4 Remake',
  'Resident Evil Village',
  'Final Fantasy VII Remake Intergrade',
  'Final Fantasy XVI',
  'Diablo IV',
  'World of Warcraft',
  'Genshin Impact',
  'The Legend of Zelda: Breath of the Wild',
  'The Legend of Zelda: Tears of the Kingdom'
];

const GAME_IMAGE_TAGS = [
  'gaming',
  'video-game',
  'esports',
  'pc-gaming',
  'game-controller'
];

function parseArgs(argv) {
  const out = {
    count: 50,
    categories: 8,
    clear: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--count') out.count = Number(argv[++i] ?? out.count);
    else if (a === '--categories') out.categories = Number(argv[++i] ?? out.categories);
    else if (a === '--clear') out.clear = true;
  }

  if (!Number.isFinite(out.count) || out.count < 0) out.count = 50;
  if (!Number.isFinite(out.categories) || out.categories < 1) out.categories = 8;

  return out;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function hashToInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function makeImageUrl(title, idx) {
  // Deterministic "gaming" image per title, to avoid looking random/off-topic.
  // loremflickr supports lock= for stable results.
  const lock = (hashToInt(title) + idx + 1) % 10000;
  const tag = GAME_IMAGE_TAGS[lock % GAME_IMAGE_TAGS.length];
  return `https://loremflickr.com/800/600/${tag}?lock=${lock}`;
}

function pickUniqueGameTitles(count) {
  if (count > GAME_TITLES.length) {
    throw new Error(
      `Not enough unique game titles. Requested ${count}, but only ${GAME_TITLES.length} available.`
    );
  }

  const shuffled = [...GAME_TITLES];
  // Fisher–Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function buildCategories(count) {
  const GENRES = [
    'Action',
    'Adventure',
    'RPG',
    'Shooter',
    'Strategy',
    'Simulation',
    'Racing',
    'Sports',
    'Indie',
    'Open World',
    'Horror',
    'Multiplayer'
  ];

  const now = new Date().toISOString();
  const unique = GENRES.slice(0, Math.min(count, GENRES.length)).map((name) => ({
    id: faker.string.uuid(),
    name,
    features: Array.from({ length: 3 }, () => faker.commerce.productAdjective()),
    createdAt: now
  }));

  // If caller wants more than we have in GENRES, fill the rest with reasonable labels.
  while (unique.length < count) {
    const name = `Genre ${unique.length + 1}`;
    unique.push({
      id: faker.string.uuid(),
      name,
      features: Array.from({ length: 3 }, () => faker.commerce.productAdjective()),
      createdAt: now
    });
  }

  return unique;
}

function buildProduct(categories, title, idx) {
  const category = faker.helpers.arrayElement(categories);
  const type = 'game';

  const productName = String(title).trim();
  const slug = faker.helpers.slugify(productName).toLowerCase();
  const stockTotal = faker.number.int({ min: 0, max: 100 });

  const activationCodes =
    type === 'game'
      ? Array.from({ length: Math.max(stockTotal, 0) }, () =>
          faker.string.alphanumeric({ length: 16, casing: 'upper' }).match(/.{1,4}/g).join('-')
        )
      : [];

  return {
    name: productName,
    slug,
    type,
    price: Number(faker.commerce.price({ min: 10, max: 500, dec: 2 })),
    description: faker.helpers.arrayElement([
      'Action-packed gameplay with immersive graphics and thrilling missions.',
      'An epic adventure across a vast open world with rich story and challenges.',
      'Competitive multiplayer experience designed for esports-level intensity.',
      'A cinematic single-player journey with unforgettable characters.'
    ]),
    category: {
      id: category.id,
      name: category.name,
      features: category.features
    },
    imageUrl: makeImageUrl(productName, idx),
    stock: {
      total: stockTotal,
      warehouse: faker.location.city()
    },
    activationCodes,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}

async function clearCollections() {
  const collections = ['products', 'categories'];

  for (const colName of collections) {
    const snap = await db.collection(colName).get();
    if (snap.empty) continue;

    const docRefs = snap.docs.map((d) => d.ref);
    const batches = chunk(docRefs, 450); // keep a safe margin under 500

    for (const group of batches) {
      const batch = db.batch();
      group.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  }
}

async function seed({ count, categories: categoryCount, clear }) {
  console.log(`Seeding Firestore: products=${count}, categories=${categoryCount}, clear=${clear}`);

  if (clear) {
    console.log('Clearing existing collections (products, categories)...');
    await clearCollections();
  }

  const categories = buildCategories(categoryCount);

  // Write categories
  {
    const categoryBatches = chunk(categories, 450);
    for (const group of categoryBatches) {
      const batch = db.batch();
      group.forEach((c) => {
        const ref = db.collection('categories').doc(c.id);
        batch.set(ref, c, { merge: true });
      });
      await batch.commit();
    }
  }

  // Write products
  const titles = pickUniqueGameTitles(count);
  const products = titles.map((title, idx) => buildProduct(categories, title, idx));
  const productBatches = chunk(products, 450);

  for (const group of productBatches) {
    const batch = db.batch();
    group.forEach((p) => {
      // Use slug as doc id to keep uniqueness stable (and avoid accidental duplicates).
      const ref = db.collection('products').doc(p.slug);
      batch.set(ref, p);
    });
    await batch.commit();
  }

  console.log('Done.');
}

seed(parseArgs(process.argv.slice(2)))
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });

