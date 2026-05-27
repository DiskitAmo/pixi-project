import { useCallback, useRef } from "react";

import { useFlushStore } from "../../../store/useRoyalFlushStore";
import { usePhoneAnimation } from "../../../hooks/usePhoneAnimation";

/**
 * Invisible React component that drives the phone-bonus PIXI animation.
 * Renders nothing to the DOM — all visuals are drawn onto the PIXI canvas.
 *
 * enabled    = a phone bonus round is currently in "spinning" status
 * onFinished → completeRound moves the round from spinning → completed
 */
export default function PhoneOverlay() {
  const rounds = useFlushStore((s) => s.rounds);

  const phoneRound = Object.values(rounds).find(
    (r) => r.bonusType === "phone" && r.status === "spinning",
  );

  const enabled = !!phoneRound;

  // Capture roundId in a ref so onFinished is always stable and never
  // causes the hook's useEffect to restart mid-animation.
  const phoneRoundIdRef = useRef<string | null>(null);
  phoneRoundIdRef.current = phoneRound?.roundId ?? null;

  const onFinished = useCallback(() => {
    const roundId = phoneRoundIdRef.current;
    if (roundId) {
      useFlushStore.getState().completeRound(roundId);
    }
  }, []); // stable — reads roundId from ref at call time

  usePhoneAnimation({ enabled, onFinished });

  // Pure PIXI rendering — no DOM output
  return null;
}
