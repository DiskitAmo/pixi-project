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

  // ── Bonus video ───────────────────────────────────────────────────────────────────
  BONUS_PILL_TIME: "/assets/bonus/pill-time.mp4",
  BONUS_MAKE_IT_RAIN: "/assets/bonus/make-it-rain.mp4",
  BONUS_FLASHBACK: "/assets/bonus/operation-flashback.mp4",
  BONUS_NANSCARE: "/assets/bonus/nanscare.mp4",

  // ── Bonus audio
  BONUS_PILL_TIME_AUDIO: "/sounds/SFX/pill-time-intro.wav",
  BONUS_MAKE_IT_RAIN_AUDIO: "/sounds/SFX/make-it-rain-intro.wav",
  BONUS_FLASHBACK_AUDIO: "/sounds/SFX/operation-flashback-intro.wav",
  BONUS_NANSCARE_AUDIO: "/sounds/SFX/nanscar-intro.wav",

  // ── Bonus music
  BONUS_PILL_TIME_MUSIC: "/sounds/Music/Pilltime.mp3",
  BONUS_MAKE_IT_RAIN_MUSIC: "/sounds/Music/Make-it-rain.mp3",
  BONUS_FLASHBACK_MUSIC: "/sounds/Music/Operation-flashback.mp3",
  BONUS_NANSCARE_MUSIC: "/sounds/Music/Nanscar.mp3",
} as const;

export const SOUNDS = {
  BACKGROUND_MUSIC: "/sounds/background-music.mp3",
  WIN_SOUND: "/sounds/win-sound.mp3",
  INTRO_SFX: "/sounds/SFX/lost-my-marbles-intro.wav",
  WALL_HIT_SFX: "/sounds/click.mp3",
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
