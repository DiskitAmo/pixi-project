import { createContext, useContext, useState } from "react";

interface RendererState {
  app: any;
  maxRadius: number;
  particlesContainer: any;
  bonusObjectsContainer: any;
  centerX: number;
  centerY: number;
}

const PixiRendererContext = createContext<RendererState | null>(null);

export function PixiRendererProvider({ children }: { children: React.ReactNode }) {
  const [contextValue] = useState<RendererState>(() => ({
    app: null,
    maxRadius: 200,
    particlesContainer: null,
    bonusObjectsContainer: null,
    centerX: 0,
    centerY: 0,
  }));

  return (
    <PixiRendererContext.Provider value={contextValue}>
      {children}
    </PixiRendererContext.Provider>
  );
}

export function usePixiRenderer() {
  return useContext(PixiRendererContext);
}
