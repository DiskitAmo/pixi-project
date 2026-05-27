import { useFlushStore } from "../../store/useRoyalFlushStore";
import LoaderScreen from "./loadingScreen/LoaderScreen";
import GameControls from "./gameControls/gameControl";
import GameLoadingScreen from "./GameLoadingScreen";
import PeeStreamOverlay from "./pee-overlay/PeeStreamOverlay";
import PooStreamOverlay from "./poo-overlay/PooStreamOverlay";
import PhoneOverlay from "./phone-overlay/PhoneOverlay";
import { AssetProvider } from "../../context/AssetContext";
import { PixiRendererProvider } from "../../context/PixiRendererContext";

interface GameWrapperProps {
  onStart: () => void;
}

export default function GameWrapper({ onStart }: GameWrapperProps) {
  const gamePhase = useFlushStore((s) => s.gamePhase);
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
          <PhoneOverlay />
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
