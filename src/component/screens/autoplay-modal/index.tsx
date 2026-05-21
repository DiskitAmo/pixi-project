import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { GAME_SETTINGS } from "../../../lib/constants";
import {
  useFlushStore,
  type RiskLevel,
} from "../../../store/useRoyalFlushStore";
import styles from "./styles.module.css";

const risks: { label: string; value: RiskLevel; color: string }[] = [
  { label: "LOW", value: "low", color: "#a855f7" },
  { label: "MED", value: "medium", color: "#3b82f6" },
  { label: "HIGH", value: "high", color: "#eab308" },
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
  const { betAmount, setBetAmount, startAutoplay } = useFlushStore();

  const [riskIndex, setRiskIndex] = useState(2);
  const [localBet, setLocalBet] = useState(betAmount);
  const [selectedPlays, setSelectedPlays] = useState(10);

  const changeRisk = (dir: number) => {
    setRiskIndex((prev) => (prev + dir + risks.length) % risks.length);
  };

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

  const { color } = risks[riskIndex];
  const progressPct =
    ((selectedPlays - MIN_PLAYS) / (MAX_PLAYS - MIN_PLAYS)) * 100;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>AUTOPLAY</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Risk Selector */}
        <div className={styles.section}>
          <span className={styles.label}>RISK</span>
          <div className={styles.riskRow} style={{ borderColor: color, color }}>
            <button
              className={styles.chevronBtn}
              onClick={() => changeRisk(-1)}
            >
              <ChevronLeft size={20} />
            </button>
            <span className={styles.riskLabel}>{risks[riskIndex].label}</span>
            <button className={styles.chevronBtn} onClick={() => changeRisk(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Bet Amount */}
        <div className={styles.section}>
          <span className={styles.label}>BET AMOUNT</span>
          <div className={styles.betRow}>
            <button className={styles.roundBtn} onClick={() => changeBet(-1)}>
              −
            </button>
            <span className={styles.betValue}>${localBet.toFixed(2)}</span>
            <button className={styles.roundBtn} onClick={() => changeBet(1)}>
              +
            </button>
          </div>
        </div>

        {/* Number of Plays */}
        <div className={styles.section}>
          <div className={styles.playsHeader}>
            <span className={styles.label}>NUMBER OF PLAYS</span>
            <span className={styles.playsCount}>{selectedPlays}</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <input
            type="range"
            min={MIN_PLAYS}
            max={MAX_PLAYS}
            value={selectedPlays}
            onChange={(e) => setSelectedPlays(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        {/* Start Button */}
        <button className={styles.startBtn} onClick={handleStart}>
          START AUTOPLAY
        </button>
      </div>
    </div>
  );
}
