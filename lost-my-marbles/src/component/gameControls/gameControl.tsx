//import { useFlushStore } from "../../../store/useRoyalFlushStore";
import BetControls from "../bet-controls/BetControls";
import Logo from "../logoContainer/Logo";
import RiskSelector from "../riskSelector";
import Sidebar from "../sidebar";
//import WinFeed from "../win-feed/WinFeed";
//import BonusPanel from "../bonus-dev-panel/BonusDevPanel";

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
  // const { betAmount } = useFlushStore();
  return (
    <>
      <Sidebar onToggleMute={onToggleMute} />

      <div className={styles.winFeedWrapper}>
        {/* Desktop only */}
        <div className={styles.bonusPanelDesktop}>{/* <BonusPanel /> */}</div>
        {/* <WinFeed /> */}
      </div>
      <div className={styles.gameHeader}>
        <Logo className={styles.logo} />
      </div>

      <div className={styles.gameFooter}>
        <RiskSelector />
        <div className={styles.details}>
          <p>
            <span className={styles.riskSpan}>BET</span>${(22).toFixed(2)}
          </p>
          <p>
            <span className={styles.riskSpan}>CREDIT</span>$2000.00
          </p>
        </div>
        <BetControls
          onBetClick={onBetClick}
          onAutoplayClick={onAutoplayClick}
        />
        {/* Mobile only */}
        <div className={styles.bonusPanelMobile}>{/* <BonusPanel /> */}</div>
      </div>
    </>
  );
}
