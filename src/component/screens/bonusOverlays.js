import { Container, Graphics, Sprite, Text } from "pixi.js";
import { sound } from "@pixi/sound";
import { ASSETS } from "../../lib/constants";

// Bonus type list

export const BONUS_TYPES = ["pee", "poo"];

// Per-bonus asset config

export const BONUS_CONFIG = {
  pee: {
    announcement: ASSETS.WEEE_BONUS,
    objectFrames: [ASSETS.PEE_STREAM_1, ASSETS.PEE_STREAM_2, ASSETS.PEE_STREAM_3],
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

    overlay.zIndex = 100; // always above sprites and sprinkle particles
    container.addChild(overlay);

    setTimeout(() => {
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
    winOverlay.zIndex = 100; // always above sprinkle particles

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

  return {
    playBonusMusic,
    stopBonusMusic,
    showBonusAnnouncement,
    showWinnerZoom,
  };
}
