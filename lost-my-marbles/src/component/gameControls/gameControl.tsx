import BetControls from "../bet-controls/BetControls";
import Logo from "../logoContainer/Logo";
import RiskSelector from "../riskSelector";
import Sidebar from "../sidebar";
import WinFeed from "../win-feed/WinFeed";
import { useMarbleStore } from "../../store/useMarbleStore";

import styles from "./gameControl.module.css";

interface UIOverlayProps {
  onBetClick: (betAmount: number) => void;
  onAutoplayClick: () => void;
  onToggleMute: () => void;
}

export default function UIOverlay({
  onBetClick,
  onAutoplayClick,
  onToggleMute,
}: UIOverlayProps) {
  const betAmount = useMarbleStore((s) => s.betAmount);
  const setMaxBet = useMarbleStore((s) => s.setMaxBet);

  return (
    <>
      <WinFeed />
      <Sidebar onToggleMute={onToggleMute} />

      <div className={styles.gameHeader}>
        <Logo className={styles.logo} />
      </div>

      {/* ── Desktop footer ── */}
      <div className={styles.gameFooterDesktop}>
        <div className={styles.footerLeft}>
          <RiskSelector />
          <div className={styles.details}>
            <p><span className={styles.labelSpan}>BET</span>${betAmount.toFixed(2)}</p>
            <p><span className={styles.labelSpan}>CREDIT</span>$9,984.75</p>
          </div>
        </div>
        <BetControls onBetClick={onBetClick} onAutoplayClick={onAutoplayClick} />
      </div>

      {/* ── Mobile footer ── */}
      <div className={styles.gameFooterMobile}>
        {/* Bet amount pill */}
        <div className={styles.mobileBetAmount}>${betAmount.toFixed(2)}</div>

        {/* Main controls row: MAX | [-] [GREEN] [+] | RISK */}
        <div className={styles.mobileControlsRow}>
          <button className={styles.mobileMaxBtn} onClick={setMaxBet}>MAX</button>
          <BetControls onBetClick={onBetClick} onAutoplayClick={onAutoplayClick} mobileInline />
          <RiskSelector />
        </div>

        {/* BET / CREDIT row */}
        <div className={styles.mobileBetCredit}>
          <p><span className={styles.labelSpan}>BET</span> ${betAmount.toFixed(2)}</p>
          <p><span className={styles.labelSpan}>CREDIT</span> $9,984.75</p>
        </div>
      </div>
    </>
  );
}
