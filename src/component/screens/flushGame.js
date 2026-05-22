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
import { resizeBackground } from "../utils/helper";

export async function createFlushScreen(app, onVideoEnd) {
  const container = new Container();
  // Allow zIndex-based sorting so announcement/winner overlays always
  // render above sprinkle particles regardless of insertion order.
  container.sortableChildren = true;

  let centerX = window.innerWidth / 2;
  let centerY = window.innerHeight / 2;
  let maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.48;
  let isMobile = window.innerWidth < 768;
  // console.log("Is mobile:", isMobile);
  //  Preload ALL assets first before creating any sprites
  async function preloadAssets() {
    await Assets.load([
      "/assets/loading-screen/background-img.webp",
      "/assets/flush/toilet-seat.png",
      "/assets/flush/water.png",
      "/sounds/toilet-flush.mp3",
      "/sounds/hit-sound.mp3",
      "/sounds/pee-background.mp3",
      "/sounds/poo-background.mp3",
      "/sounds/phone-ringtone.mp3",
      "/sounds/plunger-background.mp3",
      "/assets/flushable-object/bonnie.png",
      "/assets/flushable-object/bottle.png",
      "/assets/flushable-object/rugby-kiwi.png",
      "/assets/flushable-object/meat-pie.png",
      "/assets/flushable-object/hockey-puck.png",
      "/assets/flushable-object/tim-hortons-coffee.png",
      "/assets/flushable-object/ramen-bowl.png",
      "/assets/flushable-object/surstromming.png",
      "/assets/flushable-object/burrito.png",
      "/assets/flushable-object/ciggie.png",
      "/assets/flushable-object/fish.png",
      "/assets/flushable-object/hamster.png",
      "/assets/flushable-object/hulk.png",
      "/assets/flushable-object/pedo.png",
      "/assets/flushable-object/trump.png",
      "/assets/pee/weee-bonus.webp",
      "/assets/pee/pee-stream-1.png",
      "/assets/pee/pee-stream-2.png",
      "/assets/pee/pee-stream-3.png",
      "/assets/pee/water-yellow.png",
      "/assets/poo/turd-time.webp",
      "/assets/poo/poo.png",
      "/assets/poo/water-green.png",
      "/assets/phone/booty-call.webp",
      "/assets/phone/phone.webp",
      "/assets/phone/purple-water.webp",
      "/assets/plunger/plunger-rush.webp",
      "/assets/plunger/plunger.png",
      "/assets/plunger/orange-water.webp",
    ]);
  }

  const flushableObjects = [
    "/assets/flushable-object/bonnie.png",
    "/assets/flushable-object/bottle.png",
    "/assets/flushable-object/rugby-kiwi.png",
    "/assets/flushable-object/meat-pie.png",
    "/assets/flushable-object/hockey-puck.png",
    "/assets/flushable-object/tim-hortons-coffee.png",
    "/assets/flushable-object/ramen-bowl.png",
    "/assets/flushable-object/surstromming.png",
    "/assets/flushable-object/burrito.png",
    "/assets/flushable-object/ciggie.png",
    "/assets/flushable-object/fish.png",
    "/assets/flushable-object/hamster.png",
    "/assets/flushable-object/hulk.png",
    "/assets/flushable-object/pedo.png",
    "/assets/flushable-object/trump.png",
  ];

  await preloadAssets();

  function getRandomFlushObject() {
    const randomIndex = Math.floor(Math.random() * flushableObjects.length);

    return flushableObjects[randomIndex];
  }
  const bg = Sprite.from("/assets/loading-screen/background-img.webp");
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
  const water = Sprite.from("/assets/flush/water.png");
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
    vortexAngle += 0.03;
    // centerX / centerY are set by resizeWater() — do NOT override here
    // so mobile offset (seat-aligned Y) is preserved every frame

    // ===== BOWL MASK (MAIN CLIP) =====
    bowlMask.clear();
    bowlMask.beginFill(0xffffff);
    bowlMask.drawCircle(centerX, centerY, maxRadius);
    bowlMask.endFill();

    // ===== WATER =====
    water.x = centerX;
    water.y = centerY;
    water.rotation = vortexAngle;

    // IMPORTANT: size = diameter
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

  const seat = Sprite.from("/assets/flush/toilet-seat.png");
  seat.anchor.set(0.5);
  seat.x = app.screen.width / 2;
  seat.y = app.screen.height / 2;
  // seat.x = app.screen.width;
  //seat.y = app.screen.height;
  container.addChild(seat);
  resizeSeat();

  function drawMask() {
    const bounds = seat.getBounds(); // 🔥 get actual seat position

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const radiusX = bounds.width * 0.22; // tweak this
    const radiusY = bounds.height * 0.28; // tweak this

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

  sound.add("flushSound", "/sounds/toilet-flush.mp3");
  sound.add("hitsound", "/sounds/hit-sound.mp3");
  sound.add("winSound", "/sounds/win-sound.mp3");
  sound.add("peeBg", "/sounds/pee-background.mp3");
  sound.add("pooBg", "/sounds/poo-background.mp3");
  sound.add("phoneBg", "/sounds/phone-ringtone.mp3");
  sound.add("plungerBg", "/sounds/plunger-background.mp3");

  function resizeSeat() {
    if (!seat) return;
    const canvasW = app.screen.width;
    const canvasH = app.screen.height;
    const imgRatio = seat.texture.width / seat.texture.height;

    let renderHeight;
    let renderWidth;
    const isMobile = app.screen.width < 768;
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
    const isMobile = canvasW < 768;

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
    resizeSeat(); // sets seat.y — must run before resizeWater
    resizeWater(); // uses seat.y for centerY

    const isMobile = app.screen.width < 768;

    multiplierUI.container.x = app.screen.width / 2;
    multiplierUI.container.y = seat.y;
    multiplierUI.resize(isMobile);
  }

  resizeScene();
  app.renderer.on("resize", resizeScene);

  const {
    playBonusMusic,
    stopBonusMusic,
    showBonusAnnouncement,
    showWinnerZoom,
  } = createBonusOverlays({ app, container });

  function triggerFlush(isAutoplay = false) {
    const roundId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Decide if this flush triggers a bonus (autoplay rounds are always normal flushes)
    flushCount++;
    let bonusType = null;
    if (!isAutoplay && flushCount >= nextBonusAt) {
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

      // Swap water to bonus color immediately
      const bonusWater = Assets.get(config.water);
      if (bonusWater) water.texture = bonusWater;

      // Show announcement banner + badge, hold spiral until banner finishes
      useFlushStore.getState().setAnnouncingBonus(true, bonusType);
      playBonusMusic(bonusType);
      delayedRounds.add(roundId);
      showBonusAnnouncement(bonusType, () => {
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

  function rotateFlush() {
    flushOverlay.rotation -= 0.1;
  }

  function getRandomMultiplier() {
    return (Math.random() * 5 + 1).toFixed(2) + "x";
  }

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
      const randomValue = Math.random() * 50 + 1;

      multiplierUI.update(randomValue);

      lastUpdate = now;
    }
  });

  function createSprinkleEffect(x, y, color = 0x3b82f6) {
    const particles = [];

    for (let i = 0; i < 20; i++) {
      const particle = new Graphics();

      particle.beginFill(color);
      particle.drawCircle(0, 0, Math.random() * 4 + 2);
      particle.endFill();

      particle.x = x;
      particle.y = y;

      // random direction
      particle.vx = (Math.random() - 0.5) * 12;
      particle.vy = (Math.random() - 0.5) * 12;

      particle.alpha = 1;

      container.addChild(particle);

      particles.push(particle);
    }

    const tickerFn = () => {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        p.alpha -= 0.03;

        p.scale.x *= 0.98;
        p.scale.y *= 0.98;
      });

      // remove dead particles
      if (particles[0]?.alpha <= 0) {
        particles.forEach((p) => {
          container.removeChild(p);
          p.destroy();
        });

        app.ticker.remove(tickerFn);
      }
    };

    app.ticker.add(tickerFn);
  }

  function getParticleColor(multiplier) {
    if (multiplier < 3) return 0xa855f7;

    if (multiplier < 25) return 0x3b82f6;

    return 0xeab308;
  }

  // ─── Autoplay tracker ────────────────────────────────────────────────────────
  // Tracks which rounds belong to the current autoplay batch so we can detect
  // when they all finish naturally (→ trigger end-bonus) vs being stopped.

  let autoplayRoundIds = new Set(); // IDs still in flight
  let autoplayPendingLaunches = 0; // setTimeouts not yet fired

  function checkAutoplayComplete() {
    if (autoplayPendingLaunches > 0) return; // still staggering launches
    if (autoplayRoundIds.size > 0) return; // rounds still spiraling
    if (!useFlushStore.getState().isAuto) return; // user pressed STOP

    // All rounds finished naturally → trigger an end bonus then exit auto mode
    triggerEndBonus();
  }

  function handleAutoplayRoundComplete(roundId) {
    if (!autoplayRoundIds.has(roundId)) return;
    autoplayRoundIds.delete(roundId);
    checkAutoplayComplete();
  }

  function isAutoplayRound(roundId) {
    return autoplayRoundIds.has(roundId);
  }

  function triggerEndBonus() {
    useFlushStore.getState().stopAutoplay();
    // Force the very next triggerFlush to pick a bonus
    flushCount = nextBonusAt - 1;
    triggerFlush();
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
    createSprinkleEffect,
    getParticleColor,
    lockState,
    getCenter: () => ({ x: centerX, y: centerY }),
    onRoundComplete: handleAutoplayRoundComplete,
    isAutoplayRound,
  });

  return { container, triggerFlush, triggerAutoplay };
}
