import { useEffect, useRef } from "react";

import * as PIXI from "pixi.js";
import { Assets } from "pixi.js";

import { usePixiRenderer } from "../context/PixiRendererContext";
import { ASSETS, BONUS_MODE } from "../lib/constants";
import { useFlushStore } from "../store/useRoyalFlushStore";
import { useMobileDetect } from "./useMobileDetect";

// ─── Timing
const ENTRY_MS = 600;
const SWING_MS = 12000;
const SUCCESS_MS = 2500;
const EXIT_MS = 600;

interface SwingState {
  angle: number;
  flowAngle: number;
}

interface UsePlungerAnimationProps {
  enabled: boolean;
  onFinished: () => void;
}

export function usePlungerAnimation({
  enabled,
  onFinished,
}: UsePlungerAnimationProps) {
  const renderer = usePixiRenderer();
  const { isMobile } = useMobileDetect();

  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const tickerRef = useRef<(() => void) | null>(null);
  const finishedRef = useRef(false);
  const swingRef = useRef<SwingState | null>(null);

  const isReady = !!renderer?.app;

  useEffect(() => {
    if (!isReady || !enabled) return;

    const app = renderer!.app!;
    const container = renderer!.particlesContainer;
    if (!container) return;

    const plungerTex: PIXI.Texture | undefined = Assets.get(ASSETS.PLUNGER);
    if (!plungerTex) return;

    // Pre-fetch success texture early
    let successTex: PIXI.Texture | null =
      Assets.get(ASSETS.PLUNGER_SUCCESS) ?? null;
    if (!successTex) {
      Assets.load(ASSETS.PLUNGER_SUCCESS).then((t) => {
        successTex = t ?? null;
      });
    }

    finishedRef.current = false;

    // ── Size
    const screenH = app.screen.height;
    const screenW = app.screen.width;
    const cy = renderer!.centerY || screenH / 2;
    const maxRadius = renderer!.maxRadius || 200;

    // On mobile the toilet bowl occupies only the upper portion of the canvas.
    // Anchor pivot and cup target relative to the actual bowl position so the
    // plunger enters from just below the bowl, not the full screen bottom.
    const cupTargetY = isMobile ? cy - maxRadius * 0.6 : screenH * 0.1;
    const PIVOT_Y_INIT = isMobile ? cy + maxRadius * 1.3 : screenH * 1.5;
    const plungerH = PIVOT_Y_INIT - cupTargetY;
    const naturalW = plungerH * (plungerTex.width / plungerTex.height);
    // Cap width so the cup stays inside the toilet seat
    const maxW = screenW * (isMobile ? 0.55 : 0.45);
    const plungerW = Math.min(naturalW, maxW);

    // Anchor at bottom-centre so the handle tip is the rotation pivot
    const sprite = new PIXI.Sprite(plungerTex);
    sprite.anchor.set(0.5, 1);
    sprite.width = plungerW;
    sprite.height = plungerH;

    // Start off-screen — on mobile start just below the bowl, on desktop below the full screen
    const entryStartY = isMobile ? cy + maxRadius * 2.5 : screenH + plungerH;
    sprite.x = renderer!.centerX || screenW / 2;
    sprite.y = entryStartY;
    sprite.alpha = 0;
    container.addChild(sprite);
    spriteRef.current = sprite;

    useFlushStore.getState().setWaterSpinPaused(true);

    // ── Phase state
    type Phase = "entry" | "swing" | "success" | "exit";
    let phase: Phase = "entry";
    let phaseStart = performance.now();
    const entryFromY = sprite.y;

    const PIVOT_Y = PIVOT_Y_INIT;

    // ── Ticker
    const tick = () => {
      if (finishedRef.current) return;

      const now = performance.now();
      const elapsed = now - phaseStart;

      const cx = renderer!.centerX || app.screen.width / 2;

      // ── Entry: slide up
      if (phase === "entry") {
        const t = Math.min(elapsed / ENTRY_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        sprite.x = cx;
        sprite.y = entryFromY + (PIVOT_Y - entryFromY) * eased;
        sprite.alpha = t;
        sprite.rotation = 0;

        if (t >= 1) {
          swingRef.current = { angle: 0, flowAngle: 0 };
          phase = "swing";
          phaseStart = now;
        }

        // ── Swing: pee-stream style (rotation + height variation)
      } else if (phase === "swing") {
        const s = swingRef.current!;

        s.angle += BONUS_MODE.PLUNGER_SWING_SPEED;
        s.flowAngle += 0.025;

        const swingProgress = elapsed / SWING_MS;
        const decay = 1 - swingProgress * 0.6; // settle toward the end

        // Height variation  — bobs the rubber-cup up/down through the bowl
        const heightVar = 0.15 + Math.sin(s.angle * 0.7) * 0.1;
        const dynH = plungerH * (1 + Math.sin(s.angle * 1.5) * heightVar);

        // Pivot locked at PIVOT_Y — only rotation changes, no x drift
        sprite.x = cx;
        sprite.y = PIVOT_Y;
        sprite.height = dynH;
        sprite.rotation =
          Math.sin(s.angle) * BONUS_MODE.PLUNGER_SWING_AMPLITUDE * decay +
          Math.sin(s.flowAngle * 2) * 0.04 * decay; // small wobble
        sprite.alpha = 1;

        // Transition when time is up AND plunger is near vertical (cup over drain)
        const nearCentre = Math.abs(Math.sin(s.angle)) < 0.15;
        if (elapsed >= SWING_MS && nearCentre) {
          // Swap to success image — anchor at bottom so it touches screen bottom
          sprite.anchor.set(0.5, 1);
          sprite.rotation = 0;

          if (successTex) {
            sprite.texture = successTex;
            // Fill the same height as the swinging plunger
            sprite.width = plungerH * (successTex.width / successTex.height);
            sprite.height = plungerH;
          }

          sprite.x = cx;
          sprite.y = PIVOT_Y;
          sprite.alpha = 1;

          useFlushStore.getState().setWaterSpinPaused(false);

          phase = "success";
          phaseStart = now;
        }

        // ── Success
      } else if (phase === "success") {
        sprite.x = cx;
        sprite.y = PIVOT_Y;

        if (elapsed >= SUCCESS_MS) {
          // Multiplier circle radius matches multiplier.js values
          const multRadius = isMobile ? 65 : 110;
          // Cup lands exactly at the top edge of the multiplier circle
          const cupTargetExitY = cy - multRadius;
          sprite.texture = plungerTex;
          sprite.width = plungerH * (plungerTex.width / plungerTex.height);
          sprite.height = plungerH;
          sprite.anchor.set(0.5, 1);
          sprite.x = cx;
          sprite.y = cupTargetExitY + plungerH;
          phase = "exit";
          phaseStart = now;
        }

        // ── Exit: slide back down
      } else if (phase === "exit") {
        const t = Math.min(elapsed / EXIT_MS, 1);
        const eased = t * t;
        const multRadius = isMobile ? 65 : 110;
        const startY = cy - multRadius + plungerH;
        const endY = isMobile
          ? cy + maxRadius * 2.5 + plungerH
          : app.screen.height + plungerH;

        sprite.x = cx;
        sprite.y = startY + (endY - startY) * eased;
        sprite.alpha = 1;

        if (t >= 1) {
          finishedRef.current = true;
          cleanup();
          onFinished();
        }
      }
    };

    tickerRef.current = tick;
    app.ticker.add(tick);

    function cleanup() {
      if (tickerRef.current) {
        app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      if (spriteRef.current) {
        container?.removeChild(spriteRef.current);
        spriteRef.current.destroy();
        spriteRef.current = null;
      }
      swingRef.current = null;
      useFlushStore.getState().setWaterSpinPaused(false);
    }

    return cleanup;
  }, [isReady, enabled, isMobile, onFinished]);

  useEffect(() => {
    if (!enabled) {
      const c = renderer?.particlesContainer;
      if (spriteRef.current) {
        c?.removeChild(spriteRef.current);
        spriteRef.current.destroy();
        spriteRef.current = null;
      }
      finishedRef.current = true;
      swingRef.current = null;
      if (tickerRef.current && renderer?.app) {
        renderer.app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      useFlushStore.getState().setWaterSpinPaused(false);
    }
  }, [enabled, renderer]);
}
