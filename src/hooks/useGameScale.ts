import { useCallback, useEffect } from "react";

const BASE_WIDTH = 400;
const BASE_HEIGHT = 700;
const MIN_ZOOM = 0.35;

function applyScale() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  const vp = window.visualViewport;
  const w = vp ? vp.width : window.innerWidth;
  const h = vp ? vp.height : window.innerHeight;

  const zoom = parseFloat(
    Math.min(1, Math.max(MIN_ZOOM, Math.min(w / BASE_WIDTH, h / BASE_HEIGHT))).toFixed(2),
  );
  const inv = 1 / zoom;

  if (zoom < 1) {
    appEl.style.width = `${Math.round(w * inv)}px`;
    appEl.style.height = `${Math.round(h * inv)}px`;
    appEl.style.transform = `scale(${zoom})`;
    appEl.style.transformOrigin = "0 0";
  } else {
    appEl.style.width = `${w}px`;
    appEl.style.height = `${h}px`;
    appEl.style.transform = "none";
    appEl.style.transformOrigin = "center center";
  }
}

export function useGameScale() {
  const updateGameScale = useCallback(() => {
    requestAnimationFrame(applyScale);
  }, []);

  // Apply on mount and on every resize
  useEffect(() => {
    requestAnimationFrame(applyScale);

    const handleResize = () => updateGameScale();

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [updateGameScale]);
}
