import styles from "./styles.module.css";
import SVGIcon from "../svg-icon/SVGIcon";
import { useMarbleStore } from "../../store/useMarbleStore";

const risks = ["LOW", "MED", "HIGH"] as const;

export const riskColors: Record<string, string> = {
  LOW: "#a855f7",
  MED: "#3b82f6",
  HIGH: "#eab308",
};

export default function RiskSelector() {
  const riskIndex = useMarbleStore((s) => s.riskIndex);
  const setRiskIndex = useMarbleStore((s) => s.setRiskIndex);
  const activeBonus = useMarbleStore((s) => s.activeBonus);
  const disabled = !!activeBonus;

  const changeRisk = (dir: number) => {
    new Audio("/sounds/SFX/change-risk.wav").play().catch(() => {});
    setRiskIndex((riskIndex + dir + risks.length) % risks.length);
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
          <SVGIcon name="leftArrow" />
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
          <SVGIcon name="rightArrow" />
        </button>
      </div>
    </div>
  );
}
