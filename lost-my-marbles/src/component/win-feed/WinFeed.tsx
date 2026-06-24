import { useEffect, useRef, useState } from "react";
import { useMarbleStore } from "../../store/useMarbleStore";
import styles from "./WinFeed.module.css";

interface WinEntry {
  id: string;
  multiplier: number;
  winAmount: number;
}

function multiplierColorClass(val: number) {
  if (val >= 5) return styles.colorHigh;
  if (val >= 1.5) return styles.colorMedium;
  return "";
}

function pillBorderClass(val: number) {
  if (val >= 5) return styles.borderHigh;
  if (val >= 1.5) return styles.borderMedium;
  return "";
}

export default function WinFeed() {
  const [wins, setWins] = useState<WinEntry[]>([]);
  const processedRef = useRef<Set<string>>(new Set());
  const lastWin = useMarbleStore((s) => s.lastWin);

  useEffect(() => {
    if (!lastWin || processedRef.current.has(lastWin.id)) return;

    processedRef.current.add(lastWin.id);
    setWins((prev) => [lastWin, ...prev].slice(0, 4));

    setTimeout(() => {
      setWins((prev) => prev.filter((w) => w.id !== lastWin.id));
      processedRef.current.delete(lastWin.id);
    }, 3500);
  }, [lastWin]);

  if (wins.length === 0) return null;

  return (
    <div className={styles.feed}>
      {wins.map((win) => (
        <div key={win.id} className={`${styles.pill} ${pillBorderClass(win.multiplier)}`}>
          <span className={`${styles.multiplier} ${multiplierColorClass(win.multiplier)}`}>
            {win.multiplier.toFixed(2)}x
          </span>
          <span className={styles.amount}>${win.winAmount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
