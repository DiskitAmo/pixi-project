//import { RiskLevel } from '@/lib/constants';
import { Texture, Container, Application } from "pixi.js";
import { create } from "zustand";

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/* ================================
   Types
================================ */

export type FlushRoundStatus = "pending" | "spinning" | "bonus" | "completed";

export type FlushBonusType = "poo" | "pee" | "phone" | "plunger" | "none";

export interface FlushRound {
  roundId: string;

  texture: Texture; // store texture key, not PIXI.Texture
  betAmount: number;
  outcome: number;

  maxRadius: number;
  isPoo: boolean;
  isPhone: boolean;

  status: FlushRoundStatus;
  bonusType: FlushBonusType;

  multiplier: number;
  winAmount: number;
}

export type GamePhase =
  | "loader"
  | "videoLoading"
  | "video"
  | "loading"
  | "game";

export interface RendererState {
  app: Application | null;
  maxRadius: number;
  particlesContainer: Container | null;
  bonusObjectsContainer: Container | null;
  /** Live bowl-centre coordinates (differ from screen centre on mobile). */
  centerX: number;
  centerY: number;
}

export interface PixiActions {
  triggerFlush: () => void;
  triggerAutoplay: () => void;
  toggleMusic: () => void;
}

interface FlushState {
  gamePhase: GamePhase;
  pixiActions: PixiActions | null;
  setGamePhase: (phase: GamePhase) => void;
  setPixiActions: (actions: PixiActions) => void;

  currentRisk: RiskLevel;
  betAmount: number;

  rounds: Record<string, FlushRound>;
  hasPlacedFirstBet: boolean;

  multiplierTables: Partial<Record<RiskLevel, number[]>> | null;

  isAuto: boolean;
  autoRemaining: number;
  maxAutoPlays: number;

  announcingBonus: boolean;
  announcingBonusType: FlushBonusType | null;

  waterSpinPaused: boolean;
  setWaterSpinPaused: (paused: boolean) => void;

  rendererState: RendererState;
  setRendererState: (state: RendererState) => void;

  setRisk: (risk: RiskLevel) => void;
  setBetAmount: (amount: number) => void;
  setMultiplierTables: (tables: Partial<Record<RiskLevel, number[]>>) => void;
  setAnnouncingBonus: (val: boolean, bonusType?: FlushBonusType | null) => void;

  addRound: (roundId: string, betAmount: number, texture: Texture) => void;

  startRound: (
    roundId: string,
    multiplier: number,
    bonusType: FlushBonusType,
    texture?: Texture | null,
  ) => void;
  triggerBonus: (roundId: string, type: FlushBonusType) => void;
  completeRound: (roundId: string) => void;
  removeRound: (roundId: string) => void;

  startAutoplay: (plays: number, bet: number, risk: RiskLevel) => void;

  stopAutoplay: () => void;
  decrementAutoplay: () => void;
  incrementAutoplay: () => void;
}

/* ================================
   Store
================================ */

export const useFlushStore = create<FlushState>((set) => ({
  gamePhase: "loader",
  pixiActions: null,
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setPixiActions: (actions) => set({ pixiActions: actions }),

  currentRisk: "low",
  betAmount: 1,

  rounds: {},
  hasPlacedFirstBet: false,

  multiplierTables: null,

  isAuto: false,
  autoRemaining: 0,
  maxAutoPlays: 100,

  announcingBonus: false,
  announcingBonusType: null,

  waterSpinPaused: false,
  setWaterSpinPaused: (paused) => set({ waterSpinPaused: paused }),

  rendererState: {
    app: null,
    maxRadius: 200,
    particlesContainer: null,
    bonusObjectsContainer: null,
    centerX: 0,
    centerY: 0,
  },
  setRendererState: (state) => set({ rendererState: state }),

  /* ================================
     Core
  ================================ */

  setRisk: (risk) => set({ currentRisk: risk }),

  setBetAmount: (amount) => set({ betAmount: amount }),

  setMultiplierTables: (tables) => set({ multiplierTables: tables }),

  setAnnouncingBonus: (val, bonusType = null) =>
    set({ announcingBonus: val, announcingBonusType: val ? bonusType : null }),

  /* ================================
     Round Lifecycle
  ================================ */
  //addRound(roundId, betAmount, texture, bonusType)
  addRound: (roundId, betAmount, texture) =>
    set((state) => ({
      rounds: {
        ...state.rounds,
        [roundId]: {
          roundId,
          betAmount,
          outcome: 0,

          texture,
          bonusType: "none",

          isPoo: false,
          isPhone: false,
          maxRadius: 0,

          status: "pending",

          multiplier: 0,
          winAmount: 0,
        },
      },
      hasPlacedFirstBet: true,
    })),

  startRound: (roundId, multiplier, bonusType, texture) =>
    set((state) => {
      const round = state.rounds[roundId];
      if (!round || round.status !== "pending") return state;

      return {
        rounds: {
          ...state.rounds,
          [roundId]: {
            ...round,
            status: "spinning",
            multiplier,
            bonusType,
            texture: texture || round.texture,
          },
        },
      };
    }),

  triggerBonus: (roundId, type) =>
    set((state) => {
      const round = state.rounds[roundId];
      if (!round || round.status !== "spinning") return state;

      const bonusActive = Object.values(state.rounds).some(
        (r) => r.status === "bonus",
      );

      if (bonusActive) return state;

      return {
        announcingBonus: false,
        rounds: {
          ...state.rounds,
          [roundId]: {
            ...round,
            status: "bonus",
            bonusType: type,
          },
        },
      };
    }),

  completeRound: (roundId) =>
    set((state) => {
      const round = state.rounds[roundId];
      if (!round || round.status === "completed") return state;

      return {
        rounds: {
          ...state.rounds,
          [roundId]: {
            ...round,
            winAmount: round.betAmount * round.multiplier,
            status: "completed",
          },
        },
      };
    }),
  removeRound: (roundId) =>
    set((state) => {
      const round = state.rounds[roundId];
      const rounds = { ...state.rounds };

      delete rounds[roundId];

      // if the removed round was a bonus round, clear the announcing flag
      // (poo/phone/plunger skip triggerBonus entirely, so this is the only
      // place the flag gets cleared for those bonus types)
      const clearAnnouncing =
        round?.bonusType !== undefined && round.bonusType !== "none";

      return {
        rounds,
        ...(clearAnnouncing ? { announcingBonus: false } : {}),
      };
    }),
  /* ================================
     Autoplay
  ================================ */

  startAutoplay: (plays, bet, risk) =>
    set((state) => ({
      isAuto: true,
      autoRemaining: Math.min(plays, state.maxAutoPlays),
      betAmount: bet,
      currentRisk: risk,
    })),

  stopAutoplay: () =>
    set({
      isAuto: false,
      autoRemaining: 0,
    }),

  incrementAutoplay: () =>
    set((state) => {
      if (!state.isAuto) return state;

      return {
        autoRemaining: state.autoRemaining + 1,
      };
    }),

  decrementAutoplay: () =>
    set((state) => {
      if (!state.isAuto) return state;

      const remaining = state.autoRemaining - 1;

      if (remaining <= 0) {
        return { isAuto: false, autoRemaining: 0 };
      }

      return { autoRemaining: remaining };
    }),
}));
/* ================================
   Selector Memoizer
================================ */

function memoizeSelector<T>(
  selector: (state: FlushState) => T,
): (state: FlushState) => T {
  let lastRounds: FlushState["rounds"] | null = null;
  let lastResult: T;

  return (state: FlushState) => {
    if (state.rounds === lastRounds) {
      return lastResult;
    }

    lastRounds = state.rounds;
    lastResult = selector(state);

    return lastResult;
  };
}

/* ================================
   Selectors
================================ */

export const selectActiveFlushRounds = memoizeSelector((state: FlushState) => {
  const result: FlushRound[] = [];
  const rounds = state.rounds;

  for (const id in rounds) {
    const round = rounds[id];
    if (round.status !== "pending" && round.status !== "completed") {
      result.push(round);
    }
  }

  return result;
});

export const selectCompletedFlushRounds = memoizeSelector(
  (state: FlushState) => {
    const result: FlushRound[] = [];
    const rounds = state.rounds;

    for (const id in rounds) {
      const round = rounds[id];
      if (round.status === "completed") {
        result.push(round);
      }
    }

    return result;
  },
);

export function selectActiveBonusRound(
  state: FlushState,
): FlushRound | undefined {
  const rounds = state.rounds;

  for (const id in rounds) {
    const round = rounds[id];
    if (round.status === "bonus") {
      return round;
    }
  }

  return undefined;
}

export function selectCompletedBonusRound(
  state: FlushState,
): FlushRound | undefined {
  const rounds = state.rounds;

  for (const id in rounds) {
    const round = rounds[id];
    if (round.status === "completed" && round.bonusType !== "none") {
      return round;
    }
  }

  return undefined;
}

export function selectCanPlaceBet(state: FlushState): boolean {
  if (state.announcingBonus) return false;

  const rounds = state.rounds;

  for (const id in rounds) {
    const r = rounds[id];

    if (r.status === "bonus") return false;

    if (r.status === "completed" && r.bonusType !== "none") return false;
  }

  return true;
}
