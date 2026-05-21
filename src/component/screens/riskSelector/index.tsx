import { useState } from "react";

import styles from "./styles.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  selectCanPlaceBet,
  useFlushStore,
} from "../../../store/useRoyalFlushStore";

const risks = ["LOW", "MED", "HIGH"];
export const riskColors: Record<string, string> = {
  LOW: "#a855f7", // purple
  MED: "#3b82f6", // blue
  HIGH: "#eab308", // yellow
};

export default function GameControls() {
  const { betAmount } = useFlushStore();
  const [riskIndex, setRiskIndex] = useState(2); // default HIGH

  const canBet = useFlushStore(selectCanPlaceBet);
  const disabled = !canBet;

  const changeRisk = (dir: number) => {
    setRiskIndex((prev) => (prev + dir + risks.length) % risks.length);
  };

  const color = riskColors[risks[riskIndex]];

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.riskBox} ${disabled ? styles.riskBoxDisabled : ""}`}
        style={{ borderColor: color, color }}
      >
        <button
          className={styles.riskBtn}
          onClick={() => changeRisk(-1)}
          disabled={disabled}
        >
          <ChevronLeft />
        </button>
        <div className={styles.riskBoxhh}>
          <div>RISK</div>
          <strong>{risks[riskIndex]}</strong>
        </div>
        <button
          className={styles.riskBtn}
          onClick={() => changeRisk(1)}
          disabled={disabled}
        >
          <ChevronRight />
        </button>
      </div>
      <div className={styles.details}>
        <p>
          <span className={styles.riskSpan}>BET</span>${betAmount.toFixed(2)}
        </p>
        <p>
          <span className={styles.riskSpan}>CREDIT</span>$2000.00
        </p>
      </div>
    </div>
  );
}
