import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import { sound } from "@pixi/sound";
import { ASSETS, BONUS_MODE } from "../../lib/constants";

// Bonus type list

export const BONUS_TYPES = ["pee", "poo", "phone"];

// Per-bonus asset config

export const BONUS_CONFIG = {
  pee: {
    announcement: ASSETS.WEEE_BONUS,
    objectFrames: [
      ASSETS.PEE_STREAM_1,
      ASSETS.PEE_STREAM_2,
      ASSETS.PEE_STREAM_3,
    ],
    water: ASSETS.PEE_WATER,
  },
  poo: {
    announcement: ASSETS.TURD_TIME,
    object: ASSETS.POO,
    water: ASSETS.POO_WATER,
  },
  phone: {
    announcement: ASSETS.BOOTY_CALL,
    object: ASSETS.PHONE,
    water: ASSETS.PURPLE_WATER,
  },
  plunger: {
    announcement: ASSETS.PLUNGER_RUSH,
    object: ASSETS.PLUNGER,
    water: ASSETS.ORANGE_WATER,
  },
};

/**
 * Creates the bonus overlay helpers (announcement banner + background music).
 *
 * @param {object}                        ctx
 * @param {import("pixi.js").Application} ctx.app       - PixiJS app instance
 * @param {import("pixi.js").Container}   ctx.container - scene container
 * @returns {{ showBonusAnnouncement, playBonusMusic, stopBonusMusic }}
 */
export function createBonusOverlays({ app, container }) {
  // Background music

  const MUSIC_MAP = {
    pee: "peeBg",
    poo: "pooBg",
    phone: "phoneBg",
    plunger: "plungerBg",
  };

  let activeBonusSoundName = null;

  /**
   * Starts the looping background music for the given bonus type.
   * Stops any currently playing bonus music first.
   * @param {string} type - one of the BONUS_TYPES keys
   */
  function playBonusMusic(type) {
    stopBonusMusic();

    const soundName = MUSIC_MAP[type];
    if (!soundName || !sound.exists(soundName)) {
      console.warn("bonusOverlays: missing sound for type:", type);
      return;
    }

    activeBonusSoundName = soundName;
    sound.play(soundName, {
      loop: true,
      volume: 0.5,
      singleInstance: true,
    });
  }

  /**
   * Stops the currently playing bonus background music, if any.
   */
  function stopBonusMusic() {
    if (activeBonusSoundName) {
      sound.stop(activeBonusSoundName);
      activeBonusSoundName = null;
    }
  }

  // Announcement banner

  /**
   * Displays the bonus announcement image centred over the toilet for 3 s,
   * then removes it and calls onDone.
   *
   * @param {string}   bonusType - one of the BONUS_TYPES keys
   * @param {Function} onDone    - callback fired after the banner is removed
   */
  function showBonusAnnouncement(bonusType, onDone) {
    const config = BONUS_CONFIG[bonusType];
    const overlay = Sprite.from(config.announcement);

    overlay.anchor.set(0.5);
    overlay.scale.set(0.5);
    overlay.x = app.screen.width / 2;
    overlay.y = app.screen.height / 2;

    // Fit within 42 % wide / 36 % tall while preserving aspect ratio
    const maxW = app.screen.width * 0.42;
    const maxH = app.screen.height * 0.36;
    const ratio = overlay.texture.width / overlay.texture.height;

    if (maxW / ratio <= maxH) {
      overlay.width = maxW;
      overlay.height = maxW / ratio;
    } else {
      overlay.height = maxH;
      overlay.width = maxH * ratio;
    }

    overlay.zIndex = 1010; // above multiplier (1007) and bonus animations (1008)
    container.addChild(overlay);

    // ── Shake / wobble while the announcement is visible ──────────────────
    // Two sine waves at different frequencies give an organic, non-mechanical feel.
    const baseX = app.screen.width / 2;
    const baseY = app.screen.height / 2;
    let shakeT = 0;

    const shakeFn = () => {
      shakeT += 0.04;
      overlay.x = baseX + Math.sin(shakeT * 2.5) * 3;
      overlay.y = baseY + Math.cos(shakeT * 1.8) * 2;
      overlay.rotation = Math.sin(shakeT * 1.4) * 0.015; // ±~0.9°
    };
    app.ticker.add(shakeFn);

    setTimeout(() => {
      app.ticker.remove(shakeFn);
      if (overlay.parent) container.removeChild(overlay);
      overlay.destroy();
      onDone();
    }, 5000);
  }

  // Winner zoom overlay

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * Animates a zoom-in "WINNER" result card over the bowl centre.
   * Zooms in (easeOutBack) → holds → fades out. Total ~1 750 ms.
   *
   * @param {number} multiplier  - final multiplier value
   * @param {number} betAmount   - original bet amount
   * @param {number} cx          - centre x (live)
   * @param {number} cy          - centre y (live)
   */
  function showWinnerZoom(multiplier, betAmount, cx, cy) {
    const winOverlay = new Container();
    winOverlay.x = cx;
    winOverlay.y = cy;
    winOverlay.scale.set(0);
    winOverlay.alpha = 0;
    winOverlay.zIndex = 1010; // above multiplier (1007) and bonus animations (1008)

    // Dark circle with gold border
    const bg = new Graphics();
    bg.lineStyle(5, 0xffd700, 1);
    bg.beginFill(0x071507, 0.85);
    bg.drawCircle(0, 0, 165);
    bg.endFill();
    winOverlay.addChild(bg);

    // Inner gold ring accent
    const ring = new Graphics();
    ring.lineStyle(2, 0xffd700, 0.4);
    ring.drawCircle(0, 0, 150);
    winOverlay.addChild(ring);

    // "WINNER" label
    const winnerLabel = new Text("WINNER", {
      fontFamily: "Arial",
      fontSize: 30,
      fontWeight: "900",
      fill: "#ffffff",
      letterSpacing: 5,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 8,
      dropShadowDistance: 3,
    });
    winnerLabel.anchor.set(0.5);
    winnerLabel.y = -68;
    winOverlay.addChild(winnerLabel);

    // Multiplier value (large, gold)
    const multText = new Text(`${multiplier.toFixed(2)}x`, {
      fontFamily: "Arial",
      fontSize: 72,
      fontWeight: "900",
      fill: "#ffd700",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 10,
      dropShadowDistance: 4,
    });
    multText.anchor.set(0.5);
    multText.y = -5;
    winOverlay.addChild(multText);

    // Win amount
    const winAmt = betAmount * multiplier;
    const amtText = new Text(`$${winAmt.toFixed(2)}`, {
      fontFamily: "Arial",
      fontSize: 28,
      fontWeight: "700",
      fill: "#ffffff",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 6,
      dropShadowDistance: 3,
    });
    amtText.anchor.set(0.5);
    amtText.y = 66;
    winOverlay.addChild(amtText);

    container.addChild(winOverlay);

    const ZOOM_MS = 450;
    const HOLD_MS = 1050;
    const FADE_MS = 300;

    let phase = "zoom";
    let phaseStart = performance.now();
    const zoomStart = phaseStart;

    const tickFn = () => {
      const now = performance.now();

      if (phase === "zoom") {
        const t = Math.min((now - zoomStart) / ZOOM_MS, 1);
        winOverlay.scale.set(easeOutBack(t));
        winOverlay.alpha = Math.min(t * 3, 1);
        if (t >= 1) {
          phase = "hold";
          phaseStart = now;
        }
      } else if (phase === "hold") {
        if (now - phaseStart >= HOLD_MS) {
          phase = "fade";
          phaseStart = now;
        }
      } else {
        const t = Math.min((now - phaseStart) / FADE_MS, 1);
        winOverlay.alpha = 1 - t;
        if (t >= 1) {
          app.ticker.remove(tickFn);
          if (winOverlay.parent) container.removeChild(winOverlay);
          winOverlay.destroy({ children: true });
        }
      }
    };

    app.ticker.add(tickFn);
  }

  // ─── Phone bonus animation ────────────────────────────────────────────────
  //
  // Sequence:
  //   1. phone-in-hand (3 frames played once, slower pace) rises from bottom
  //   2. Brief hold on the last frame
  //   3. Hand fades out, phone.webp fades in
  //   4. Phone snaps onto the orbit circle and spirals in with identical
  //      physics to the poo bonus (POO_ORBIT_* constants) — spinning,
  //      scaling, fading near centre → onDone() when orbitRadius ≤ finish

  /**
   * @param {Function}  onDone   - called when the full animation has finished
   * @param {number}    cx       - bowl centre x
   * @param {number}    cy       - bowl centre y
   */
  function showPhoneAnimation(onDone, cx, cy) {
    const isMobile = app.screen.width < 768;

    // ── Load textures ──────────────────────────────────────────────────────
    const frames = [
      Assets.get(ASSETS.PHONE_IN_HAND_1),
      Assets.get(ASSETS.PHONE_IN_HAND_2),
      Assets.get(ASSETS.PHONE_IN_HAND_3),
    ];

    if (!frames[0] || !frames[1] || !frames[2]) {
      console.warn("showPhoneAnimation: phone-in-hand textures not loaded yet");
      onDone();
      return;
    }

    // ── Hand sprite (rises from bottom) ───────────────────────────────────
    const hand = new Sprite(frames[0]);
    hand.anchor.set(0.5, 1); // bottom-centre anchor → slides up cleanly

    const handHeight = app.screen.height * (isMobile ? 0.58 : 0.64);
    const handRatio = frames[0].width / frames[0].height;
    hand.height = handHeight;
    hand.width = handHeight * handRatio;

    hand.x = cx;
    const handStartY = app.screen.height + hand.height * 0.1;
    const handTargetY = app.screen.height; // bottom anchor flush with screen edge
    hand.y = handStartY;
    hand.zIndex = 1008; // above multiplier (1007)
    container.addChild(hand);

    // ── Phone sprite (hidden until hand fades out) ─────────────────────────
    const phoneTex = Assets.get(ASSETS.PHONE);
    const phone = new Sprite(phoneTex);
    phone.anchor.set(0.5);

    // Use a base scale so every subsequent scale.set() call in the animation
    // stays relative to this size — setting phone.width/height then calling
    // scale.set(1) later would silently reset to full native texture size.
    const phoneSize = isMobile
      ? BONUS_MODE.PHONE_SIZE_MOBILE
      : BONUS_MODE.PHONE_SIZE;
    const phoneBaseScale = phoneSize / phoneTex.width;
    phone.scale.set(phoneBaseScale);
    phone.x = cx;
    phone.y = handTargetY - handHeight * 0.65;
    phone.alpha = 0;
    phone.visible = false;
    phone.zIndex = 0; // below multiplier — orbits under the multiplier circle like normal floaters
    container.addChild(phone);

    // ── Timings for hand phases ────────────────────────────────────────────
    const ENTRY_MS = 1800; // hand slides up
    const FRAME_MS = 400; // ms per frame — plays only once (0 → 1 → 2)
    const HOLD_MS = 350; // hold on last frame before transition
    const TRANSITION_MS = 380; // hand fade-out / phone fade-in crossfade

    let phase = "entry";
    let phaseStart = performance.now();
    let frameIdx = 0;
    let lastFrame = phaseStart;
    let framesDone = false; // set true when last frame is shown — stops cycling

    // Orbit state (matches poo exactly)
    let orbitAngle = 0;
    let orbitRadius = 0;

    const tickFn = () => {
      const now = performance.now();

      // ── Advance frames once only: 0 → 1 → 2, then freeze ─────────────
      if (
        !framesDone &&
        (phase === "entry" || phase === "hold") &&
        now - lastFrame >= FRAME_MS
      ) {
        if (frameIdx < frames.length - 1) {
          frameIdx++;
          hand.texture = frames[frameIdx];
          lastFrame = now;
          if (frameIdx === frames.length - 1) framesDone = true;
        }
      }

      // ── Phase: entry — hand rises from bottom ──────────────────────────
      if (phase === "entry") {
        const t = Math.min((now - phaseStart) / ENTRY_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
        hand.y = handStartY + (handTargetY - handStartY) * eased;

        if (t >= 1) {
          phase = "hold";
          phaseStart = now;
        }

        // ── Phase: hold — freeze on last frame ────────────────────────────
      } else if (phase === "hold") {
        if (now - phaseStart >= HOLD_MS) {
          phone.y = hand.y - handHeight * 0.65;
          phone.visible = true;

          phase = "transition";
          phaseStart = now;
        }

        // ── Phase: transition — hand fades, phone fades in ────────────────
      } else if (phase === "transition") {
        const t = Math.min((now - phaseStart) / TRANSITION_MS, 1);
        hand.alpha = 1 - t;
        phone.alpha = t;
        phone.scale.set(phoneBaseScale * (1.03 - 0.03 * t)); // subtle punch relative to base

        if (t >= 1) {
          container.removeChild(hand);
          hand.destroy();
          phone.scale.set(phoneBaseScale);
          phone.alpha = 1;

          // ── Snap phone onto the orbit circle ──────────────────────────
          // Use the angle from bowl-centre to phone's current position.
          // If the phone is essentially at centre (desktop), fall back to
          // π/2 (directly below) since the hand always comes from below.
          const dx = phone.x - cx;
          const dy = phone.y - cy;
          const dist = Math.hypot(dx, dy);
          orbitAngle = dist > 20 ? Math.atan2(dy, dx) : Math.PI * 0.5;
          orbitRadius = BONUS_MODE.POO_ORBIT_RADIUS_START;

          phone.x = cx + Math.cos(orbitAngle) * orbitRadius;
          phone.y = cy + Math.sin(orbitAngle) * orbitRadius;

          phase = "orbit";
          phaseStart = now;
        }

        // ── Phase: orbit — same spiral physics as poo, slower spin/rotation ──
      } else if (phase === "orbit") {
        orbitAngle += BONUS_MODE.PHONE_ORBIT_SPIN_SPEED; // slower than poo (0.012 vs 0.02)
        orbitRadius -= BONUS_MODE.POO_ORBIT_SHRINK_SPEED; // same shrink rate as poo

        phone.x = cx + Math.cos(orbitAngle) * orbitRadius;
        phone.y = cy + Math.sin(orbitAngle) * orbitRadius;

        phone.rotation += BONUS_MODE.PHONE_ORBIT_ROTATION_PER_FRAME; // slower than poo (0.07 vs 0.15)
        phone.scale.x *= BONUS_MODE.POO_SCALE_DECAY;
        phone.scale.y *= BONUS_MODE.POO_SCALE_DECAY;

        if (orbitRadius < BONUS_MODE.POO_FADE_START_RADIUS) {
          phone.alpha -= BONUS_MODE.POO_FADE_STEP;
        }

        if (orbitRadius <= BONUS_MODE.POO_FINISH_RADIUS) {
          app.ticker.remove(tickFn);
          if (phone.parent) container.removeChild(phone);
          phone.destroy();
          onDone();
        }
      }
    };

    app.ticker.add(tickFn);
  }

  return {
    playBonusMusic,
    stopBonusMusic,
    showBonusAnnouncement,
    showWinnerZoom,
  };
}
