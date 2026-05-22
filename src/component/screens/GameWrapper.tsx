import { useFlushStore } from "../../store/useRoyalFlushStore";
import LoaderScreen from "./loadingScreen/LoaderScreen";
import GameControls from "./gameControls/gameControl";
import GameLoadingScreen from "./GameLoadingScreen";

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
      <GameControls
        onBetClick={() => pixiActions.triggerFlush()}
        onAutoplayClick={() => pixiActions.triggerAutoplay()}
        onToggleMute={() => pixiActions.toggleMusic()}
      />
    );
  }

  // "loading" phase — assets loading, show bg to avoid black flash
  if (gamePhase === "loading") {
    return <GameLoadingScreen />;
  }

  // "video" phase — Pixi handles the screen, React shows nothing
  return null;
}
