import { useState } from "react";
import LoaderScreen from "./loadingScreen/LoaderScreen";
import GameControls from "./gameControls/gameControl";
import { AssetProvider } from "../context/AssetContext";
import { PixiRendererProvider } from "../context/PixiRendererContext";

interface GameWrapperProps {
  onStart: () => void;
}

export default function GameWrapper({ onStart }: GameWrapperProps) {
  const [gamePhase, setGamePhase] = useState<"loader" | "video" | "game">("loader");

  if (gamePhase === "loader") {
    return (
      <LoaderScreen
        onComplete={() => {
          setGamePhase("video");
          onStart();
        }}
      />
    );
  }

  if (gamePhase === "game") {
    return (
      <AssetProvider>
        <PixiRendererProvider>
          <GameControls
            onBetClick={() => ""}
            onAutoplayClick={() => ""}
            onToggleMute={() => ""}
          />
        </PixiRendererProvider>
      </AssetProvider>
    );
  }

  // "videoLoading" — video is being fetched; keep bg visible, no buttons
  // "loading" — game assets loading after video ends; keep bg visible
  // if (gamePhase === "videoLoading" || gamePhase === "loading") {
  //   return null;
  // }

  // "video" phase — Pixi canvas is showing the video, React shows nothing
  return null;
}
