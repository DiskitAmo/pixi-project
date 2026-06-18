import { useCallback, useEffect } from "react";

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
const MIN_ZOOM = 0.35;

function applyScale() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  const isMobileViewport = window.innerWidth < 768;
  const vp = window.visualViewport;
  const w = isMobileViewport && vp ? vp.width : window.innerWidth;
  const h = isMobileViewport && vp ? vp.height : window.innerHeight;

  const zoom = parseFloat(
    Math.min(1, Math.max(MIN_ZOOM, Math.min(w / BASE_WIDTH, h / BASE_HEIGHT))).toFixed(2),
  );

  if (zoom < 1) {
    const inv = 1 / zoom;
    appEl.style.width = `${Math.round(w * inv)}px`;
    appEl.style.height = `${Math.round(h * inv)}px`;
    appEl.style.transform = `scale(${zoom})`;
    appEl.style.transformOrigin = "0 0";
  } else {
    appEl.style.width = "";
    appEl.style.height = "";
    appEl.style.transform = "";
    appEl.style.transformOrigin = "";
  }

  // Tell Pixi to re-measure #app — avoids dispatching resize (infinite loop)
  const pixiApp = (window as any).__pixiApp;
  if (pixiApp) pixiApp.resize();
}

export function useGameScale() {
  const updateGameScale = useCallback(() => {
    requestAnimationFrame(applyScale);
  }, []);

  useEffect(() => {
    requestAnimationFrame(applyScale);

    window.addEventListener("resize", updateGameScale);
    window.visualViewport?.addEventListener("resize", updateGameScale);
    window.addEventListener("focus", updateGameScale);

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
