import { useState } from "react";
import { X } from "lucide-react";
import { GAME_SETTINGS, ASSETS } from "../../../lib/constants";
import {
  useFlushStore,
  type RiskLevel,
} from "../../../store/useRoyalFlushStore";
import styles from "./styles.module.css";

const risks: { label: string; value: RiskLevel }[] = [
  { label: "LOW", value: "low" },
  { label: "MED", value: "medium" },
  { label: "HIGH", value: "high" },
];

const MIN_PLAYS = 1;
const MAX_PLAYS = 100;

interface AutoplayModalProps {
  onClose: () => void;
  onStart: () => void;
}

export default function AutoplayModal({
  onClose,
  onStart,
}: AutoplayModalProps) {
  const { betAmount, setBetAmount, currentRisk, startAutoplay } =
    useFlushStore();

  const [riskIndex, setRiskIndex] = useState(() => {
    const idx = risks.findIndex((r) => r.value === currentRisk);
    return idx >= 0 ? idx : 0;
  });
  const [localBet, setLocalBet] = useState(betAmount);
  const [selectedPlays, setSelectedPlays] = useState(10);

  const changeBet = (dir: number) => {
    setLocalBet((prev) => {
      const next = prev + dir * GAME_SETTINGS.BET_INCREMENT;
      return Math.min(
        GAME_SETTINGS.MAX_BET,
        Math.max(GAME_SETTINGS.MIN_BET, next),
      );
    });
  };

  const handleStart = () => {
    setBetAmount(localBet);
    startAutoplay(selectedPlays, localBet, risks[riskIndex].value);
    onStart();
    onClose();
  };

  const progressPct =
    ((selectedPlays - MIN_PLAYS) / (MAX_PLAYS - MIN_PLAYS)) * 100;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Background image */}
        <img src={ASSETS.BACKGROUND_IMG} alt="" className={styles.bgImg} />
        {/* Dark tint over bg */}
        <div className={styles.bgTint} />

        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>

        {/* Title */}
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
                onClick={() => setRiskIndex(i)}
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
              <span className={styles.betValue}>{localBet.toFixed(1)}</span>
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

        {/* Start Button */}
        <button className={styles.startBtn} onClick={handleStart}>
          START AUTOPLAY
        </button>
      </div>
    </div>
  );
}
