import { useState } from "react";
import { GAME_SETTINGS, ASSETS } from "../../lib/constants";
import { useMarbleStore } from "../../store/useMarbleStore";
import styles from "./styles.module.css";
import SVGIcon from "../svg-icon";

const risks = [
  { label: "LOW", value: "low" },
  { label: "MED", value: "medium" },
  { label: "HIGH", value: "high" },
] as const;

const MIN_PLAYS = 1;
const MAX_PLAYS = 100;

interface AutoplayModalProps {
  onClose: () => void;
  onStart: (plays: number, bet: number, risk: string) => void;
}

export default function AutoplayModal({
  onClose,
  onStart,
}: AutoplayModalProps) {
  const betAmount = useMarbleStore((s) => s.betAmount);
  const setBetAmount = useMarbleStore((s) => s.setBetAmount);
  const riskIndex = useMarbleStore((s) => s.riskIndex);
  const setRiskIndex = useMarbleStore((s) => s.setRiskIndex);

  const [selectedPlays, setSelectedPlays] = useState(10);

  const changeBet = (dir: number) => {
    const next = betAmount + dir * GAME_SETTINGS.BET_INCREMENT;
    setBetAmount(parseFloat(next.toFixed(2)));
  };

  const changeRisk = (index: number) => {
    new Audio("/sounds/SFX/change-risk.wav").play().catch(() => {});
    setRiskIndex(index);
  };

  const handleStart = () => {
    onStart(selectedPlays, betAmount, risks[riskIndex].value);
    onClose();
  };

  const progressPct =
    ((selectedPlays - MIN_PLAYS) / (MAX_PLAYS - MIN_PLAYS)) * 100;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <img src={ASSETS.BACKGROUND_IMG} alt="" className={styles.bgImg} />
        <div className={styles.bgTint} />

        <button className={styles.closeBtn} onClick={onClose}>
          <SVGIcon name="closeIcon" />
        </button>

        <h2 className={styles.title}>
          AUTOPLAY
          <br />
          SETTINGS
        </h2>

        {/* Risk Level */}
        <div className={styles.section}>
          <span className={styles.label}>RISK LEVEL</span>
          <div className={styles.riskRow}>
            {risks.map((r, i) => (
              <button
                key={r.value}
                className={`${styles.riskBtn} ${i === riskIndex ? styles.riskBtnActive : ""}`}
                onClick={() => changeRisk(i)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bet Amount */}
        <div className={styles.section}>
          <span className={styles.label}>BET AMOUNT</span>
          <div className={styles.betRow}>
            <button className={styles.roundBtn} onClick={() => changeBet(-1)}>
              −
            </button>
            <div className={styles.betInput}>
              <span className={styles.dollarSign}>$</span>
              <span className={styles.betValue}>{betAmount.toFixed(2)}</span>
            </div>
            <button className={styles.roundBtn} onClick={() => changeBet(1)}>
              +
            </button>
          </div>
        </div>

        {/* Number of Plays */}
        <div className={styles.section}>
          <span className={styles.label}>NUMBER OF PLAYS</span>
          <div className={styles.sliderWrapper}>
            <input
              type="range"
              min={MIN_PLAYS}
              max={MAX_PLAYS}
              value={selectedPlays}
              onChange={(e) => setSelectedPlays(Number(e.target.value))}
              className={styles.slider}
              style={{
                background: `linear-gradient(to right, #00ff00 0%, #00ff00 ${progressPct}%, #1c1c1c ${progressPct}%, #1c1c1c 100%)`,
              }}
            />
            <span className={styles.playsCount}>{selectedPlays}</span>
          </div>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          START AUTOPLAY
        </button>
      </div>
    </div>
  );
}
