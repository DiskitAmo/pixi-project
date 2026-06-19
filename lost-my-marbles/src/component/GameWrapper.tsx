import { useState, useRef } from "react";
import LoaderScreen from "./loadingScreen/LoaderScreen";
import UIOverlay from "./gameControls/gameControl";
import { useGameScale } from "../hooks/useGameScale";

interface GameWrapperProps {
  onStart: () => void;
  onRegisterGameStart: (fn: () => void) => void;
}

export default function GameWrapper({ onStart, onRegisterGameStart }: GameWrapperProps) {
  const [gamePhase, setGamePhase] = useState<"loader" | "video" | "game">("loader");

  useGameScale();

  // Register synchronously on first render so main.js can call it at any point after mount
  const registered = useRef(false);
  if (!registered.current) {
    registered.current = true;
    onRegisterGameStart(() => setGamePhase("game"));
  }

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
      <UIOverlay
        onBetClick={() => {}}
        onAutoplayClick={() => {}}
        onToggleMute={() => (window as any).__toggleMusic?.()}
      />
    );
  }

  // "video" phase — Pixi canvas plays the video, React shows nothing
  return null;
}
