import { useCallback, useEffect } from "react";
import { useFlushStore } from "../store/useRoyalFlushStore";

const BASE_WIDTH = 400;
const BASE_HEIGHT = 700;
const MIN_ZOOM = 0.35;

function applyScale() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  // On desktop use window.innerWidth/innerHeight — they update synchronously
  // with resize and focus events, including when DevTools is closed.
  //
  // On mobile use window.visualViewport (when available) because the iOS
  // on-screen keyboard shrinks the visual viewport without changing innerHeight,
  // which would otherwise let the keyboard overlap the game.
  const isMobileViewport = window.innerWidth < 768;
  const vp = window.visualViewport;
  const w = isMobileViewport && vp ? vp.width : window.innerWidth;
  const h = isMobileViewport && vp ? vp.height : window.innerHeight;

  const zoom = parseFloat(
    Math.min(
      1,
      Math.max(MIN_ZOOM, Math.min(w / BASE_WIDTH, h / BASE_HEIGHT)),
    ).toFixed(2),
  );

  if (zoom < 1) {
    // Small viewport: expand #app to the base logical size and scale it down.
    const inv = 1 / zoom;
    appEl.style.width = `${Math.round(w * inv)}px`;
    appEl.style.height = `${Math.round(h * inv)}px`;
    appEl.style.transform = `scale(${zoom})`;
    appEl.style.transformOrigin = "0 0";
  } else {
    // Desktop / large viewport: clear every inline override so the CSS
    // width:100vw / height:100vh always reflects the live viewport size.
    // Setting explicit pixel values here caused #app to get stuck at a
    // stale DevTools-open width because Chrome doesn't reliably fire a
    // window resize event when the DevTools panel is dismissed.
    appEl.style.width = "";
    appEl.style.height = "";
    appEl.style.transform = "";
    appEl.style.transformOrigin = "";
  }

  // PixiJS's resizeTo ResizeObserver doesn't reliably fire when we switch
  // between inline px values and CSS 100vw/100vh (e.g. DevTools open→close).
  // Explicitly telling PixiJS to re-measure #app here guarantees the canvas
  // always matches the dimensions we just applied.
  const pixiApp = useFlushStore.getState().rendererState.app;
  if (pixiApp) pixiApp.resize();
}

export function useGameScale() {
  const updateGameScale = useCallback(() => {
    requestAnimationFrame(applyScale);
  }, []);

  useEffect(() => {
    requestAnimationFrame(applyScale);

    // Primary: browser window resize
    window.addEventListener("resize", updateGameScale);

    // Mobile: on-screen keyboard / pinch-zoom
    window.visualViewport?.addEventListener("resize", updateGameScale);

    // Focus fallback: closing DevTools returns focus to the page
    window.addEventListener("focus", updateGameScale);

    // Most reliable fallback: observe the root <html> element.
    // Its rendered size tracks the viewport exactly (it IS the initial
    // containing block). ResizeObserver fires when the viewport changes —
    // including DevTools open/close — even when window.resize doesn't.
    // This also re-triggers PixiJS's own ResizeObserver on #app by causing
    // applyScale to run and update #app's size when zoom < 1.
    const ro = new ResizeObserver(updateGameScale);
    ro.observe(document.documentElement);

    return () => {
      window.removeEventListener("resize", updateGameScale);
      window.visualViewport?.removeEventListener("resize", updateGameScale);
      window.removeEventListener("focus", updateGameScale);
      ro.disconnect();
    };
  }, [updateGameScale]);
}
