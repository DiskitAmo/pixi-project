import { useState } from "react";
import { useFlushStore } from "../../../store/useRoyalFlushStore";
import styles from "./BonusDevPanel.module.css";

const BONUS_TYPES = ["pee", "poo", "phone", "plunger"] as const;
type BonusType = (typeof BONUS_TYPES)[number];

const BONUS_LABELS: Record<BonusType, string> = {
  pee: "💛 Pee",
  poo: "💩 Poo",
  phone: "📱 Phone",
  plunger: "🪠 Plunger",
};

export default function BonusDevPanel() {
  const [open, setOpen] = useState(false);
  const pixiActions = useFlushStore((s) => s.pixiActions);

  const play = (type: BonusType) => {
    pixiActions?.triggerBonusPreview(type);
    setOpen(false);
  };

  return (
    <div className={styles.panel}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        🎰 Bonus
      </button>

      {open && (
        <div className={styles.dropdown}>
          {BONUS_TYPES.map((type) => (
            <button
              key={type}
              className={styles.item}
              onClick={() => play(type)}
            >
              {BONUS_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
