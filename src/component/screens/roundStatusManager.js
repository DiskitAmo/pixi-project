import { Sprite } from "pixi.js";
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
 * @param {{ isLocked: boolean }}           ctx.lockState        - shared mutable lock flag
 * @param {() => { x: number, y: number }}  ctx.getCenter        - returns live center coords
 * @param {(id: string) => void}           [ctx.onRoundComplete] - called after full cleanup
 * @param {(id: string) => boolean}        [ctx.isAutoplayRound] - true when id is from autoplay
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
  onRoundComplete,
  isAutoplayRound,
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
        // PEE BONUS: animation is handled by the usePeeStreamAnimation React hook
        // (PeeStreamOverlay component). Place a plain sentinel here so the
        // COMPLETED phase can still trigger winner-zoom and round cleanup.
        obj = { isPeeBonus: true, isBonusHandled: false, isCompletedHandled: false };
      } else if (pendingBonus === "poo") {
        // POO BONUS: animation is handled by the usePooAnimation React hook
        // (PooStreamOverlay component). Same sentinel pattern as pee.
        obj = { isPooBonus: true, isBonusHandled: false, isCompletedHandled: false };
      } else {
        // NORMAL / BONUS (phone, plunger): orbiting sprite
        obj = Sprite.from(round.texture);
        obj.anchor.set(0.5);
        obj.orbitAngle = Math.random() * Math.PI * 2;
        obj.orbitRadius = 180;
        obj.spinSpeed = 0.02;
        obj.shrinkSpeed = 0.4;
        obj.x = centerX + Math.cos(obj.orbitAngle) * obj.orbitRadius;
        obj.y = centerY + Math.sin(obj.orbitAngle) * obj.orbitRadius;

        container.addChild(obj);
      }

      activeSprites.set(round.roundId, obj);
    }

    // ─── SPINNING → animate towards center ────────────────────────────────────

    if (round.status === "spinning") {
      const obj = activeSprites.get(round.roundId);
      if (!obj) return;

      if (obj.isPeeBonus || obj.isPooBonus) {
        // Animation + triggerBonus timing are fully managed by the React hook overlay.
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

      if (obj.isPeeBonus || obj.isPooBonus) {
        // Hook already cleaned up the PIXI sprite when enabled → false.
        // Just advance the round after a brief hold.
        setTimeout(() => {
          useFlushStore.getState().completeRound(round.roundId);
        }, 1500);
        return;
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

      // pee/poo sentinels have no PIXI sprite — skip property mutations that
      // only apply to real Sprite objects.
      if (!obj.isPeeBonus && !obj.isPooBonus) {
        obj.rotation = 0;
      }

      lockState.isLocked = true;
      multiplierUI.update(round.multiplier);

      // Show winner zoom only for bonus rounds, and never for concurrent autoplay rounds
      const fromAutoplay = isAutoplayRound
        ? isAutoplayRound(round.roundId)
        : false;
      if (round.bonusType !== "none" && !fromAutoplay) {
        // Hide the multiplier circle so it doesn't show through the winner overlay
        multiplierUI.container.visible = false;
        showWinnerZoom(round.multiplier, round.betAmount, centerX, centerY);
        sound.play("winSound", { volume: 0.8, singleInstance: true });
      }

      sound.stop("flushSound");
      sound.play("hitsound");
      createSprinkleEffect(
        centerX,
        centerY,
        getParticleColor(round.multiplier),
      );

      const finishedRoundId = round.roundId;
      setTimeout(() => {
        lockState.isLocked = false;

        // Restore multiplier visibility and reset bonus water only after winner zoom is gone
        multiplierUI.container.visible = true;
        if (round.bonusType !== "none") {
          water.texture = defaultWaterTex;
          stopBonusMusic();
        }

        // Only remove from the PIXI container if this was a real sprite
        if (!obj.isPeeBonus && !obj.isPooBonus) {
          container.removeChild(obj);
        }

        activeSprites.delete(finishedRoundId);
        useFlushStore.getState().removeRound(finishedRoundId);

        if (pendingBonusForRound.has(finishedRoundId)) {
          pendingBonusForRound.delete(finishedRoundId);
        }

        // Notify autoplay tracker that this round is fully done
        if (onRoundComplete) onRoundComplete(finishedRoundId);
      }, 2000);
    }
  };
}
