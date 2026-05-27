import { useEffect } from "react";
import { useFlushStore } from "../../store/useRoyalFlushStore";
import LoaderScreen from "./loadingScreen/LoaderScreen";
import GameControls from "./gameControls/gameControl";
import GameLoadingScreen from "./GameLoadingScreen";
import PeeStreamOverlay from "./pee-overlay/PeeStreamOverlay";
import PooStreamOverlay from "./poo-overlay/PooStreamOverlay";
import PhoneInHandOverlay from "./phone-overlay/PhoneInHandOverlay";
import { AssetProvider } from "../../context/AssetContext";
import { PixiRendererProvider } from "../../context/PixiRendererContext";
import { useGameScale } from "../../hooks/useGameScale";

interface GameWrapperProps {
  onStart: () => void;
}

export default function GameWrapper({ onStart }: GameWrapperProps) {
  // Apply uniform CSS scale to #app so the game fits any viewport size
  // while always looking like the 400×700 base design.
  useGameScale();

  const gamePhase = useFlushStore((s) => s.gamePhase);

  // Re-apply scale on every phase transition (loader → video → game)
  // so layout shifts during phase changes don't leave stale dimensions.
  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }, [gamePhase]);
  const pixiActions = useFlushStore((s) => s.pixiActions);
  const setGamePhase = useFlushStore((s) => s.setGamePhase);

  const handleLoaderComplete = () => {
    setGamePhase("video");
    onStart();
  };

  if (gamePhase === "loader") {
    return <LoaderScreen onComplete={handleLoaderComplete} />;
  }

  if (gamePhase === "game" && pixiActions) {
    return (
      <AssetProvider>
        <PixiRendererProvider>
          {/* Invisible — drives bonus animations onto the PIXI canvas */}
          <PeeStreamOverlay />
          <PooStreamOverlay />
          <PhoneInHandOverlay />
          <GameControls
            onBetClick={() => pixiActions.triggerFlush()}
            onAutoplayClick={() => pixiActions.triggerAutoplay()}
            onToggleMute={() => pixiActions.toggleMusic()}
          />
        </PixiRendererProvider>
      </AssetProvider>
    );
  }

  // "loading" phase — assets loading, show bg to avoid black flash
  if (gamePhase === "loading") {
    return <GameLoadingScreen />;
  }

  // "video" phase — Pixi handles the screen, React shows nothing
  return null;
}
