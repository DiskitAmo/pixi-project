import { createContext, useContext, useState } from "react";
import { useFlushStore } from "../store/useRoyalFlushStore";
import type { RendererState } from "../store/useRoyalFlushStore";

// Context holds a stable object reference whose properties are kept up-to-date
// via mutation. This prevents the hook's useEffect from re-running on every
// window resize (which only changes maxRadius, not app/particlesContainer).
const PixiRendererContext = createContext<RendererState | null>(null);

export function PixiRendererProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeState = useFlushStore((s) => s.rendererState);

  // Create the stable reference once
  const [contextValue] = useState<RendererState>(() => ({
    app: null,
    maxRadius: 200,
    particlesContainer: null,
  }));

  // Mutate properties in-place so the object identity never changes.
  // The hook reads renderer.maxRadius on every animation frame, so it
  // always gets the current value without triggering effect re-runs.
  contextValue.app = storeState.app;
  contextValue.maxRadius = storeState.maxRadius;
  contextValue.particlesContainer = storeState.particlesContainer;

  return (
    <PixiRendererContext.Provider value={contextValue}>
      {children}
    </PixiRendererContext.Provider>
  );
}

export function usePixiRenderer() {
  return useContext(PixiRendererContext);
}
