import type { DiveState } from '../../types/dive';

/** Dive state at 25 m, no deco, nothing in progress */
export function createMockDiveState(overrides: Partial<DiveState> = {}): DiveState {
  return {
    currentTime: 15.5,
    currentDepth: 25.3,
    maxDepth: 28.7,
    deco: {
      tissues: [],
      ndl: 12,
      ceiling: 0,
      decoStops: [],
      tts: 5,
      gfLow: 0.3,
      gfHigh: 0.85,
    },
    air: {
      initialTankPressure: 200,
      tankPressure: 150,
      remainingAirTime: 35,
      currentSacRate: 18,
      averageSacRate: 17,
      airConsumed: 50,
    },
    ascent: {
      rate: -2,
      isViolation: false,
      maxAllowedRate: 10,
    },
    safetyStop: {
      required: false,
      active: false,
      depth: 5,
      duration: 180,
      remaining: 0,
    },
    activeWarnings: [],
    ...overrides,
  };
}

/** Dive state in deco: ceiling at 3 m with two mandatory stops */
export function createDecoDiveState(): DiveState {
  const state = createMockDiveState();
  return {
    ...state,
    deco: {
      ...state.deco,
      ndl: -1,
      ceiling: 3,
      tts: 14,
      decoStops: [
        { depth: 6, duration: 2 },
        { depth: 3, duration: 8 },
      ],
    },
  };
}
