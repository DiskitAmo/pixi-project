import { useEffect, useRef } from "react";

import * as PIXI from "pixi.js";
import { useAssets } from "../context/AssetContext";
import { usePixiRenderer } from "../context/PixiRendererContext";
import { BONUS_MODE } from "../lib/constants";

import { useMobileDetect } from "./useMobileDetect";

interface UsePooAnimationProps {
  enabled: boolean;
  onFinished: () => void;
}

interface PooOrbitState {
  orbitAngle: number;
  orbitRadius: number;
  spinSpeed: number;
  shrinkSpeed: number;
}

export function usePooAnimation({ enabled, onFinished }: UsePooAnimationProps) {
  const renderer = usePixiRenderer();
  const { poo: pooTexture } = useAssets();
  const { isMobile } = useMobileDetect();

  const pooRef = useRef<PIXI.Sprite | null>(null);
  const orbitStateRef = useRef<PooOrbitState | null>(null);
  const tickerRef = useRef<(() => void) | null>(null);
  const finishedRef = useRef(false);

  // Fires once when the PIXI app becomes available; resize only mutates
  // renderer.maxRadius in-place and does NOT re-trigger this effect.
  const isReady = !!renderer?.app;

  useEffect(() => {
    if (!isReady || !enabled || !pooTexture) return;

    const app = renderer!.app!;
    const particlesContainer = renderer!.bonusObjectsContainer;
    if (!particlesContainer) return;

    finishedRef.current = false;

    // ── Create sprite ────────────────────────────────────────────────────────
    const size = isMobile
      ? BONUS_MODE.POO_SIZE_MOBILE
      : BONUS_MODE.POO_SIZE_DESKTOP;

    const poo = new PIXI.Sprite(pooTexture);
    poo.anchor.set(0.5); // centred — same as normal floaters
    poo.width = size;
    poo.height = size;

    // Read live bowl-centre (differs from screen centre on mobile)
    const initCx = renderer!.centerX || app.screen.width / 2;
    const initCy = renderer!.centerY || app.screen.height / 2;

    // Scale orbit start radius to the actual bowl size so the poo never
    // escapes the toilet rim on any screen. On desktop maxRadius ≈ 208 and
    // 0.85× ≈ 177 (close to the old hardcoded 180). On mobile maxRadius ≈ 222
    // and 0.55× ≈ 122, which fits safely inside the visual inner bowl.
    const bowlRadius = renderer!.maxRadius;
    const orbitStart = isMobile
      ? bowlRadius * 0.55
      : Math.min(bowlRadius * 0.85, BONUS_MODE.POO_ORBIT_RADIUS_START);

    // Place on the orbit circle at a random starting angle
    const startAngle = Math.random() * Math.PI * 2;
    poo.x = initCx + Math.cos(startAngle) * orbitStart;
    poo.y = initCy + Math.sin(startAngle) * orbitStart;

    particlesContainer.addChild(poo);
    pooRef.current = poo;

    // ── Orbit state ──────────────────────────────────────────────────────────
    orbitStateRef.current = {
      orbitAngle: startAngle,
      orbitRadius: orbitStart,
      spinSpeed: BONUS_MODE.POO_ORBIT_SPIN_SPEED,
      shrinkSpeed: BONUS_MODE.POO_ORBIT_SHRINK_SPEED,
    };

    // ── Animate — exact same physics as normal flushable objects ─────────────
    const animate = () => {
      const poo = pooRef.current;
      const state = orbitStateRef.current;
      if (!poo || !state || finishedRef.current) return;

      // Read live bowl-centre every frame so resize keeps poo inside the bowl
      const cx = renderer!.centerX || app.screen.width / 2;
      const cy = renderer!.centerY || app.screen.height / 2;

      state.orbitAngle += state.spinSpeed;
      state.orbitRadius -= state.shrinkSpeed;

      poo.x = cx + Math.cos(state.orbitAngle) * state.orbitRadius;
      poo.y = cy + Math.sin(state.orbitAngle) * state.orbitRadius;
      poo.rotation += BONUS_MODE.POO_ROTATION_PER_FRAME;
      poo.scale.x *= BONUS_MODE.POO_SCALE_DECAY;
      poo.scale.y *= BONUS_MODE.POO_SCALE_DECAY;

      if (state.orbitRadius < BONUS_MODE.POO_FADE_START_RADIUS) {
        poo.alpha -= BONUS_MODE.POO_FADE_STEP;
      }

      if (state.orbitRadius <= BONUS_MODE.POO_FINISH_RADIUS) {
        finishedRef.current = true;
        cleanup();
        onFinished();
      }
    };

    tickerRef.current = animate;
    app.ticker.add(animate);

    const cleanup = () => {
      if (tickerRef.current) {
        app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      if (pooRef.current) {
        particlesContainer.removeChild(pooRef.current);
        pooRef.current.destroy();
        pooRef.current = null;
      }
      orbitStateRef.current = null;
    };

    return cleanup;
  }, [isReady, enabled, pooTexture, isMobile, onFinished]);

  /** Stop animation immediately if the round is cancelled mid-spin */
  useEffect(() => {
    if (!enabled && pooRef.current) {
      const sprite = pooRef.current;
      const particlesContainer = renderer?.bonusObjectsContainer;

      if (particlesContainer) particlesContainer.removeChild(sprite);
      sprite.destroy();
      pooRef.current = null;
      orbitStateRef.current = null;
      finishedRef.current = true;

      if (tickerRef.current && renderer?.app) {
        renderer.app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
    }
  }, [enabled, renderer]);
}
