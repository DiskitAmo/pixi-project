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

/**
 * Orbit-only phase of the phone bonus animation.
 *
 * The hand-in-hand entry sequence is handled by <PhoneInHandOverlay> (HTML/CSS).
 * This hook picks up exactly where that component leaves off: it places the phone
 * sprite at the left-middle of the bowl and spirals it into the drain.
 */
export function usePhoneAnimation({
  enabled,
  onFinished,
}: UsePhoneAnimationProps) {
  const renderer = usePixiRenderer();
  const { phone: phoneTex } = useAssets();
  const { isMobile } = useMobileDetect();

  const phoneRef = useRef<PIXI.Sprite | null>(null);
  const tickerRef = useRef<(() => void) | null>(null);
  const finishedRef = useRef(false);

  const isReady = !!renderer?.app;

  useEffect(() => {
    if (!isReady || !enabled || !phoneTex) return;

    const app = renderer!.app!;
    const particlesContainer = renderer!.bonusObjectsContainer;
    if (!particlesContainer) return;

    finishedRef.current = false;

    // Read live bowl-centre (differs from screen centre on mobile)
    const cx = renderer!.centerX || app.screen.width / 2;
    const cy = renderer!.centerY || app.screen.height / 2;

    // ── Phone sprite — starts at the left-middle of the bowl ─────────────────
    const phoneSize = isMobile
      ? BONUS_MODE.PHONE_SIZE_MOBILE
      : BONUS_MODE.PHONE_SIZE;
    const phoneBaseScale = phoneSize / phoneTex.width;

    const phone = new PIXI.Sprite(phoneTex);
    phone.anchor.set(0.5);
    phone.scale.set(phoneBaseScale);
    phone.alpha = 1;

    // Scale orbit start to bowl size — same logic as poo so phone never
    // escapes the toilet rim on mobile (maxRadius ≈ 222 → 0.55× ≈ 122px).
    const bowlRadius = renderer!.maxRadius;
    let orbitAngle = Math.PI; // left-middle of bowl
    let orbitRadius = isMobile
      ? bowlRadius * 0.55
      : Math.min(bowlRadius * 0.85, BONUS_MODE.POO_ORBIT_RADIUS_START);

    phone.x = cx + Math.cos(orbitAngle) * orbitRadius;
    phone.y = cy + Math.sin(orbitAngle) * orbitRadius;

    particlesContainer.addChild(phone);
    phoneRef.current = phone;

    // ── Orbit — same spiral physics as poo, slower spin / rotation ───────────
    const animate = () => {
      // Read live bowl-centre every frame so resize stays in sync
      const liveCx = renderer!.centerX || app.screen.width / 2;
      const liveCy = renderer!.centerY || app.screen.height / 2;

      orbitAngle += BONUS_MODE.PHONE_ORBIT_SPIN_SPEED;
      orbitRadius -= BONUS_MODE.POO_ORBIT_SHRINK_SPEED;

      phone.x = liveCx + Math.cos(orbitAngle) * orbitRadius;
      phone.y = liveCy + Math.sin(orbitAngle) * orbitRadius;

      phone.rotation += BONUS_MODE.PHONE_ORBIT_ROTATION_PER_FRAME;
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
    };

    tickerRef.current = animate;
    app.ticker.add(animate);

    function cleanup() {
      if (tickerRef.current) {
        app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      if (phoneRef.current) {
        particlesContainer?.removeChild(phoneRef.current);
        phoneRef.current.destroy();
        phoneRef.current = null;
      }
    }

    return cleanup;
  }, [isReady, enabled, phoneTex, isMobile, onFinished]);

  // Force-kill if the round is cancelled mid-animation
  useEffect(() => {
    if (!enabled) {
      const particlesContainer = renderer?.bonusObjectsContainer;

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
