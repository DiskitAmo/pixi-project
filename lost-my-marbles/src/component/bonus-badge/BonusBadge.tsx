// import { useFlushStore } from "../../../store/useRoyalFlushStore";
import styles from "./BonusBadge.module.css";
//import { ASSETS } from "../../lib/constants";

export default function BonusBadge() {
  // const announcingBonus = useFlushStore((s) => s.announcingBonus);
  // const announcingBonusType = useFlushStore((s) => s.announcingBonusType);
  // const rounds = useFlushStore((s) => s.rounds);

  // Find any round that belongs to a bonus (covers spinning / bonus / completed phases)
  // const activeBonusRound = Object.values(rounds).find(
  //   (r) => r.bonusType !== "none",
  // );

  // Derive the type to display — announcement phase takes priority,
  // then fall back to whatever the active bonus round says
  //const activeType = announcingBonusType ?? activeBonusRound?.bonusType ?? null;

  // Visible during the announcement AND for the full bonus round lifetime
  // const visible =
  //   (announcingBonus && !!announcingBonusType) || !!activeBonusRound;

  // const imgSrc = activeType ? ANNOUNCEMENT_IMAGES[activeType] : null;

  // The wrapper is always in the DOM so React never causes a layout jump.
  // translateX(-50%) is always part of the inline transform so it is
  // never dropped by a CSS animation mid-frame (which was causing the jerk).
  return (
    <div
      className={styles.wrapper}
      style={{
        opacity: 0,
        transform: `translateX(-50%) scale(${0.4})`,
      }}
    >
      {/* {imgSrc && (
        <>
          <div className={styles.ring} />
          <img src={imgSrc} alt={activeType ?? ""} className={styles.image} />
        </>
      )} */}
    </div>
  );
}
