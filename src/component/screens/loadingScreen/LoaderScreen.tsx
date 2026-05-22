import { useState, useEffect } from "react";
import Logo from "../logoContainer/Logo";
import styles from "./LoaderScreen.module.css";

interface LoaderScreenProps {
  onComplete: () => void;
}

export default function LoaderScreen({ onComplete }: LoaderScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number;
    let prog = 0;

    const animate = () => {
      prog = Math.min(prog + 0.01, 1);
      setProgress(prog);
      if (prog < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const isComplete = progress >= 1;

  return (
    <div className={styles.wrapper}>
      <img
        src="/assets/loading-screen/bg.png"
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
