import { useEffect, useRef, useState } from "react";
import { useFlushStore } from "../../../store/useRoyalFlushStore";
import styles from "./WinFeed.module.css";

interface WinEntry {
  id: string;
  multiplier: number;
  winAmount: number;
}

function multiplierColorClass(val: number) {
  if (val >= 25) return styles.colorHigh;
  if (val >= 3) return styles.colorMedium;
  return "";
}

export default function WinFeed() {
  const [wins, setWins] = useState<WinEntry[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  const rounds = useFlushStore((state) => state.rounds);

  useEffect(() => {
    Object.values(rounds).forEach((round) => {
      if (
        round.status === "completed" &&
        !processedRef.current.has(round.roundId)
      ) {
        processedRef.current.add(round.roundId);

        const entry: WinEntry = {
          id: round.roundId,
          multiplier: round.multiplier,
          winAmount: round.winAmount,
        };

        setWins((prev) => [entry, ...prev].slice(0, 4));

        // Remove after slide-in + hold + fade-out (3.5s total)
        setTimeout(() => {
          setWins((prev) => prev.filter((w) => w.id !== round.roundId));
          processedRef.current.delete(round.roundId);
        }, 3500);
      }
    });
  }, [rounds]);

  if (wins.length === 0) return null;

  return (
    <div className={styles.feed}>
      {wins.map((win) => (
        <div key={win.id} className={styles.pill}>
          <span
            className={`${styles.multiplier} ${multiplierColorClass(win.multiplier)}`}
          >
            {win.multiplier.toFixed(1)}x
          </span>
          <span className={styles.amount}>${win.winAmount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
