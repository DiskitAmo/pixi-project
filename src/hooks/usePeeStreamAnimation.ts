import { useEffect, useRef } from "react";

import * as PIXI from "pixi.js";
import { useAssets } from "../context/AssetContext";
import { usePixiRenderer } from "../context/PixiRendererContext";
import { BONUS_MODE } from "../lib/constants";

import { useMobileDetect } from "./useMobileDetect";

interface UsePeeStreamAnimationProps {
  enabled: boolean;
  onFinished: () => void;
}

interface PeeAnimationState {
  angle: number;
  flowAngle: number;
  swingSpeed: number;
  swingAmplitude: number;
  flowWobble: number;
  directionBias: number;
  baseHeight: number;
  animationStartTime: number;
}

export function usePeeStreamAnimation({
  enabled,
  onFinished,
}: UsePeeStreamAnimationProps) {
  const renderer = usePixiRenderer();
  const { peeStreams: peeStreamTextures } = useAssets();
  const { isMobile } = useMobileDetect();

  const peeStreamRef = useRef<PIXI.Sprite | null>(null);
  const animationStateRef = useRef<PeeAnimationState | null>(null);
  const tickerRef = useRef<(() => void) | null>(null);
  const finishedRef = useRef(false);

  // "isReady" changes exactly once (null → app instance) so the effect starts
  // when the PIXI app becomes available. Subsequent resize calls only mutate
  // renderer.maxRadius in-place and do NOT re-trigger this effect.
  const isReady = !!renderer?.app;

  useEffect(() => {
    if (!isReady || !enabled || peeStreamTextures.length === 0) return;

    // renderer is the stable context object; read its properties at effect-start
    // and via the closure inside animate for the latest maxRadius on each frame.
    const app = renderer!.app!;
    const particlesContainer = renderer!.particlesContainer;

    if (!particlesContainer) return;

    // centerX/centerY come from the renderer context which is mutated in-place
    // on every resize — read them live inside animate() rather than capturing
    // a stale snapshot here.
    const screenHeight = app.screen.height;

    const minAnimationDuration = BONUS_MODE.PEE_STREAM_DURATION;

    finishedRef.current = false;

    /** Create sprite - size based on screen type */
    const isSmallDesktop = !isMobile && screenHeight < 700;
    const size = isMobile
      ? BONUS_MODE.PEE_STREAM_SIZE_MOBILE
      : isSmallDesktop
        ? BONUS_MODE.PEE_STREAM_SIZE_SMALL_DESKTOP
        : BONUS_MODE.PEE_STREAM_SIZE;

    const stream = new PIXI.Sprite(peeStreamTextures[0]);

    stream.anchor.set(0.5, 0.8);
    stream.width = size;
    stream.height = size * 2.2;

    particlesContainer.addChild(stream);
    peeStreamRef.current = stream;

    /** Init animation state */
    // maxRadius / centerX / centerY are read live inside animate() every frame
    const initMaxRadius = renderer!.maxRadius;
    animationStateRef.current = {
      angle: Math.random() * Math.PI * 2,
      flowAngle: Math.random() * Math.PI * 2,
      swingSpeed: 0.02 + Math.random() * 0.01,
      swingAmplitude: initMaxRadius * (0.35 + Math.random() * 0.15),
      flowWobble: 0.03 + Math.random() * 0.015,
      directionBias: (Math.random() - 0.5) * 0.6,
      baseHeight: stream.height,
      animationStartTime: Date.now(),
    };

    const animate = () => {
      const stream = peeStreamRef.current;
      const state = animationStateRef.current;

      if (!stream || !state || finishedRef.current) return;

      // Read live values every frame so resize updates are reflected immediately
      const maxRadius = renderer!.maxRadius;
      const centerX = renderer!.centerX || app.screen.width / 2;
      const centerY = renderer!.centerY || app.screen.height / 2;
      const bottomEdge = centerY + maxRadius * 0.75;

      const elapsed = Date.now() - state.animationStartTime;
      const progress = Math.min(elapsed / minAnimationDuration, 1);

      state.angle += state.swingSpeed;
      state.flowAngle += state.flowWobble;

      /** Gradually reduce swing so it converges to center */
      const swingDecay = 1 - progress;

      const heightVariationAmount = 0.275 + Math.sin(state.angle * 0.7) * 0.125;

      const dynamicHeight =
        state.baseHeight *
        (1 + Math.sin(state.angle * 1.5) * heightVariationAmount);

      const horizontalSwing =
        (Math.sin(state.angle) * state.swingAmplitude +
          state.directionBias * state.swingAmplitude * 0.5) *
        swingDecay;

      const wobbleX = Math.sin(state.flowAngle * 1.5) * 10 * swingDecay;

      const x = centerX + horizontalSwing + wobbleX;
      const y = bottomEdge;

      stream.x = x;
      stream.y = y;
      stream.height = dynamicHeight;

      stream.rotation =
        Math.sin(state.angle) * 0.18 * swingDecay +
        Math.sin(state.flowAngle) * 0.08 * swingDecay;

      /** Frame animation */
      const frameIndex =
        Math.floor(Date.now() / BONUS_MODE.PEE_STREAM_FRAME_DURATION) % 3;

      stream.texture = peeStreamTextures[frameIndex];

      /** Force finish after ~2 seconds */
      if (progress >= 1) {
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

      if (peeStreamRef.current) {
        particlesContainer.removeChild(peeStreamRef.current);
        peeStreamRef.current.destroy();
        peeStreamRef.current = null;
      }

      animationStateRef.current = null;
    };

    return cleanup;
  }, [isReady, enabled, peeStreamTextures, isMobile, onFinished]);

  /** Stop animation immediately if disabled mid-run */
  useEffect(() => {
    if (!enabled && peeStreamRef.current) {
      const sprite = peeStreamRef.current;
      const particlesContainer = renderer?.particlesContainer;

      if (particlesContainer) {
        particlesContainer.removeChild(sprite);
      }

      sprite.destroy();
      peeStreamRef.current = null;
      animationStateRef.current = null;
      finishedRef.current = true;

      if (tickerRef.current && renderer?.app) {
        renderer.app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
    }
  }, [enabled, renderer]);
}
