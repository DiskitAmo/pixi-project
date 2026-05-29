import { useEffect, useRef } from "react";

import * as PIXI from "pixi.js";
import { Assets } from "pixi.js";

import { usePixiRenderer } from "../context/PixiRendererContext";
import { ASSETS, BONUS_MODE } from "../lib/constants";
import { useFlushStore } from "../store/useRoyalFlushStore";
import { useMobileDetect } from "./useMobileDetect";

// ─── Timing ──────────────────────────────────────────────────────────────────
const ENTRY_MS   = 600;
const SWING_MS   = 7500;
const SUCCESS_MS = 2500;
const EXIT_MS    = 600;

interface SwingState {
  angle:     number;
  flowAngle: number;
}

interface UsePlungerAnimationProps {
  enabled:    boolean;
  onFinished: () => void;
}

export function usePlungerAnimation({
  enabled,
  onFinished,
}: UsePlungerAnimationProps) {
  const renderer     = usePixiRenderer();
  const { isMobile } = useMobileDetect();

  const spriteRef   = useRef<PIXI.Sprite | null>(null);
  const tickerRef   = useRef<(() => void) | null>(null);
  const finishedRef = useRef(false);
  const swingRef    = useRef<SwingState | null>(null);

  const isReady = !!renderer?.app;

  useEffect(() => {
    if (!isReady || !enabled) return;

    const app       = renderer!.app!;
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

    // ── Size ─────────────────────────────────────────────────────────────────
    const screenH  = app.screen.height;
    const screenW  = app.screen.width;
    // Fill most of the screen height so the plunger looks large and imposing
    const plungerH = isMobile ? screenH * 0.75 : screenH * 0.9;
    const plungerW = plungerH * (plungerTex.width / plungerTex.height);

    // Anchor at bottom-centre so the handle tip is the rotation pivot
    const sprite = new PIXI.Sprite(plungerTex);
    sprite.anchor.set(0.5, 1);
    sprite.width  = plungerW;
    sprite.height = plungerH;

    // Start off-screen below
    sprite.x     = renderer!.centerX || screenW / 2;
    sprite.y     = screenH + plungerH;
    sprite.alpha = 0;
    container.addChild(sprite);
    spriteRef.current = sprite;

    useFlushStore.getState().setWaterSpinPaused(true);

    // ── Phase state ───────────────────────────────────────────────────────────
    type Phase = "entry" | "swing" | "success" | "exit";
    let phase: Phase  = "entry";
    let phaseStart    = performance.now();
    const entryFromY  = sprite.y;

    // Pivot Y — slightly below canvas bottom so the handle appears rooted there
    const PIVOT_Y = screenH * 1.1;

    // ── Ticker ────────────────────────────────────────────────────────────────
    const tick = () => {
      if (finishedRef.current) return;

      const now     = performance.now();
      const elapsed = now - phaseStart;

      const cx = renderer!.centerX || app.screen.width / 2;
      const cy = renderer!.centerY  || app.screen.height / 2;

      // ── Entry: slide up ──────────────────────────────────────────────────
      if (phase === "entry") {
        const t     = Math.min(elapsed / ENTRY_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        sprite.x        = cx;
        sprite.y        = entryFromY + (PIVOT_Y - entryFromY) * eased;
        sprite.alpha    = t;
        sprite.rotation = 0;

        if (t >= 1) {
          swingRef.current = { angle: 0, flowAngle: 0 };
          phase      = "swing";
          phaseStart = now;
        }

      // ── Swing: pee-stream style (rotation + height variation) ────────────
      } else if (phase === "swing") {
        const s = swingRef.current!;

        s.angle     += BONUS_MODE.PLUNGER_SWING_SPEED;
        s.flowAngle += 0.025;

        const swingProgress = elapsed / SWING_MS;
        const decay         = 1 - swingProgress * 0.6; // settle toward the end

        // Height variation  — bobs the rubber-cup up/down through the bowl
        const heightVar = 0.15 + Math.sin(s.angle * 0.7) * 0.1;
        const dynH      = plungerH * (1 + Math.sin(s.angle * 1.5) * heightVar);

        // Pivot locked at PIVOT_Y — only rotation changes, no x drift
        sprite.x        = cx;
        sprite.y        = PIVOT_Y;
        sprite.height   = dynH;
        sprite.rotation =
          Math.sin(s.angle) * BONUS_MODE.PLUNGER_SWING_AMPLITUDE * decay +
          Math.sin(s.flowAngle * 2) * 0.04 * decay; // small wobble
        sprite.alpha    = 1;

        // Transition when time is up AND plunger is near vertical (cup over drain)
        const nearCentre = Math.abs(Math.sin(s.angle)) < 0.15;
        if (elapsed >= SWING_MS && nearCentre) {
          // Swap to success image — anchor at bottom so it touches screen bottom
          sprite.anchor.set(0.5, 1);
          sprite.rotation = 0;

          if (successTex) {
            sprite.texture = successTex;
            // Fill the same height as the swinging plunger
            sprite.width  = plungerH * (successTex.width / successTex.height);
            sprite.height = plungerH;
          }

          sprite.x = cx;
          sprite.y = app.screen.height + plungerH * 0.12;   // shifted slightly below screen bottom
          sprite.alpha = 1;

          useFlushStore.getState().setWaterSpinPaused(false);

          phase      = "success";
          phaseStart = now;
        }

      // ── Success ──────────────────────────────────────────────────────────
      } else if (phase === "success") {
        sprite.x = cx;
        sprite.y = app.screen.height + plungerH * 0.12;   // shifted slightly below screen bottom

        if (elapsed >= SUCCESS_MS) {
          phase      = "exit";
          phaseStart = now;
        }

      // ── Exit: slide back down ────────────────────────────────────────────
      } else if (phase === "exit") {
        const t     = Math.min(elapsed / EXIT_MS, 1);
        const eased = t * t;
        const startY = app.screen.height;
        const endY   = app.screen.height + plungerH;

        sprite.x     = cx;
        sprite.y     = startY + (endY - startY) * eased;
        sprite.alpha = 1 - t;

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
      swingRef.current    = null;
      if (tickerRef.current && renderer?.app) {
        renderer.app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      useFlushStore.getState().setWaterSpinPaused(false);
    }
  }, [enabled, renderer]);
}
