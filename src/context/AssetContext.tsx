import { createContext, useContext, useMemo } from "react";
import { Assets } from "pixi.js";
import * as PIXI from "pixi.js";
import { ASSETS } from "../lib/constants";
import { useFlushStore } from "../store/useRoyalFlushStore";

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
  const isReady = useFlushStore((s) => s.rendererState.app !== null);

  const peeStreams = useMemo<PIXI.Texture[]>(() => {
    if (!isReady) return [];

    return [
      Assets.get(ASSETS.PEE_STREAM_1),
      Assets.get(ASSETS.PEE_STREAM_2),
      Assets.get(ASSETS.PEE_STREAM_3),
    ].filter(Boolean) as PIXI.Texture[];
  }, [isReady]);

  const poo = useMemo<PIXI.Texture | null>(() => {
    if (!isReady) return null;
    return (Assets.get(ASSETS.POO) as PIXI.Texture) ?? null;
  }, [isReady]);

  const phone = useMemo<PIXI.Texture | null>(() => {
    if (!isReady) return null;
    return (Assets.get(ASSETS.PHONE) as PIXI.Texture) ?? null;
  }, [isReady]);

  return (
    <AssetContext.Provider value={{ peeStreams, poo, phone }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  return useContext(AssetContext);
}
