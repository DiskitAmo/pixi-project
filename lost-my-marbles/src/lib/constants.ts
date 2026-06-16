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

  // ── Video ───────────────────────────────────────────────────────────────────
  INTRO_VIDEO: "/assets/intro.mp4",
} as const;

export const SOUNDS = {} as const;

// All assets preloaded on the initial loading screen.
// INTRO_VIDEO and BACKGROUND_SOUNDS are intentionally excluded —
// the video is loaded separately in introVideo.js and the casino
// music uses the native Audio API (not PIXI.Assets).
export const PRELOAD_ASSETS: string[] = [
  // ── Core game images ────────────────────────────────────────────────────────
  ASSETS.LOGO,
  ASSETS.LOGO_SVG,

  // ── Flushing items ─────────────────────────────────────────────────────────
  ...DROP_ITEM_SOURCES,

  // ── Loading screen ─────────────────────────────────────────────────────────
  ASSETS.LOADING_SCREEN_BG,
];

// Game settings
export const GAME_SETTINGS = {
  MIN_BET: 0.5,
  MAX_BET: 100.0,
  INITIAL_BALANCE: 2000.0,
  BET_INCREMENT: 0.5,
  BOWL_RADIUS_MULTIPLIER: 0.52,
  BOWL_RADIUS_MULTIPLIER_MOBILE: 0.6,
  // Toilet seat height as percentage of canvas height (0.98 = 98%)
  TOILET_HEIGHT_SCALE: 1,
  MULTIPLIER_UPDATE_INTERVAL: 150,
  AUTO_GAME_DELAY: 1500,
  INITIAL_PARTICLE_COUNT: 15,
  FINAL_PARTICLE_COUNT: 30,
} as const;

// Animation settings
export const ANIMATION = {
  FADE_OUT_SPEED: 0.02,
  LOGO_FADE_SPEED: 0.08,
  ITEM_FADE_THRESHOLD: 120,
  PULSE_SPEED: 400,
  PULSE_SCALE: 0.08,
  VORTEX_ROTATION_SPEED: 0.022,
  MULTIPLIER_UPDATE_INTERVAL: 150,
  OUTCOME_ANIMATION_FREEZE_DURATION: 1500,
  // Impact effect (Effect C)
  IMPACT_FLASH_DECAY: 0.025,
  IMPACT_SCALE_BOOST: 0.7,
  IMPACT_SCALE_DECAY: 0.92,
  IMPACT_SCALE_CLEAR_THRESHOLD: 0.005,
  IMPACT_GLOW_THRESHOLD: 0.02,
  IMPACT_GLOW_MAX_BLUR: 40,
  IMPACT_BORDER_EXTRA_WIDTH: 3,
  IMPACT_FONT_SCALE: 1.38,
} as const;

// Floater (flushing item) settings
export const FLOATER = {
  INITIAL_RADIUS_MULTIPLIER: 1.05,
  INITIAL_RADIUS_MULTIPLIER_MOBILE: 1.35,
  BASE_SPEED: 0.015,
  BASE_INWARD_SPEED: 0.4,
  SPEED_ADJUSTMENT_FACTOR: 0.004,
  INWARD_SPEED_ADJUSTMENT_FACTOR: 0.02,
  SPEED_ADJUSTMENT_CONSTANT: 150,
  SPEED_BASE_ADJUSTMENT: 0.015,
  INWARD_SPEED_BASE_ADJUSTMENT: 0.5,
  WOBBLE_INCREMENT: 0.1,
  WOBBLE_AMPLITUDE: 8,
  FINISH_RADIUS: 30,
  SIZE: 100,
  SIZE_MOBILE: 56,
  FONT_SIZE: "52px ClashDisplay, sans-serif",
  FADE_MIN_ALPHA: 0.2,
  FADE_MIN_ALPHA_MOBILE: 0.9,
  SPEED_VARIATION: 0.025,
  INWARD_SPEED_VARIATION: 0.5,
  WOBBLE_SPEED_VARIATION: 0.15,
  WOBBLE_AMPLITUDE_VARIATION: 12,
  ROTATION_SPEED_MIN: -0.08,
  ROTATION_SPEED_MAX: 0.08,
} as const;

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
  // PEE bonus settings
  WEEE_BONUS_DURATION: 3500,
  WEEE_BONUS_SCALE: 1.3,
  WEEE_ROTATION_ANGLE: 8,
  WEEE_ROTATION_SPEED: 100,
  PEE_STREAM_DURATION: 10000,
  PEE_STREAM_FRAME_DURATION: 220,
  PEE_STREAM_SIZE: 400,
  PEE_STREAM_SIZE_SMALL_DESKTOP: 300,
  PEE_STREAM_SIZE_MOBILE: 180,

  // POO bonus settings
  POO_SIZE_DESKTOP: 260,
  POO_SIZE_MOBILE: 120,
  POO_ORBIT_RADIUS_START: 180,
  POO_ORBIT_SPIN_SPEED: 0.02,
  POO_ORBIT_SHRINK_SPEED: 0.35, // 180 / 0.35 ≈ 514 frames ≈ 8.5 s at 60 fps
  POO_ROTATION_PER_FRAME: 0.05,
  POO_SCALE_DECAY: 0.998,
  POO_FADE_START_RADIUS: 40,
  POO_FADE_STEP: 0.02,
  POO_FINISH_RADIUS: 10,
  TURD_TIME_DURATION: 3500,
  TURD_TIME_SCALE: 1.3,
  TURD_ROTATION_ANGLE: 8,
  TURD_ROTATION_SPEED: 100,

  // PHONE bonus settings
  PHONE_SIZE: 280,
  PHONE_SIZE_MOBILE: 100,
  BOOTY_CALL_DURATION: 3500, // Logo display duration
  BOOTY_CALL_SCALE: 1.3,
  BOOTY_CALL_VIBRATE_ANGLE: 12, // Shake angle in degrees (stronger than poo/pee)
  BOOTY_CALL_VIBRATE_SPEED: 50, // Milliseconds per vibration (faster for ringing effect)
  BOOTY_CALL_VIBRATE_PAUSE: 800, // Pause between vibration cycles
  PHONE_IN_HAND_FRAME_DURATION: 250, // Milliseconds per hand animation frame
  PHONE_IN_HAND_START_DELAY: 500, // Delay after logo appears before hand animation starts
  PHONE_SPEED_MULTIPLIER: 0.5, // Same as POO - slower for longer animation
  PHONE_TOTAL_ANIMATION_DURATION: 5500, // 5-6 seconds total
  PHONE_ORBIT_SPIN_SPEED: 0.012, // orbit angle per frame (poo = 0.02)
  PHONE_ORBIT_ROTATION_PER_FRAME: 0.07, // self-rotation per frame (poo = 0.15)

  // PLUNGER bonus settings
  PLUNGER_SIZE: 400,
  PLUNGER_SIZE_SMALL_DESKTOP: 300,
  PLUNGER_SIZE_MOBILE: 200,
  PLUNGER_RUSH_DURATION: 3500, // Logo display duration (same as TURD_TIME/WEEE_BONUS)
  PLUNGER_RUSH_SCALE: 1.3,
  PLUNGER_RUSH_ROTATION_ANGLE: 8,
  PLUNGER_RUSH_ROTATION_SPEED: 100,
  PLUNGER_ANIMATION_DURATION: 5500, // 5-6 seconds total
  PLUNGER_SUCKER_DURATION: 1500, // 1-2 seconds showing PLUNGER_SUCCESS
  PLUNGER_PULLOUT_DURATION: 1000, // Pull out animation duration
  PLUNGER_SPEED_MULTIPLIER: 0.5, // Slower for longer animation
  PLUNGER_SWING_AMPLITUDE: 0.4, // Swing amplitude like pee
  PLUNGER_SWING_SPEED: 0.02, // Swing speed
  PLUNGER_SPIN_SLOWDOWN_RATE: 0.98, // Water spin slowdown rate (0.98 = 2% slower each frame)
  PLUNGER_SPIN_RESUME_SPEED: 0.05, // Rate at which water resumes spinning after plunge
  PLUNGER_SUCCESS_Y_OFFSET_SMALL_DESKTOP: 110, // Y-axis offset to center plunger success texture on small desktop screens

  // General settings
  WINNER_DISPLAY_DURATION: 5000,
  WINNER_TEXT_SCALE: 1.2,
} as const;
