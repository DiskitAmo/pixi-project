import { createContext, useContext } from "react";

import * as PIXI from "pixi.js";

interface AssetContextValue {
  peeStreams: PIXI.Texture[];
  poo: PIXI.Texture | null;
  phone: PIXI.Texture | null;
}

const AssetContext = createContext<AssetContextValue>({
  peeStreams: [],
  poo: null,
  phone: null,
});

export function AssetProvider({ children }: { children: React.ReactNode }) {
  // Re-compute textures once the PIXI app is ready (assets are in cache from LoaderScreen)
  //const isReady = useFlushStore((s) => s.rendererState.app !== null);

  return (
    <AssetContext.Provider value={{ peeStreams: [], poo: null, phone: null }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  return useContext(AssetContext);
}
