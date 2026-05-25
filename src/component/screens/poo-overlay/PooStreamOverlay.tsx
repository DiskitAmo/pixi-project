import { useCallback, useRef } from "react";

import { useFlushStore } from "../../../store/useRoyalFlushStore";
import { usePooAnimation } from "../../../hooks/usePooAnimation";

/**
 * Invisible component that drives the poo animation onto the PIXI canvas.
 * Renders nothing to the DOM — all visuals are drawn by usePooAnimation.
 *
 * enabled    = a poo bonus round is currently in "spinning" status
 * onFinished → triggerBonus moves the round from spinning → bonus phase
 */
export default function PooStreamOverlay() {
  const rounds = useFlushStore((s) => s.rounds);

  const pooRound = Object.values(rounds).find(
    (r) => r.bonusType === "poo" && r.status === "spinning",
  );

  const enabled = !!pooRound;

  const pooRoundIdRef = useRef<string | null>(null);
  pooRoundIdRef.current = pooRound?.roundId ?? null;

  const onFinished = useCallback(() => {
    const roundId = pooRoundIdRef.current;
    if (roundId) {
      useFlushStore.getState().triggerBonus(roundId, "poo");
    }
  }, []);

  usePooAnimation({ enabled, onFinished });

  return null;
}
