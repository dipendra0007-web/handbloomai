export const FLOWER_TYPES = [
  {
    id: 'rose',
    name: 'Rose',
    emoji: '🌹',
    description: 'Classic romantic rose with layered petals',
    colors: ['#ff6b9d', '#ff4757', '#ff8fab', '#c9184a'],
    petalCount: 12,
    stemColor: '#2d6a4f',
    rarity: 'Common',
    category: 'Classic',
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    description: 'Radiant sunflower that follows light',
    colors: ['#ffd60a', '#fcc419', '#ffa500', '#e76f00'],
    petalCount: 18,
    stemColor: '#4a7c59',
    rarity: 'Common',
    category: 'Radiant',
  },
  {
    id: 'lotus',
    name: 'Lotus',
    emoji: '🪷',
    description: 'Sacred lotus emerging from water',
    colors: ['#f4a8cf', '#e07aaa', '#c9184a', '#ffd6e0'],
    petalCount: 16,
    stemColor: '#74c69d',
    rarity: 'Rare',
    category: 'Sacred',
  },
  {
    id: 'tulip',
    name: 'Tulip',
    emoji: '🌷',
    description: 'Elegant tulip with smooth curved petals',
    colors: ['#c77dff', '#9b5de5', '#7b2d8b', '#e0aaff'],
    petalCount: 6,
    stemColor: '#40916c',
    rarity: 'Common',
    category: 'Elegant',
  },
  {
    id: 'cherry_blossom',
    name: 'Cherry Blossom',
    emoji: '🌸',
    description: 'Delicate sakura blossoms of spring',
    colors: ['#ffb3c6', '#ff6b9d', '#ff8fab', '#ffd6e0'],
    petalCount: 5,
    stemColor: '#6d4c41',
    rarity: 'Rare',
    category: 'Seasonal',
  },
  {
    id: 'orchid',
    name: 'Orchid',
    emoji: '🌺',
    description: 'Exotic orchid with intricate patterns',
    colors: ['#9d4edd', '#7b2fff', '#c77dff', '#e0aaff'],
    petalCount: 6,
    stemColor: '#588157',
    rarity: 'Epic',
    category: 'Exotic',
  },
  {
    id: 'daisy',
    name: 'Daisy',
    emoji: '🌼',
    description: 'Cheerful daisy with bright center',
    colors: ['#ffffff', '#f8f9fa', '#e9ecef', '#ffd93d'],
    petalCount: 14,
    stemColor: '#52b788',
    rarity: 'Common',
    category: 'Classic',
  },
  {
    id: 'cosmic_flower',
    name: 'Cosmic Flower',
    emoji: '✨',
    description: 'Legendary flower born from starlight',
    colors: ['#7dd3fc', '#c4b5fd', '#fcd34d', '#86efac'],
    petalCount: 20,
    stemColor: '#1e3a5f',
    rarity: 'Legendary',
    category: 'Cosmic',
  },
];

export const GESTURE_MAP = [
  { gesture: 'Open Palm', action: 'Create / Bloom Flower', icon: '🖐️', color: '#86efac' },
  { gesture: 'Pinch In', action: 'Shrink / Zoom Out', icon: '🤏', color: '#7dd3fc' },
  { gesture: 'Pinch Out', action: 'Grow / Zoom In', icon: '🤌', color: '#86efac' },
  { gesture: 'Peace Sign', action: 'Remove Petals', icon: '✌️', color: '#c4b5fd' },
  { gesture: '5 Fingers', action: 'Add Petals', icon: '🖐️', color: '#f9a8d4' },
  { gesture: 'Thumbs Up', action: 'Save to Gallery', icon: '👍', color: '#fcd34d' },
  { gesture: 'Closed Fist', action: 'Remove Flower', icon: '✊', color: '#fca5a5' },
  { gesture: 'Heart Gesture', action: 'Create Love Flower', icon: '🫶', color: '#ff6b9d' },
  { gesture: 'Star Gesture', action: 'Create Cosmic Flower', icon: '⭐', color: '#fcd34d' },
  { gesture: 'Hand Clap', action: 'Flower Explosion Effect', icon: '👏', color: '#7dd3fc' },
];

export const ACHIEVEMENTS = [
  { id: 1, title: 'First Bloom', description: 'Create your first flower', icon: '🌱', earned: true, xp: 50 },
  { id: 2, title: 'Gesture Master', description: 'Use all 10 gestures', icon: '🖐️', earned: true, xp: 200 },
  { id: 3, title: 'Garden Keeper', description: 'Grow 25 flowers', icon: '🌿', earned: true, xp: 300 },
  { id: 4, title: 'Rainbow Artist', description: 'Create flowers of all colors', icon: '🌈', earned: false, xp: 500 },
  { id: 5, title: 'Cosmic Gardener', description: 'Unlock the Cosmic Flower', icon: '✨', earned: false, xp: 1000 },
  { id: 6, title: 'Social Bloomer', description: 'Share 10 flowers', icon: '📤', earned: false, xp: 250 },
  { id: 7, title: 'Petal Perfectionist', description: 'Create a 20-petal flower', icon: '🌺', earned: true, xp: 400 },
  { id: 8, title: 'Night Gardener', description: 'Create flowers after midnight', icon: '🌙', earned: false, xp: 150 },
];

export const GALLERY_FLOWERS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  type: FLOWER_TYPES[i % FLOWER_TYPES.length].id,
  name: `${FLOWER_TYPES[i % FLOWER_TYPES.length].name} #${i + 1}`,
  color: FLOWER_TYPES[i % FLOWER_TYPES.length].colors[i % 4],
  petals: 6 + (i % 15),
  size: 0.7 + (i % 4) * 0.15,
  rotation: (i * 37) % 360,
  likes: Math.floor(Math.random() * 200) + 12,
  priceBloomCoins: Math.floor(Math.random() * 400) + 50,
  creator: ['Luna', 'Aria', 'Nova', 'Zara', 'Eden'][i % 5],
  createdAt: new Date(Date.now() - i * 86400000 * 3).toLocaleDateString(),
  comments: [
    { author: 'Luna', text: 'Stunning colors! Love the glowing effect.' },
    { author: 'Aria', text: 'This looks so premium, great job.' }
  ]
}));

export const ADMIN_STATS = {
  totalUsers: 12847,
  activeToday: 3241,
  flowersCreated: 98432,
  flowersShared: 24156,
  newUsers: 847,
  revenue: 48920,
};

export const CATEGORIES = [
  { id: 1, name: 'Classic', count: 4, color: '#86efac', icon: '🌸' },
  { id: 2, name: 'Exotic', count: 2, color: '#c4b5fd', icon: '🌺' },
  { id: 3, name: 'Sacred', count: 1, color: '#fcd34d', icon: '🪷' },
  { id: 4, name: 'Cosmic', count: 1, color: '#7dd3fc', icon: '✨' },
  { id: 5, name: 'Seasonal', count: 3, color: '#f9a8d4', icon: '🌸' },
  { id: 6, name: 'Radiant', count: 2, color: '#fdba74', icon: '🌻' },
];

export const PRODUCTS_LIBRARY = [
  { id: 1, name: 'Premium Rose Seeds', category: 'Seeds', price: 9.99, coins: 150, image: '🌱', stock: 120 },
  { id: 2, name: 'Holographic Flower Vase', category: 'Decorations', price: 29.99, coins: 500, image: '🏺', stock: 45 },
  { id: 3, name: 'Golden Bloom Fertilizer', category: 'Plants', price: 14.99, coins: 250, image: '✨', stock: 80 },
  { id: 4, name: 'Orchid Fantasy Pot', category: 'Gifts', price: 19.99, coins: 300, image: '🪴', stock: 65 },
];

export const LEADERBOARD_USERS = [
  { rank: 1, name: 'Luna Star', level: 18, coins: 4850, flowers: 184, avatar: '🌸' },
  { rank: 2, name: 'Aria Bloom', level: 16, coins: 3920, flowers: 152, avatar: '🌺' },
  { rank: 3, name: 'Nova Green', level: 15, coins: 3100, flowers: 120, avatar: '🌻' },
  { rank: 4, name: 'Zara Spark', level: 12, coins: 2450, flowers: 98, avatar: '✨' },
  { rank: 5, name: 'Eden Bud', level: 10, coins: 1890, flowers: 84, avatar: '🌿' },
];

export const REWARD_COUPONS = [
  { code: 'BLOOMSPRING', discount: '20% OFF', description: 'Unlock 20% discount on Seeds store', active: true },
  { code: 'COSMICGIFT', discount: 'Free Vase', description: 'Get a free holographic vase on 300 coins spent', active: true },
  { code: 'GOLDEN50', discount: '50 Coins', description: 'Instant 50 Bloom Coins claimable once', active: true },
];
