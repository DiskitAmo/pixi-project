import { useState, useEffect } from "react";
import { Assets } from "pixi.js";
import Logo from "../logoContainer/Logo";
import styles from "./LoaderScreen.module.css";
import { ASSETS, PRELOAD_ASSETS } from "../../../lib/constants";

interface LoaderScreenProps {
  onComplete: () => void;
}

export default function LoaderScreen({ onComplete }: LoaderScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Assets.load(PRELOAD_ASSETS, (p: number) => {
      setProgress(p);
    }).catch((err) => {
      console.error("Asset preload error:", err);
      setProgress(1);
    });
  }, []);

  const isComplete = progress >= 1;

  return (
    <div className={styles.wrapper}>
      <img
        src={ASSETS.LOADING_SCREEN_BG}
        alt="background"
        className={styles.bg}
      />

      <div className={styles.content}>
        <Logo className={styles.logo} />

        {!isComplete ? (
          <>
            <p className={styles.loadingText}>LOADING</p>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${progress * 97}%` }}
              />
            </div>
          </>
        ) : (
          <button className={styles.startButton} onClick={onComplete}>
            START GAME
          </button>
        )}
      </div>
    </div>
  );
}
