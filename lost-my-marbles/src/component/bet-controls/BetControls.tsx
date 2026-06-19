import { useEffect, useRef } from "react";

import SVGIcon from "../svg-icon/SVGIcon";
import styles from "./BetControls.module.css";

interface BetControlsProps {
  onBetClick: (betAmount: number) => void;
  onAutoplayClick: () => void;
  /** When true, renders the compact inline layout for mobile (no MAX button) */
  mobileInline?: boolean;
}

export default function BetControls({ mobileInline }: BetControlsProps) {
  //const [showAutoplayModal, setShowAutoplayModal] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const disabled = false;
  const isAuto = false;

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`${styles.betWrapper} ${mobileInline ? styles.betWrapperMobile : ""}`}
    >
      {/* Minus button */}
      <button disabled={disabled} className={styles.circleButton}>
        <SVGIcon name="minsIcon" />
      </button>

      {/* Centre: bet button + autoplay */}
      <div className={styles.betContainer}>
        {!mobileInline && (
          <div className={styles.mainButtonOuter}>
            <div
              className={`${styles.mainButtonWrapper} ${disabled ? styles.disabledBorder : ""}`}
            >
              <button
                disabled={disabled}
                onClick={() => (window as any).__dropMarble?.()}
                className={`${styles.mainButton} ${isAuto ? styles.mainButtonAuto : ""}`}
              />
            </div>
          </div>
        )}

        {mobileInline && (
          <div className={styles.mainButtonOuterMobile}>
            <div
              className={`${styles.mainButtonWrapperMobile} ${disabled ? styles.disabledBorder : ""}`}
            >
              <button
                disabled={disabled}
                onClick={() => (window as any).__dropMarble?.()}
                className={`${styles.mainButton} ${isAuto ? styles.mainButtonAuto : ""}`}
              />
            </div>
          </div>
        )}

        <button
          disabled={disabled}
          //onClick={() => setShowAutoplayModal(true)}
          className={`${styles.autoplayButton} ${disabled ? styles.autoplayDisabled : ""}`}
        >
          <div className={styles.autoplayInner}>
            <SVGIcon name="playIcon" customClass={styles.playIcon} />
            <span className={styles.autoplayText}>Autoplay</span>
          </div>
        </button>
      </div>

      {/* Plus button */}
      <button disabled={disabled} className={styles.circleButton}>
        <SVGIcon name="plusIcon" customClass={styles.plusIcon} />
      </button>

      {/* MAX button — only shown in desktop mode */}
      {!mobileInline && (
        <button disabled={disabled} className={styles.maxButton}>
          MAX
        </button>
      )}
    </div>
  );
}
