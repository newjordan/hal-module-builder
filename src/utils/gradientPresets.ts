import { GradientPreset } from './gradient';

export interface GradientPresetCategory {
  name: string;
  description: string;
  presets: GradientPreset[];
}

// Nature-inspired gradients
const naturePresets: GradientPreset[] = [
  {
    name: 'Ocean Breeze',
    type: 'linear',
    colors: ['#667eea', '#764ba2'],
    stops: [0, 1],
    angle: 135,
    description: 'Calming ocean waves',
    tags: ['blue', 'purple', 'water', 'calm'],
  },
  {
    name: 'Forest Dawn',
    type: 'linear',
    colors: ['#11998e', '#38ef7d'],
    stops: [0, 1],
    angle: 45,
    description: 'Morning light through trees',
    tags: ['green', 'nature', 'fresh', 'morning'],
  },
  {
    name: 'Sunset Glow',
    type: 'linear',
    colors: ['#ff9a9e', '#fecfef', '#fecfef'],
    stops: [0, 0.5, 1],
    angle: 90,
    description: 'Warm evening sunset',
    tags: ['pink', 'warm', 'sunset', 'romantic'],
  },
  {
    name: 'Mountain Mist',
    type: 'radial',
    colors: ['#bdc3c7', '#2c3e50'],
    stops: [0, 1],
    centerX: 50,
    centerY: 50,
    description: 'Misty mountain peaks',
    tags: ['gray', 'mysterious', 'mountains', 'fog'],
  },
];

// Technology and modern gradients
const techPresets: GradientPreset[] = [
  {
    name: 'Cyber Neon',
    type: 'linear',
    colors: ['#00d2ff', '#3a7bd5'],
    stops: [0, 1],
    angle: 90,
    description: 'Futuristic cyber aesthetic',
    tags: ['blue', 'neon', 'cyber', 'modern'],
  },
  {
    name: 'Electric Pulse',
    type: 'conic',
    colors: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5'],
    stops: [0, 0.33, 0.66, 1],
    centerX: 50,
    centerY: 50,
    description: 'Electric energy waves',
    tags: ['colorful', 'electric', 'energy', 'bright'],
  },
  {
    name: 'Digital Dreams',
    type: 'linear',
    colors: ['#667eea', '#764ba2', '#667eea'],
    stops: [0, 0.5, 1],
    angle: 315,
    description: 'Dreamy digital interface',
    tags: ['purple', 'blue', 'digital', 'dreamy'],
  },
  {
    name: 'Matrix Code',
    type: 'linear',
    colors: ['#000000', '#00ff41', '#000000'],
    stops: [0, 0.5, 1],
    angle: 180,
    description: 'Classic matrix-style green',
    tags: ['green', 'matrix', 'code', 'retro'],
  },
];

// Vintage and classic gradients
const vintagePresets: GradientPreset[] = [
  {
    name: 'Vintage Sepia',
    type: 'linear',
    colors: ['#ddd6c5', '#c9a876'],
    stops: [0, 1],
    angle: 45,
    description: 'Classic sepia photograph',
    tags: ['brown', 'sepia', 'vintage', 'classic'],
  },
  {
    name: 'Retro Wave',
    type: 'linear',
    colors: ['#ff006e', '#fb5607', '#ffbe0b'],
    stops: [0, 0.5, 1],
    angle: 135,
    description: '80s synthwave aesthetics',
    tags: ['pink', 'orange', 'yellow', 'retro', '80s'],
  },
  {
    name: 'Copper Patina',
    type: 'radial',
    colors: ['#b7472a', '#218a3c'],
    stops: [0, 1],
    centerX: 30,
    centerY: 30,
    description: 'Aged copper oxidation',
    tags: ['copper', 'green', 'aged', 'patina'],
  },
  {
    name: 'Golden Hour',
    type: 'linear',
    colors: ['#ffeaa7', '#fab1a0', '#e17055'],
    stops: [0, 0.5, 1],
    angle: 90,
    description: 'Warm golden hour lighting',
    tags: ['yellow', 'orange', 'warm', 'golden'],
  },
];

// Abstract and artistic gradients
const abstractPresets: GradientPreset[] = [
  {
    name: 'Cosmic Void',
    type: 'radial',
    colors: ['#1a1a2e', '#16213e', '#0f3460'],
    stops: [0, 0.5, 1],
    centerX: 50,
    centerY: 50,
    description: 'Deep space mystery',
    tags: ['dark', 'space', 'cosmic', 'mysterious'],
  },
  {
    name: 'Prismatic',
    type: 'conic',
    colors: [
      '#ff0000',
      '#ff8000',
      '#ffff00',
      '#80ff00',
      '#00ff00',
      '#00ff80',
      '#00ffff',
      '#0080ff',
      '#0000ff',
      '#8000ff',
      '#ff00ff',
      '#ff0080',
    ],
    stops: [
      0, 0.083, 0.166, 0.25, 0.333, 0.416, 0.5, 0.583, 0.666, 0.75, 0.833, 1,
    ],
    centerX: 50,
    centerY: 50,
    description: 'Full spectrum rainbow',
    tags: ['rainbow', 'colorful', 'spectrum', 'bright'],
  },
  {
    name: 'Aurora Borealis',
    type: 'linear',
    colors: ['#667eea', '#764ba2', '#c1c1ff'],
    stops: [0, 0.6, 1],
    angle: 60,
    description: 'Northern lights phenomenon',
    tags: ['purple', 'blue', 'aurora', 'mystical'],
  },
  {
    name: 'Ink Blot',
    type: 'radial',
    colors: ['#000000', '#434343', '#000000'],
    stops: [0, 0.7, 1],
    centerX: 35,
    centerY: 65,
    description: 'Artistic ink spreading',
    tags: ['black', 'gray', 'artistic', 'ink'],
  },
];

// High-energy and vibrant gradients
const vibrantPresets: GradientPreset[] = [
  {
    name: 'Neon Spin',
    type: 'conic',
    colors: ['#ff006e', '#ff7700', '#ffdd00', '#00ff88', '#0099ff', '#8844ff'],
    stops: [0, 0.2, 0.4, 0.6, 0.8, 1],
    centerX: 50,
    centerY: 50,
    description: 'Spinning neon lights',
    tags: ['neon', 'colorful', 'spin', 'energy'],
  },
  {
    name: 'Fire Storm',
    type: 'radial',
    colors: ['#ff9a00', '#ff4500', '#dc143c'],
    stops: [0, 0.6, 1],
    centerX: 50,
    centerY: 80,
    description: 'Intense fire energy',
    tags: ['red', 'orange', 'fire', 'intense'],
  },
  {
    name: 'Electric Blue',
    type: 'linear',
    colors: ['#00d2ff', '#3a7bd5', '#667eea'],
    stops: [0, 0.5, 1],
    angle: 225,
    description: 'High-voltage electric blue',
    tags: ['blue', 'electric', 'vibrant', 'energy'],
  },
];

// All preset categories
export const GRADIENT_PRESET_CATEGORIES: GradientPresetCategory[] = [
  {
    name: 'Nature',
    description: 'Inspired by natural phenomena and landscapes',
    presets: naturePresets,
  },
  {
    name: 'Technology',
    description: 'Modern, futuristic, and digital-inspired gradients',
    presets: techPresets,
  },
  {
    name: 'Vintage',
    description: 'Classic and retro-inspired color combinations',
    presets: vintagePresets,
  },
  {
    name: 'Abstract',
    description: 'Artistic and experimental gradient designs',
    presets: abstractPresets,
  },
  {
    name: 'Vibrant',
    description: 'High-energy and bold color combinations',
    presets: vibrantPresets,
  },
];

// Flatten all presets for easy access
export const ALL_GRADIENT_PRESETS: GradientPreset[] =
  GRADIENT_PRESET_CATEGORIES.flatMap(category => category.presets);

// Utility functions for preset management
export const getPresetByName = (name: string): GradientPreset | undefined => {
  return ALL_GRADIENT_PRESETS.find(preset => preset.name === name);
};

export const getPresetsByCategory = (
  categoryName: string
): GradientPreset[] => {
  const category = GRADIENT_PRESET_CATEGORIES.find(
    cat => cat.name === categoryName
  );
  return category ? category.presets : [];
};

export const getPresetsByTag = (tag: string): GradientPreset[] => {
  return ALL_GRADIENT_PRESETS.filter(preset =>
    preset.tags?.some(presetTag =>
      presetTag.toLowerCase().includes(tag.toLowerCase())
    )
  );
};

export const getRandomPreset = (): GradientPreset => {
  const randomIndex = Math.floor(Math.random() * ALL_GRADIENT_PRESETS.length);
  const preset = ALL_GRADIENT_PRESETS[randomIndex];
  if (!preset) {
    // Fallback to first preset if somehow nothing is found
    return ALL_GRADIENT_PRESETS[0]!;
  }
  return preset;
};

// Export count for validation
export const PRESET_COUNT = ALL_GRADIENT_PRESETS.length;
