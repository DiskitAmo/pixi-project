import { useCallback, useRef } from "react";

import { useFlushStore } from "../../../store/useRoyalFlushStore";
import { usePlungerAnimation } from "../../../hooks/usePlungerAnimation";

/**
 * Invisible React component that drives the plunger bonus PIXI animation.
 * Renders nothing to the DOM — all visuals are drawn onto the PIXI canvas.
 *
 * The announcement banner ("PLUNGER RUSH!") is already shown by
 * showBonusAnnouncement() in bonusOverlays.js (PixiJS layer).
 *
 * After the announcement, the round enters "spinning" status and this
 * component hands off to usePlungerAnimation which:
 *   1. Slides the plunger sprite up from the bottom
 *   2. Swings it like a pendulum for ~7.5 s (water vortex paused)
 *   3. Swaps to the success texture for ~2.5 s (water resumes)
 *   4. Slides it back down off-screen
 *   5. Calls triggerBonus → round advances to "bonus" → completeRound
 */
export default function PlungerRushOverlay() {
  const rounds = useFlushStore((s) => s.rounds);

  const plungerRound = Object.values(rounds).find(
    (r) => r.bonusType === "plunger" && r.status === "spinning",
  );

  const enabled = !!plungerRound;

  // Stable ref so the callback never causes the hook's effect to re-run.
  const plungerRoundIdRef = useRef<string | null>(null);
  plungerRoundIdRef.current = plungerRound?.roundId ?? null;

  const onFinished = useCallback(() => {
    const roundId = plungerRoundIdRef.current;
    if (roundId) {
      useFlushStore.getState().triggerBonus(roundId, "plunger");
    }
  }, []);

  usePlungerAnimation({ enabled, onFinished });

  // Pure PIXI rendering — no DOM output
  return null;
}
