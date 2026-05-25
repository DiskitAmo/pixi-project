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
    const particlesContainer = renderer!.particlesContainer;
    if (!particlesContainer) return;

    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;

    finishedRef.current = false;

    // ── Create sprite ────────────────────────────────────────────────────────
    const size = isMobile
      ? BONUS_MODE.POO_SIZE_MOBILE
      : BONUS_MODE.POO_SIZE_DESKTOP;

    const poo = new PIXI.Sprite(pooTexture);
    poo.anchor.set(0.5); // centred — same as normal floaters
    poo.width = size;
    poo.height = size;

    // Place on the orbit circle at a random starting angle
    const startAngle = Math.random() * Math.PI * 2;
    poo.x = centerX + Math.cos(startAngle) * BONUS_MODE.POO_ORBIT_RADIUS_START;
    poo.y = centerY + Math.sin(startAngle) * BONUS_MODE.POO_ORBIT_RADIUS_START;

    particlesContainer.addChild(poo);
    pooRef.current = poo;

    // ── Orbit state ──────────────────────────────────────────────────────────
    orbitStateRef.current = {
      orbitAngle: startAngle,
      orbitRadius: BONUS_MODE.POO_ORBIT_RADIUS_START,
      spinSpeed: BONUS_MODE.POO_ORBIT_SPIN_SPEED,
      shrinkSpeed: BONUS_MODE.POO_ORBIT_SHRINK_SPEED,
    };

    // ── Animate — exact same physics as normal flushable objects ─────────────
    const animate = () => {
      const poo = pooRef.current;
      const state = orbitStateRef.current;
      if (!poo || !state || finishedRef.current) return;

      // Read live center so resize doesn't break positioning
      const cx = app.screen.width / 2;
      const cy = app.screen.height / 2;

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
      const particlesContainer = renderer?.particlesContainer;

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
