import { useEffect, useRef } from "react";
import { useMarbleStore } from "../../store/useMarbleStore";
import type { BonusType } from "../../store/useMarbleStore";
import { ASSETS } from "../../lib/constants";
import styles from "./BonusIntro.module.css";

const BONUS_CONFIG: Record<
  BonusType,
  { video: string; audio: string; music: string; badge: string; color: string }
> = {
  flashback: {
    video: ASSETS.BONUS_FLASHBACK,
    audio: ASSETS.BONUS_FLASHBACK_AUDIO,
    music: ASSETS.BONUS_FLASHBACK_MUSIC,
    badge: ASSETS.BONUS_FLASHBACK_BADGE,
    color: "#FF8800",
  },
  "pill-time": {
    video: ASSETS.BONUS_PILL_TIME,
    audio: ASSETS.BONUS_PILL_TIME_AUDIO,
    music: ASSETS.BONUS_PILL_TIME_MUSIC,
    badge: ASSETS.BONUS_PILL_TIME_BADGE,
    color: "#E128FF",
  },
  "make-it-rain": {
    video: ASSETS.BONUS_MAKE_IT_RAIN,
    audio: ASSETS.BONUS_MAKE_IT_RAIN_AUDIO,
    music: ASSETS.BONUS_MAKE_IT_RAIN_MUSIC,
    badge: ASSETS.BONUS_MAKE_IT_RAIN_BADGE,
    color: "#48C8FF",
  },
  nanscare: {
    video: ASSETS.BONUS_NANSCARE,
    audio: ASSETS.BONUS_NANSCARE_AUDIO,
    music: ASSETS.BONUS_NANSCARE_MUSIC,
    badge: ASSETS.BONUS_NANSCARE_BADGE,
    color: "#FFED28",
  },
};

export default function BonusIntro() {
  const activeBonus = useMarbleStore((s) => s.activeBonus);
  const bonusPhase = useMarbleStore((s) => s.bonusPhase);
  const endBonusIntro = useMarbleStore((s) => s.endBonusIntro);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (bonusPhase !== "intro" || !activeBonus) return;
    const config = BONUS_CONFIG[activeBonus];

    const sfx = new Audio(config.audio);
    sfx.volume = 1.0;
    sfx.play().catch(() => {});

    const music = new Audio(config.music);
    music.loop = true;
    music.volume = 0.3;
    music.play().catch(() => {});
    musicRef.current = music;

    const timer = setTimeout(endBonusIntro, 2500);

    // Don't pause sfx on cleanup — let it play its full natural length
    return () => clearTimeout(timer);
  }, [bonusPhase, activeBonus]);

  // Stop bonus music when bonus fully clears
  useEffect(() => {
    if (!activeBonus && musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
      musicRef.current = null;
    }
  }, [activeBonus]);

  if (bonusPhase !== "intro" || !activeBonus) return null;

  const config = BONUS_CONFIG[activeBonus];

  return (
    <div className={styles.overlay}>
      <div className={styles.badge}>
        <img src={config.badge} alt={activeBonus} className={styles.image} />
      </div>
    </div>
  );
}
