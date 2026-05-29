import {
  Container,
  Sprite,
  Assets,
  Graphics,
  TextStyle,
  Text,
  AnimatedSprite,
} from "pixi.js";
import { sound } from "@pixi/sound";
import {
  useFlushStore,
  selectActiveBonusRound,
} from "../../store/useRoyalFlushStore";
import { createRoundStatusManager } from "./roundStatusManager";
import { createMultiplierUI } from "./multiplier";
import {
  BONUS_TYPES,
  BONUS_CONFIG,
  createBonusOverlays,
} from "./bonusOverlays";
import {
  resizeBackground,
  getRandomFlushObject,
  getParticleColor,
  createSprinkleEffect,
  generateOutcome,
} from "../utils/helper";
import { ASSETS, SOUNDS } from "../../lib/constants";

export async function createFlushScreen(app, onVideoEnd) {
  const container = new Container();
  // Allow zIndex-based sorting so announcement/winner overlays always
  container.sortableChildren = true;

  // Dedicated container for React-hook-driven particle effects (pee stream, etc.)
  const particlesContainer = new Container();
  particlesContainer.zIndex = 1008; // above multiplier (96) — used by pee stream
  container.addChild(particlesContainer);

  // Container for poo/phone orbit sprites — sits below the multiplier circle.
  const bonusObjectsContainer = new Container();
  bonusObjectsContainer.zIndex = 50; // below multiplier (96)
  container.addChild(bonusObjectsContainer);

  let centerX = window.innerWidth / 2;
  let centerY = window.innerHeight / 2;
  let maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.48;
  let isMobile = window.innerWidth < 768;

  const bg = Sprite.from(ASSETS.BACKGROUND_IMG);
  container.addChild(bg);

  // Bowl container to hold water and seat, so they rotate together
  const bowlContainer = new Container();
  container.addChild(bowlContainer);

  // mask for whole bowl
  const bowlMask = new Graphics();
  app.stage.addChild(bowlMask);
  bowlContainer.mask = bowlMask;

  // water mask
  const waterMask = new Graphics();
  app.stage.addChild(waterMask);

  //flushed water
  const water = Sprite.from(ASSETS.WATER);
  water.anchor.set(0.5);
  bowlContainer.addChild(water);
  const defaultWaterTex = water.texture;

  let vortexAngle = 0;

  let flushCount = 0;
  let nextBonusAt = 6 + Math.floor(Math.random() * 2);
  const pendingBonusForRound = new Map(); // roundId → bonusType, lives until round cleanup
  const delayedRounds = new Set(); // rounds blocked until announcement finishes

  // Shared bowl mask params — updated on resize, read in ticker
  //let bowlMaskParams = { cx: 0, cy: 0, rx: 100, ry: 120 };

  app.ticker.add(() => {
    if (!useFlushStore.getState().waterSpinPaused) {
      vortexAngle += 0.03;
    }
    // centerX / centerY are set by resizeWater() — do NOT override here
    // so mobile offset (seat-aligned Y) is preserved every frame

    // BOWL MASK
    bowlMask.clear();
    bowlMask.beginFill(0xffffff);
    bowlMask.drawCircle(centerX, centerY, maxRadius);
    bowlMask.endFill();

    // WATER
    water.x = centerX;
    water.y = centerY;
    water.rotation = vortexAngle;

    // size = diameter
    water.width = maxRadius * 2;
    water.height = maxRadius * 2;

    // ===== WATER MASK =====
    waterMask.clear();
    waterMask.beginFill(0xffffff);
    waterMask.drawCircle(centerX, centerY, maxRadius);
    waterMask.endFill();
  });
  //end of vortex code

  //tiolet seat
  const seat = Sprite.from(ASSETS.TOILET_SEAT);
  seat.anchor.set(0.5);
  seat.x = app.screen.width / 2;
  seat.y = app.screen.height / 2;
  container.addChild(seat);
  resizeSeat();

  function drawMask() {
    const bounds = seat.getBounds(); // get actual seat position

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const radiusX = bounds.width * 0.22;
    const radiusY = bounds.height * 0.28;

    bowlMask.clear();
    bowlMask.beginFill(0xffffff);
    bowlMask.drawEllipse(centerX, centerY, radiusX, radiusY);
    bowlMask.endFill();
  }

  // flush animation image
  const flushOverlay = new Sprite();
  flushOverlay.anchor.set(0.5);
  flushOverlay.x = app.screen.width / 2;
  flushOverlay.y = app.screen.height / 2;

  flushOverlay.visible = false; // initially hidden
  container.addChild(flushOverlay);

  //multiplier ui
  const multiplierUI = createMultiplierUI(centerX, centerY);
  container.addChild(multiplierUI.container);

  sound.add("flushSound", SOUNDS.FLUSH_SOUND);
  sound.add("hitsound", SOUNDS.HIT_SOUND);
  sound.add("winSound", SOUNDS.WIN_SOUND);
  sound.add("peeBg", SOUNDS.PEE_BACKGROUND_SOUNDS);
  sound.add("pooBg", SOUNDS.POO_BACKGROUND_SOUNDS);
  sound.add("phoneBg", SOUNDS.PHONE_BONUS_MUSIC);
  sound.add("plungerBg", SOUNDS.PLUNGER_BACKGROUND_SOUNDS);

  function resizeSeat() {
    if (!seat) return;
    const canvasW = app.screen.width;
    const canvasH = app.screen.height;
    const imgRatio = seat.texture.width / seat.texture.height;

    let renderHeight;
    let renderWidth;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      renderHeight = canvasH * 0.6;
      renderWidth = renderHeight * imgRatio;
    } else {
      renderHeight = canvasH;
      renderWidth = renderHeight * imgRatio;
    }

    seat.width = renderWidth;
    seat.height = renderHeight;
    seat.x = canvasW / 2;
    //seat.y = canvasH / 2;
    seat.y = isMobile ? renderHeight / 2 : canvasH / 2;
  }

  function resizeWater() {
    const canvasW = app.screen.width;
    const canvasH = app.screen.height;
    const isMobile = window.innerWidth < 768;

    centerX = canvasW / 2;
    // align water centre with the seat centre so it always sits inside the bowl
    centerY = seat.y;

    maxRadius = isMobile ? canvasH * 0.3 : Math.min(canvasW, canvasH) * 0.52;

    water.width = maxRadius * 2;
    water.height = maxRadius * 2;
    water.x = centerX;
    water.y = centerY;
  }

  function resizeScene() {
    resizeBackground(app, bg);
    resizeSeat();
    resizeWater();

    const isMobile = window.innerWidth < 768;

    multiplierUI.container.x = app.screen.width / 2;
    multiplierUI.container.y = seat.y;
    multiplierUI.resize(isMobile);

    // Keep the React hooks in sync with the current PIXI state.
    // maxRadius and the bowl-centre coordinates change on every resize —
    // pushing them here means the hooks read the latest values from their
    // stable renderer ref without restarting the animation effect.
    useFlushStore.getState().setRendererState({
      app,
      maxRadius,
      particlesContainer,
      bonusObjectsContainer,
      centerX,
      centerY,
    });
  }

  resizeScene();
  app.renderer.on("resize", resizeScene);

  const {
    playBonusMusic,
    stopBonusMusic,
    showBonusAnnouncement,
    showWinnerZoom,
  } = createBonusOverlays({
    app,
    container,
    getCenter: () => ({ x: centerX, y: centerY }),
  });

  function triggerFlush(isAutoplay = false) {
    const roundId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Decide if this flush triggers a bonus.
    // Bonuses are disabled for medium risk — autoplay rounds are also always normal.
    flushCount++;
    const currentRisk = useFlushStore.getState().currentRisk;

    let bonusType = null;
    if (!isAutoplay && currentRisk !== "medium" && flushCount >= nextBonusAt) {
      bonusType = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
      pendingBonusForRound.set(roundId, bonusType);
      flushCount = 0;
      nextBonusAt = 2 + Math.floor(Math.random() * 2);
    }

    if (bonusType) {
      const config = BONUS_CONFIG[bonusType];

      // Bonus object spirals instead of a random item
      if (bonusType === "pee") {
        flushOverlay.texture = Assets.get(config.objectFrames[0]);
      } else {
        flushOverlay.texture = Assets.get(config.object);
      }
      useFlushStore
        .getState()
        .addRound(
          roundId,
          useFlushStore.getState().betAmount,
          flushOverlay.texture,
        );

      // Show announcement banner + badge, hold spiral until banner finishes
      useFlushStore.getState().setAnnouncingBonus(true, bonusType);
      playBonusMusic(bonusType);
      delayedRounds.add(roundId);
      showBonusAnnouncement(bonusType, () => {
        // Swap water to bonus colour only after the announcement overlay is gone
        const bonusWater = Assets.get(config.water);
        if (bonusWater) water.texture = bonusWater;
        delayedRounds.delete(roundId);
      });
    } else {
      // Normal flush with a random object (always used for autoplay rounds)
      flushOverlay.texture = Assets.get(getRandomFlushObject());
      useFlushStore
        .getState()
        .addRound(
          roundId,
          useFlushStore.getState().betAmount,
          flushOverlay.texture,
        );
    }

    sound.play("flushSound");
    return roundId;
  }

  const activeSprites = new Map();

  app.ticker.add(() => {
    const rounds = useFlushStore.getState().rounds;
    // console.log("Current rounds:", rounds);
    Object.values(rounds).forEach((round) => {
      roundStatusManager(round);
    });
  });

  // Shared mutable lock flag — passed into createRoundStatusManager so the
  // handler can set/clear it, and read here by the multiplier ticker.
  const lockState = { isLocked: false };

  let lastUpdate = 0;

  const colors = [0x00bfff, 0x8a2be2, 0xffd700]; // blue, purple, yellow
  let colorIndex = 0;

  app.ticker.add(() => {
    const now = performance.now();
    const hasPlacedBet = useFlushStore.getState().hasPlacedFirstBet;

    if (!lockState.isLocked && hasPlacedBet && now - lastUpdate > 200) {
      const currentRisk = useFlushStore.getState().currentRisk;
      const randomValue = generateOutcome(currentRisk);

      multiplierUI.update(randomValue);

      lastUpdate = now;
    }
  });

  // Autoplay tracker-
  // Tracks which rounds belong to the current autoplay batch.
  // When a batch finishes naturally, a new batch starts immediately so flushing
  // continues until the user explicitly presses Stop.

  let autoplayRoundIds = new Set(); // IDs still in flight
  let autoplayPendingLaunches = 0; // setTimeouts not yet fired

  function checkAutoplayComplete() {
    if (autoplayPendingLaunches > 0) return; // still staggering launches
    if (autoplayRoundIds.size > 0) return; // rounds still spiraling
    if (!useFlushStore.getState().isAuto) return; // user pressed STOP

    // Batch finished naturally — immediately start the next one
    triggerAutoplay();
  }

  function handleAutoplayRoundComplete(roundId) {
    if (!autoplayRoundIds.has(roundId)) return;
    autoplayRoundIds.delete(roundId);
    checkAutoplayComplete();
  }

  function isAutoplayRound(roundId) {
    return autoplayRoundIds.has(roundId);
  }

  function triggerAutoplay() {
    const count = 3 + Math.floor(Math.random() * 5); // 3 – 7 objects
    autoplayRoundIds = new Set();
    autoplayPendingLaunches = count;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!useFlushStore.getState().isAuto) {
          // Autoplay was stopped before this launch fired — just count it off
          autoplayPendingLaunches--;
          checkAutoplayComplete();
          return;
        }
        const roundId = triggerFlush(true);
        if (roundId) autoplayRoundIds.add(roundId);
        autoplayPendingLaunches--;
        checkAutoplayComplete();
      }, i * 300);
    }
  }

  const roundStatusManager = createRoundStatusManager({
    app,
    container,
    activeSprites,
    water,
    defaultWaterTex,
    delayedRounds,
    pendingBonusForRound,
    stopBonusMusic,
    showWinnerZoom,
    multiplierUI,
    sound,
    createSprinkleEffect: (x, y, color) => createSprinkleEffect(app, container, x, y, color),
    getParticleColor,
    lockState,
    getCenter: () => ({ x: centerX, y: centerY }),
    getMaxRadius: () => maxRadius,
    onRoundComplete: handleAutoplayRoundComplete,
    isAutoplayRound,
  });

  return { container, triggerFlush, triggerAutoplay };
}
