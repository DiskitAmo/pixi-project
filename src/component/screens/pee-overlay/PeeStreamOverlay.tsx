import { useCallback, useRef } from "react";

import { useFlushStore } from "../../../store/useRoyalFlushStore";
import { usePeeStreamAnimation } from "../../../hooks/usePeeStreamAnimation";

/**
 * Invisible React component that drives the pee-stream PIXI animation.
 * Renders nothing to the DOM — all visuals are drawn onto the PIXI canvas.
 *
 * enabled  = a pee bonus round is currently in "spinning" status
 * onFinished → calls triggerBonus, moving the round to "bonus" phase
 */
export default function PeeStreamOverlay() {
  const rounds = useFlushStore((s) => s.rounds);

  // Find a pee round that is actively spinning (animation should be playing)
  const peeRound = Object.values(rounds).find(
    (r) => r.bonusType === "pee" && r.status === "spinning",
  );

  const enabled = !!peeRound;

  // Capture roundId in a ref so onFinished is always stable and never
  // causes the hook's useEffect to restart mid-animation.
  const peeRoundIdRef = useRef<string | null>(null);
  peeRoundIdRef.current = peeRound?.roundId ?? null;

  const onFinished = useCallback(() => {
    const roundId = peeRoundIdRef.current;
    if (roundId) {
      useFlushStore.getState().triggerBonus(roundId, "pee");
    }
  }, []); // stable — reads roundId from ref at call time

  usePeeStreamAnimation({ enabled, onFinished });

  // Pure PIXI rendering — no DOM output
  return null;
}
