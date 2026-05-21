import { Sprite, Assets } from "pixi.js";
import { useFlushStore } from "../../store/useRoyalFlushStore";
import { BONUS_CONFIG } from "./bonusOverlays";

/**
 * Creates the per-frame round-status handler used in the game ticker.
 *
 * Dependencies are injected via `ctx` so this module has no hidden
 * coupling to flushGame's closure scope.
 *
 * @param {object}                          ctx
 * @param {import("pixi.js").Application}   ctx.app
 * @param {import("pixi.js").Container}     ctx.container
 * @param {Map}                             ctx.activeSprites
 * @param {import("pixi.js").Sprite}        ctx.water
 * @param {import("pixi.js").Texture}       ctx.defaultWaterTex
 * @param {Set}                             ctx.delayedRounds
 * @param {Map}                             ctx.pendingBonusForRound
 * @param {Function}                        ctx.stopBonusMusic
 * @param {Function}                        ctx.showWinnerZoom
 * @param {{ container, update: Function }} ctx.multiplierUI
 * @param {import("@pixi/sound").sound}     ctx.sound
 * @param {Function}                        ctx.createSprinkleEffect
 * @param {Function}                        ctx.getParticleColor
 * @param {{ isLocked: boolean }}           ctx.lockState   - shared mutable lock flag
 * @param {() => { x: number, y: number }}  ctx.getCenter   - returns live center coords
 * @returns {(round: object) => void}
 */
export function createRoundStatusManager({
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
  getCenter,
}) {
  return function roundStatusManager(round) {
    const { x: centerX, y: centerY } = getCenter();

    // ─── PENDING → create sprite and transition to spinning ───────────────────

    if (round.status === "pending") {
      if (delayedRounds.has(round.roundId)) return;

      const pendingBonus = pendingBonusForRound.get(round.roundId) || "none";
      useFlushStore
        .getState()
        .startRound(round.roundId, Math.random() * 5 + 1, pendingBonus, null);

      let obj;

      if (pendingBonus === "pee") {
        // PEE BONUS: full-screen animated sprite
        const frames = BONUS_CONFIG.pee.objectFrames.map((path) =>
          Assets.get(path),
        );

        obj = new Sprite(frames[0]);
        obj.isPeeBonus = true;
        obj.anchor.set(0.5, 1);
        obj.x = centerX;
        obj.y = app.screen.height;
        obj.width = app.screen.width * 0.55;
        obj.height = app.screen.height * 0.65;

        let peeFrameIndex = 0;
        obj.peeFrameInterval = setInterval(() => {
          peeFrameIndex = (peeFrameIndex + 1) % frames.length;
          if (obj && !obj.destroyed) obj.texture = frames[peeFrameIndex];
        }, 1500);
      } else {
        // NORMAL / BONUS (poo, phone, plunger): orbiting sprite
        obj = Sprite.from(round.texture);
        obj.anchor.set(0.5);
        obj.orbitAngle = Math.random() * Math.PI * 2;
        obj.orbitRadius = 180;
        obj.spinSpeed = 0.02;
        obj.shrinkSpeed = 0.8;
        obj.x = centerX + Math.cos(obj.orbitAngle) * obj.orbitRadius;
        obj.y = centerY + Math.sin(obj.orbitAngle) * obj.orbitRadius;
      }

      container.addChild(obj);
      activeSprites.set(round.roundId, obj);
    }

    // ─── SPINNING → animate towards center ────────────────────────────────────

    if (round.status === "spinning") {
      const obj = activeSprites.get(round.roundId);
      if (!obj) return;

      if (obj.isPeeBonus) {
        // Pee bonus stays static; fire triggerBonus after the display window
        if (obj.bonusTriggered) return;
        obj.bonusTriggered = true;
        setTimeout(() => {
          useFlushStore.getState().triggerBonus(round.roundId, "pee");
        }, 10000);
        return;
      }

      // Spiral the object toward the bowl center
      obj.orbitAngle += obj.spinSpeed;
      obj.orbitRadius -= obj.shrinkSpeed;
      obj.x = centerX + Math.cos(obj.orbitAngle) * obj.orbitRadius;
      obj.y = centerY + Math.sin(obj.orbitAngle) * obj.orbitRadius;
      obj.rotation += 0.15;
      obj.scale.x *= 0.995;
      obj.scale.y *= 0.995;

      if (obj.orbitRadius < 60) obj.alpha -= 0.03;

      if (obj.orbitRadius <= 10) {
        useFlushStore.getState().completeRound(round.roundId);
      }
    }

    // ─── BONUS → pee display window done, brief hold then complete ────────────

    if (round.status === "bonus") {
      const obj = activeSprites.get(round.roundId);
      if (!obj || obj.isBonusHandled) return;
      obj.isBonusHandled = true;

      water.texture = defaultWaterTex;

      if (obj.peeFrameInterval) {
        clearInterval(obj.peeFrameInterval);
        obj.peeFrameInterval = null;
      }
      obj.visible = false;

      setTimeout(() => {
        useFlushStore.getState().completeRound(round.roundId);
      }, 1500);
    }

    // ─── COMPLETED → show result then clean up ────────────────────────────────

    if (round.status === "completed") {
      const obj = activeSprites.get(round.roundId);
      if (!obj || obj.isCompletedHandled) return;
      obj.isCompletedHandled = true;

      obj.rotation = 0;

      if (round.bonusType !== "none") {
        water.texture = defaultWaterTex;
        stopBonusMusic();
      }

      lockState.isLocked = true;
      multiplierUI.update(round.multiplier);
      if (round.bonusType !== "none") {
        showWinnerZoom(round.multiplier, round.betAmount, centerX, centerY);
      }

      sound.stop("flushSound");
      sound.play("hitsound");
      createSprinkleEffect(centerX, centerY, getParticleColor(round.multiplier));

      const finishedRoundId = round.roundId;
      setTimeout(() => {
        lockState.isLocked = false;

        container.removeChild(obj);
        activeSprites.delete(finishedRoundId);
        useFlushStore.getState().removeRound(finishedRoundId);

        // Only stop bonus music when the bonus round itself finishes —
        // an overlapping normal round must not cut off the bonus track.
        if (round.bonusType !== "none") {
          stopBonusMusic();
        }

        if (pendingBonusForRound.has(finishedRoundId)) {
          pendingBonusForRound.delete(finishedRoundId);
        }
      }, 2000);
    }
  };
}
