// Risk level colors
export const COLORS = {
  low: "#E128FF",
  medium: "#48C8FF",
  high: "#FFED28",
} as const;

// Risk levels
export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// Flushing item image paths
export const DROP_ITEM_SOURCES = [
  "/assets/drop/bonnieblue.png",
  "/assets/drop/money.png",
  "/assets/drop/bomb.png",
  "/assets/drop/tyre.png",
  "/assets/drop/capsule.png",
  "/assets/drop/hulk.png",
  "/assets/drop/red.png",
  "/assets/drop/silversurfer.png",
  "/assets/drop/trump.png",
] as const;

// Asset paths
export const ASSETS = {
  // ── Loading screen ──────────────────────────────────────────────────────────
  LOADING_SCREEN_BG: "/assets/loading-screen/bg.png",

  // ── Core game ───────────────────────────────────────────────────────────────
  LOGO: "/assets/logo/logo.svg",
  LOGO_SVG: "/assets/logo/logo.svg",
  BACKGROUND_IMG: "/assets/loading-screen/background-img.webp",

  // ── Video ───────────────────────────────────────────────────────────────────
  INTRO_VIDEO: "/assets/intro.mp4",

  // ── Character ───────────────────────────────────────────────────────────────
  CHARACTER_VARIANT_1: "/assets/character/variant-1.webp",
  CHARACTER_VARIANT_2: "/assets/character/variant-2.webp",
  CHARACTER_VARIANT_3: "/assets/character/variant-3.webp",
  CHARACTER_VARIANT_4: "/assets/character/variant-4.webp",

  // ── Bonus ───────────────────────────────────────────────────────────────────
  BONUS_PILL_TIME: "/assets/bonus/candy.mp4",
  BONUS_MAKE_IT_RAIN: "/assets/bonus/Granny.mp4",
  BONUS_FLASHBACK: "/assets/bonus/ww2.mp4",
  BONUS_NANSCARE: "/assets/bonus/nanscare.mp4",
} as const;

export const SOUNDS = {
  BACKGROUND_MUSIC: "/sounds/background-music.mp3",
  WIN_SOUND: "/sounds/win-sound.mp3",
  INTRO_SFX: "/sounds/SFX/lost-my-marbles-intro.wav",
} as const;

export const PRELOAD_ASSETS: string[] = [
  // Core game images
  ASSETS.LOGO,
  ASSETS.LOGO_SVG,

  // Flushing items
  ...DROP_ITEM_SOURCES,

  // Loading screen
  ASSETS.LOADING_SCREEN_BG,
  ASSETS.BACKGROUND_IMG,

  // Intro video
  ASSETS.INTRO_VIDEO,

  // Character variants
  ASSETS.CHARACTER_VARIANT_1,
  ASSETS.CHARACTER_VARIANT_2,
  ASSETS.CHARACTER_VARIANT_3,
  ASSETS.CHARACTER_VARIANT_4,

  //Bonus assets
  ASSETS.BONUS_PILL_TIME,
  ASSETS.BONUS_MAKE_IT_RAIN,
  ASSETS.BONUS_FLASHBACK,
  ASSETS.BONUS_NANSCARE,
];

// Game settings
export const GAME_SETTINGS = {
  MIN_BET: 0.5,
  MAX_BET: 100.0,
  INITIAL_BALANCE: 2000.0,
  BET_INCREMENT: 0.5,
  AUTO_GAME_DELAY: 1500,
} as const;

// Animation settings
export const ANIMATION = {} as const;

// Floater (flushing item) settings
export const FLOATER = {} as const;

// UI settings
export const UI = {
  LOGO_WIDTH: 160,
  LOGO_HEIGHT: 80,
  BET_BUTTON_SIZE: 96,
  CONTROL_BUTTON_SIZE: 48,
} as const;

export const MULTIPLIER_RANGES = {
  low: { min: 0.25, max: 50 },
  medium: { min: 0.25, max: 100 },
  high: { min: 0.25, max: 250 },
} as const;

export const BONUS_MODE = {
  // General settings
  WINNER_DISPLAY_DURATION: 5000,
  WINNER_TEXT_SCALE: 1.2,
} as const;
