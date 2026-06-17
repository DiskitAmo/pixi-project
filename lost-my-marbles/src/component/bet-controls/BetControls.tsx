import { useEffect, useRef, useState } from "react";

import SVGIcon from "../svg-icon/SVGIcon";
import { GAME_SETTINGS } from "../../lib/constants";
// import {
//   // FlushBonusType,
//   // selectActiveBonusRound,
//   selectCanPlaceBet,
//   useFlushStore,
// } from "../../../store/useRoyalFlushStore";
// import AutoplayModal from "../autoplay-modal";
//import BonusBadge from "../bonus-badge/BonusBadge";

//import { useGameStore, useMobileDetect } from '@wtfstudios/game-ui';

import styles from "./BetControls.module.css";

interface BetControlsProps {
  onBetClick: (betAmount: number) => void;
  onAutoplayClick: () => void;
}

export default function BetControls(
  {
    // onBetClick,
    // onAutoplayClick,
  }: BetControlsProps,
) {
  // const { betAmount, setBetAmount, isAuto, autoRemaining, stopAutoplay } =
  //   useFlushStore();
  // const balance = 0;
  // const isMobile = false;

  //const [showBetFeedback, setShowBetFeedback] = useState(false);
  const [showAutoplayModal, setShowAutoplayModal] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  //const FADE_DURATION = 12000;

  // const showBetAmountFeedback = () => {
  //   // Clear any existing hide timeout
  //   if (hideTimeoutRef.current) {
  //     clearTimeout(hideTimeoutRef.current);
  //     hideTimeoutRef.current = null;
  //   }

  //   // Show feedback (restarts CSS animation if already visible)
  //   setShowBetFeedback(false);
  //   setTimeout(() => {
  //     setShowBetFeedback(true);

  //     // Schedule hide after fade completes
  //     hideTimeoutRef.current = window.setTimeout(() => {
  //       setShowBetFeedback(false);
  //       hideTimeoutRef.current = null;
  //     }, FADE_DURATION);
  //   }, 0);
  // };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // const decrementBet = () => {
  //   setBetAmount(
  //     Math.max(GAME_SETTINGS.MIN_BET, betAmount - GAME_SETTINGS.BET_INCREMENT),
  //   );
  //   // showBetAmountFeedback();
  // };

  // const incrementBet = () => {
  //   setBetAmount(
  //     Math.min(GAME_SETTINGS.MAX_BET, betAmount + GAME_SETTINGS.BET_INCREMENT),
  //   );
  //   //showBetAmountFeedback();
  // };

  // const setMaxBet = () => {
  //   setBetAmount(GAME_SETTINGS.MAX_BET);
  //   //showBetAmountFeedback();
  // };

  // const canBet = useFlushStore(selectCanPlaceBet);

  const disabled = false;
  const isAuto = false;

  return (
    <>
      <div className={styles.betWrapper}>
        <button
          disabled={disabled}
          //onClick={decrementBet}
          className={styles.circleButton}
        >
          <SVGIcon name="minsIcon" />
        </button>

        <div className={styles.betContainer}>
          {/* Overlays the main button during bonus announcements */}
          {/* <BonusBadge /> */}

          <div className={styles.mainButtonOuter}>
            <div
              className={`${styles.mainButtonWrapper} ${
                disabled ? styles.disabledBorder : ""
              }`}
            >
              <button
                disabled={disabled}
                className={`${styles.mainButton} ${isAuto ? styles.mainButtonAuto : ""}`}
              >
                {/* <span> {isAuto ? "Stop" : ""}</span>
                <span> {isAuto ? autoRemaining : ""}</span> */}
                {/* 
                {!isAuto && (
                  <div className={styles.betAmountFeedback}>
                    ${betAmount.toFixed(2)}
                  </div>
                )} */}
              </button>
            </div>
          </div>

          <button
            disabled={disabled}
            onClick={() => setShowAutoplayModal(true)}
            className={`${styles.autoplayButton} ${
              disabled ? styles.autoplayDisabled : ""
            }`}
          >
            <div className={styles.autoplayInner}>
              <SVGIcon name="playIcon" customClass={styles.playIcon} />
              <span className={styles.autoplayText}>Autoplay</span>
            </div>
          </button>
        </div>

        <>
          <button
            disabled={disabled}
            // onClick={incrementBet}
            className={styles.circleButton}
          >
            <SVGIcon name="plusIcon" customClass={styles.plusIcon} />
          </button>
          <button
            disabled={disabled}
            //onClick={setMaxBet}
            className={styles.maxButton}
          >
            MAX
          </button>
        </>
      </div>
      {/* 
      {showAutoplayModal && (
        <AutoplayModal
          onClose={() => setShowAutoplayModal(false)}
          onStart={onAutoplayClick}
        />
      )} */}
    </>
  );
}
