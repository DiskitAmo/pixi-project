import { useCallback, useEffect, useRef, useState } from "react";

import { ASSETS } from "../../../lib/constants";
import { useFlushStore } from "../../../store/useRoyalFlushStore";
import { usePhoneAnimation } from "../../../hooks/usePhoneAnimation";
import styles from "./PhoneInHandOverlay.module.css";

// ─── Timing constants (ms) ────────────────────────────────────────────────────
const FRAMES = [
  ASSETS.PHONE_IN_HAND_1,
  ASSETS.PHONE_IN_HAND_2,
  ASSETS.PHONE_IN_HAND_3,
];

const T_ENTER = 500;        // hand slides up
const T_CROSSFADE = 200;    // frame crossfade duration
const T_CROSSFADE_FAST = 80; // frame 1→2 swap mid-swing
const T_HOLD = 800;         // pause at top before exit
const T_EXIT = 1000;        // hand slides back down

const AT_START = 10;
const AT_SWAP_1_2 = AT_START + 420;                    //  430ms — frame 1→2 mid-swing
const AT_SHOW_FRAME_3 = AT_START + T_ENTER + 250;      //  760ms — frame 2→3 while still at top
const AT_EXIT_START = AT_START + T_ENTER + T_HOLD;     // 1310ms — slide back down
const AT_TRIGGER_FLUSH = AT_EXIT_START + T_EXIT - 100; // PixiJS orbit starts near end of slide

// ─── Stage 1: HTML/CSS hand animation ────────────────────────────────────────
function PhoneInHand({
  onSequenceComplete,
}: {
  onSequenceComplete: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const slide = (y: string, duration: number, easing: string) => {
      wrapper.style.transition = `transform ${duration}ms ${easing}`;
      wrapper.style.transform = `translateY(${y})`;
    };

    const fade = (el: HTMLElement | null, to: number, duration: number) => {
      if (!el) return;
      el.style.transition = `opacity ${duration}ms ease-in-out`;
      el.style.opacity = String(to);
    };

    // Initial state: off-screen below, frame 1 visible
    wrapper.style.transition = "none";
    wrapper.style.transform = "translateY(110%)";
    fade(imgRefs.current[0], 1, 0);
    fade(imgRefs.current[1], 0, 0);
    fade(imgRefs.current[2], 0, 0);

    // Slide UP
    timers.push(
      setTimeout(() => {
        slide("15%", T_ENTER, "cubic-bezier(0.22, 1, 0.36, 1)");
      }, AT_START),
    );

    // Mid-swing: swap frame 1 → 2
    timers.push(
      setTimeout(() => {
        fade(imgRefs.current[0], 0, T_CROSSFADE_FAST);
        fade(imgRefs.current[1], 1, T_CROSSFADE_FAST);
      }, AT_SWAP_1_2),
    );

    // Show frame 3 while hand is still at top (during hold)
    timers.push(
      setTimeout(() => {
        fade(imgRefs.current[1], 0, T_CROSSFADE);
        fade(imgRefs.current[2], 1, T_CROSSFADE);
      }, AT_SHOW_FRAME_3),
    );

    // Slide back DOWN — frame 3 already visible, no opacity change
    timers.push(
      setTimeout(() => {
        slide("110%", T_EXIT, "cubic-bezier(0.4, 0, 0.6, 1)");
      }, AT_EXIT_START),
    );

    // Hand has exited — kick off PixiJS orbit
    timers.push(
      setTimeout(() => {
        onSequenceComplete();
      }, AT_TRIGGER_FLUSH),
    );

    return () => timers.forEach(clearTimeout);
  }, [onSequenceComplete]);

  return (
    <div className={styles.wrapperContainer}>
      <div ref={wrapperRef} className={styles.wrapper}>
        {FRAMES.map((src, i) => (
          <img
            key={src}
            ref={(el) => {
              imgRefs.current[i] = el;
            }}
            src={src}
            alt={`Phone in hand ${i + 1}`}
            className={styles.phoneImage}
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

export default function PhoneInHandOverlay() {
  const rounds = useFlushStore((s) => s.rounds);

  const phoneRound = Object.values(rounds).find(
    (r) => r.bonusType === "phone" && r.status === "spinning",
  );

  const activeRoundId = phoneRound?.roundId ?? null;

  const [showHand, setShowHand] = useState(false);
  const [orbitEnabled, setOrbitEnabled] = useState(false);

  // Stable ref so callbacks can read the current roundId without being
  // listed as effect dependencies (prevents mid-animation restarts).
  const activeRoundIdRef = useRef<string | null>(null);
  activeRoundIdRef.current = activeRoundId;

  // Round becomes active → show hand, reset orbit
  useEffect(() => {
    if (activeRoundId) {
      setShowHand(true);
      setOrbitEnabled(false);
    } else {
      setShowHand(false);
      setOrbitEnabled(false);
    }
  }, [activeRoundId]);

  // Stage 1 complete → start orbit
  const handleHandComplete = useCallback(() => {
    setShowHand(false);
    setOrbitEnabled(true);
  }, []);

  // Stage 2 complete → mark round finished
  const handleOrbitFinished = useCallback(() => {
    const roundId = activeRoundIdRef.current;
    if (roundId) useFlushStore.getState().completeRound(roundId);
  }, []);

  usePhoneAnimation({ enabled: orbitEnabled, onFinished: handleOrbitFinished });

  return showHand ? (
    <PhoneInHand onSequenceComplete={handleHandComplete} />
  ) : null;
}
