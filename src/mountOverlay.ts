import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import UIOverlay from "./UIOverlay";

let overlayRoot: Root | null = null;

export function mountUIOverlay(
  onBetClick: (betAmount: number) => void,
  onAutoplayClick: () => void,
  onToggleMute: () => void,
): void {
  const container = document.getElementById("ui-overlay");
  if (!container) return;

  overlayRoot = createRoot(container);
  overlayRoot.render(
    createElement(UIOverlay, { onBetClick, onAutoplayClick, onToggleMute }),
  );
}

export function unmountUIOverlay(): void {
  if (overlayRoot) {
    overlayRoot.unmount();
    overlayRoot = null;
  }
}
