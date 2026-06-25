import { useMarbleStore } from "../../store/useMarbleStore";
import type { BonusType } from "../../store/useMarbleStore";
import { ASSETS } from "../../lib/constants";
import styles from "./BonusBadge.module.css";

const BONUS_BADGES: Record<BonusType, string> = {
  flashback: ASSETS.BONUS_FLASHBACK_BADGE,
  "pill-time": ASSETS.BONUS_PILL_TIME_BADGE,
  "make-it-rain": ASSETS.BONUS_MAKE_IT_RAIN_BADGE,
  nanscare: ASSETS.BONUS_NANSCARE_BADGE,
};

const BONUS_COLORS: Record<BonusType, string> = {
  flashback: "#FF8800",
  "pill-time": "#E128FF",
  "make-it-rain": "#48C8FF",
  nanscare: "#FFED28",
};

export default function BonusBadge() {
  const activeBonus = useMarbleStore((s) => s.activeBonus);

  const visible = !!activeBonus;
  const imgSrc = activeBonus ? BONUS_BADGES[activeBonus] : null;
  const color = activeBonus ? BONUS_COLORS[activeBonus] : "#ffffff";

  return (
    <div
      className={styles.wrapper}
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) scale(${visible ? 1 : 0.4})`,
        "--badge-color": color,
      } as React.CSSProperties}
    >
      {imgSrc && (
        <>
          <div className={styles.ring} />
          <img src={imgSrc} alt={activeBonus ?? ""} className={styles.image} />
        </>
      )}
    </div>
  );
}
