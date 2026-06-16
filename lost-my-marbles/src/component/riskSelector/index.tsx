import type { AnyTextStyleOptions } from "pixi.js";
import styles from "./styles.module.css";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// import {
//   selectCanPlaceBet,
//   useFlushStore,
// } from "../../../store/useRoyalFlushStore";
// import type { RiskLevel } from "../../../store/useRoyalFlushStore";

const risks = ["LOW", "MED", "HIGH"] as const;

// Map between UI labels and store values
const UI_TO_STORE: Record<string, any> = {
  LOW: "low",
  MED: "medium",
  HIGH: "high",
};
const STORE_TO_INDEX: Record<any, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export const riskColors: Record<string, string> = {
  LOW: "#a855f7", // purple
  MED: "#3b82f6", // blue
  HIGH: "#eab308", // yellow
};

export default function GameControls() {
  // const currentRisk = useFlushStore((s) => s.currentRisk);
  // const setRisk = useFlushStore((s) => s.setRisk);
  // const canBet = useFlushStore(selectCanPlaceBet);
  const disabled = !false;

  //const riskIndex = STORE_TO_INDEX[currentRisk] ?? 0;
  const riskIndex = 0;
  const changeRisk = (dir: number) => {
    const newIndex = (riskIndex + dir + risks.length) % risks.length;
    //setRisk(UI_TO_STORE[risks[newIndex]]);
  };

  const color = riskColors[risks[riskIndex]];

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.riskBoxWrapper} ${disabled ? styles.riskBoxDisabled : ""}`}
        style={{ borderColor: color, color }}
      >
        <button
          className={styles.riskBtn}
          onClick={() => changeRisk(-1)}
          disabled={disabled}
        >
          {/* <ChevronLeft /> */}
        </button>
        <div className={styles.riskBox}>
          <div className={styles.riskLabel}>RISK</div>
          <p className={styles.riskValue} style={{ color }}>
            {risks[riskIndex]}
          </p>
        </div>
        <button
          className={styles.riskBtn}
          onClick={() => changeRisk(1)}
          disabled={disabled}
        >
          {/* <ChevronRight /> */}
        </button>
      </div>
    </div>
  );
}
