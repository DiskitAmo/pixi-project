import { useEffect, useRef } from "react";

import * as PIXI from "pixi.js";
import { useAssets } from "../context/AssetContext";
import { usePixiRenderer } from "../context/PixiRendererContext";
import { BONUS_MODE } from "../lib/constants";

import { useMobileDetect } from "./useMobileDetect";

interface UsePhoneAnimationProps {
  enabled: boolean;
  onFinished: () => void;
}

export function usePhoneAnimation({
  enabled,
  onFinished,
}: UsePhoneAnimationProps) {
  const renderer = usePixiRenderer();
  const { phoneInHandFrames, phone: phoneTex } = useAssets();
  const { isMobile } = useMobileDetect();

  const handRef = useRef<PIXI.Sprite | null>(null);
  const phoneRef = useRef<PIXI.Sprite | null>(null);
  const tickerRef = useRef<(() => void) | null>(null);
  const finishedRef = useRef(false);

  // Fires once when the PIXI app becomes available — resize only mutates
  // renderer.maxRadius in-place and does NOT re-trigger this effect.
  const isReady = !!renderer?.app;

  useEffect(() => {
    if (!isReady || !enabled || phoneInHandFrames.length < 3 || !phoneTex)
      return;

    const app = renderer!.app!;
    const particlesContainer = renderer!.particlesContainer;
    if (!particlesContainer) return;

    finishedRef.current = false;

    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;

    // ── Hand sprite (rises from bottom) ───────────────────────────────────────
    const hand = new PIXI.Sprite(phoneInHandFrames[0]);
    hand.anchor.set(0.5, 1); // bottom-centre anchor — slides up cleanly

    const handHeight = app.screen.height * (isMobile ? 0.58 : 0.64);
    const handRatio = phoneInHandFrames[0].width / phoneInHandFrames[0].height;
    hand.height = handHeight;
    hand.width = handHeight * handRatio;

    hand.x = cx;
    const handStartY = app.screen.height + hand.height * 0.1; // spawn point (just off screen)
    const handTargetY = app.screen.height; // resting position — bottom anchor at screen edge
    const handExitY = app.screen.height + handHeight; // fully off screen below
    hand.y = handStartY;

    particlesContainer.addChild(hand);
    handRef.current = hand;

    // ── Phone sprite (hidden until hand fades out) ────────────────────────────
    const phoneSize = isMobile
      ? BONUS_MODE.PHONE_SIZE_MOBILE
      : BONUS_MODE.PHONE_SIZE;
    // Use a base scale so every subsequent scale.set() call stays relative to
    // this size — setting width/height then calling scale.set(1) would silently
    // reset to full native texture size.
    const phoneBaseScale = phoneSize / phoneTex.width;

    const phone = new PIXI.Sprite(phoneTex);
    phone.anchor.set(0.5);
    phone.scale.set(phoneBaseScale);
    phone.x = cx;
    phone.y = handTargetY - handHeight * 0.65;
    phone.alpha = 0;
    phone.visible = false;

    particlesContainer.addChild(phone);
    phoneRef.current = phone;

    // ── Phase timings ─────────────────────────────────────────────────────────
    const ENTRY_MS = 1800; // hand slides up
    const FRAME_MS = 400; // ms per frame — plays 0 → 1 → 2 once
    const HOLD_MS = 350; // hold on last frame before crossfade
    const TRANSITION_MS = 500; // hand slides back off screen / phone fades in

    let phase = "entry";
    let phaseStart = performance.now();
    let frameIdx = 0;
    let lastFrame = phaseStart;
    let framesDone = false; // true when last frame is shown — stops cycling

    // Orbit state (matches poo exactly)
    let orbitAngle = 0;
    let orbitRadius = 0;

    const animate = () => {
      const now = performance.now();

      // ── Advance frames once only: 0 → 1 → 2, then freeze ─────────────────
      if (
        !framesDone &&
        (phase === "entry" || phase === "hold") &&
        now - lastFrame >= FRAME_MS
      ) {
        if (frameIdx < phoneInHandFrames.length - 1) {
          frameIdx++;
          hand.texture = phoneInHandFrames[frameIdx];
          lastFrame = now;
          if (frameIdx === phoneInHandFrames.length - 1) framesDone = true;
        }
      }

      // ── Phase: entry — hand rises from bottom ─────────────────────────────
      if (phase === "entry") {
        const t = Math.min((now - phaseStart) / ENTRY_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
        hand.y = handStartY + (handTargetY - handStartY) * eased;

        if (t >= 1) {
          phase = "hold";
          phaseStart = now;
        }

        // ── Phase: hold — freeze on last frame ────────────────────────────────
      } else if (phase === "hold") {
        if (now - phaseStart >= HOLD_MS) {
          phone.y = hand.y - handHeight * 0.65;
          phone.visible = true;
          phase = "transition";
          phaseStart = now;
        }

        // ── Phase: transition — hand drops off screen, phone fades in ───────────
      } else if (phase === "transition") {
        const t = Math.min((now - phaseStart) / TRANSITION_MS, 1);
        // Cubic ease-in — starts slow then accelerates, like gravity pulling it down
        const slideEased = t * t * t;
        hand.y = handTargetY + (handExitY - handTargetY) * slideEased;
        phone.alpha = t;
        phone.scale.set(phoneBaseScale * (1.03 - 0.03 * t)); // subtle punch

        if (t >= 1) {
          particlesContainer.removeChild(hand);
          hand.destroy();
          handRef.current = null;
          phone.scale.set(phoneBaseScale);
          phone.alpha = 1;

          // Snap phone onto the orbit circle starting from the left-middle
          // of the bowl (π = directly left in standard math coordinates).
          orbitAngle = Math.PI;
          orbitRadius = BONUS_MODE.POO_ORBIT_RADIUS_START;

          phone.x = cx + Math.cos(orbitAngle) * orbitRadius;
          phone.y = cy + Math.sin(orbitAngle) * orbitRadius;

          phase = "orbit";
          phaseStart = now;
        }

        // ── Phase: orbit — same spiral physics as poo, slower spin/rotation ──
      } else if (phase === "orbit") {
        // Read live centre every frame so resize keeps phone inside the bowl
        const liveCx = app.screen.width / 2;
        const liveCy = app.screen.height / 2;

        orbitAngle += BONUS_MODE.PHONE_ORBIT_SPIN_SPEED; // slower than poo
        orbitRadius -= BONUS_MODE.POO_ORBIT_SHRINK_SPEED; // same shrink rate

        phone.x = liveCx + Math.cos(orbitAngle) * orbitRadius;
        phone.y = liveCy + Math.sin(orbitAngle) * orbitRadius;

        phone.rotation += BONUS_MODE.PHONE_ORBIT_ROTATION_PER_FRAME; // slower than poo
        phone.scale.x *= BONUS_MODE.POO_SCALE_DECAY;
        phone.scale.y *= BONUS_MODE.POO_SCALE_DECAY;

        if (orbitRadius < BONUS_MODE.POO_FADE_START_RADIUS) {
          phone.alpha -= BONUS_MODE.POO_FADE_STEP;
        }

        if (orbitRadius <= BONUS_MODE.POO_FINISH_RADIUS) {
          finishedRef.current = true;
          cleanup();
          onFinished();
        }
      }
    };

    tickerRef.current = animate;
    app.ticker.add(animate);

    function cleanup() {
      if (tickerRef.current) {
        app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      if (handRef.current) {
        particlesContainer?.removeChild(handRef.current);
        handRef.current.destroy();
        handRef.current = null;
      }
      if (phoneRef.current) {
        particlesContainer?.removeChild(phoneRef.current);
        phoneRef.current.destroy();
        phoneRef.current = null;
      }
    }

    return cleanup;
  }, [isReady, enabled, phoneInHandFrames, phoneTex, isMobile, onFinished]);

  // Force-kill if the round is cancelled mid-animation
  useEffect(() => {
    if (!enabled) {
      const particlesContainer = renderer?.particlesContainer;

      if (handRef.current) {
        if (particlesContainer) particlesContainer.removeChild(handRef.current);
        handRef.current.destroy();
        handRef.current = null;
      }
      if (phoneRef.current) {
        if (particlesContainer)
          particlesContainer.removeChild(phoneRef.current);
        phoneRef.current.destroy();
        phoneRef.current = null;
      }

      finishedRef.current = true;

      if (tickerRef.current && renderer?.app) {
        renderer.app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
    }
  }, [enabled, renderer]);
}
