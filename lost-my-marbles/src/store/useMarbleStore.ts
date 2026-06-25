import { create } from "zustand";
import { GAME_SETTINGS } from "../lib/constants";

interface WinEntry {
  id: string;
  multiplier: number;
  winAmount: number;
}

export type BonusType = "flashback" | "pill-time" | "make-it-rain" | "nanscare";

interface MarbleState {
  betAmount: number;
  incrementBet: () => void;
  decrementBet: () => void;
  setMaxBet: () => void;
  setBetAmount: (amount: number) => void;
  lastWin: WinEntry | null;
  setLastWin: (entry: WinEntry) => void;
  riskIndex: number;
  setRiskIndex: (index: number) => void;
  activeBonus: BonusType | null;
  bonusPhase: "intro" | "active" | null;
  triggerBonus: (type: BonusType) => void;
  endBonusIntro: () => void;
  clearBonus: () => void;
}

export const useMarbleStore = create<MarbleState>((set) => ({
  betAmount: GAME_SETTINGS.MIN_BET * 2, // starts at $1.00

  incrementBet: () =>
    set((state) => ({
      betAmount: Math.min(
        parseFloat((state.betAmount + GAME_SETTINGS.BET_INCREMENT).toFixed(2)),
        GAME_SETTINGS.MAX_BET,
      ),
    })),

  decrementBet: () =>
    set((state) => ({
      betAmount: Math.max(
        parseFloat((state.betAmount - GAME_SETTINGS.BET_INCREMENT).toFixed(2)),
        GAME_SETTINGS.MIN_BET,
      ),
    })),

  setMaxBet: () => set({ betAmount: GAME_SETTINGS.MAX_BET }),

  setBetAmount: (amount) =>
    set({
      betAmount: Math.min(
        Math.max(parseFloat(amount.toFixed(2)), GAME_SETTINGS.MIN_BET),
        GAME_SETTINGS.MAX_BET,
      ),
    }),

  lastWin: null,
  setLastWin: (entry) => set({ lastWin: entry }),

  riskIndex: 0,
  setRiskIndex: (index) => set({ riskIndex: index }),

  activeBonus: null,
  bonusPhase: null,
  triggerBonus: (type) => set({ activeBonus: type, bonusPhase: "intro" }),
  endBonusIntro: () => set({ bonusPhase: "active" }),
  clearBonus: () => set({ activeBonus: null, bonusPhase: null }),
}));
