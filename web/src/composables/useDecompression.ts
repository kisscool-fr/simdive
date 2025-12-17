import { ref, computed } from 'vue';
import type { TissueCompartment, DecoState, DecoStop } from '../types/dive';
import {
  BUHLMANN_ZHL16C,
  SURFACE_PRESSURE,
  WATER_VAPOR_PRESSURE,
  N2_FRACTION,
  METERS_TO_BAR,
} from '../types/dive';

/**
 * Bühlmann ZHL-16C Decompression Calculator
 *
 * This composable implements the Bühlmann ZHL-16C algorithm for calculating
 * nitrogen tissue loading, no-decompression limits, and required decompression stops.
 */
export function useDecompression(gfLow = 0.3, gfHigh = 0.85) {
  // Initialize tissues with surface saturation
  const surfaceN2Pressure = (SURFACE_PRESSURE - WATER_VAPOR_PRESSURE) * N2_FRACTION;

  const tissues = ref<TissueCompartment[]>(
    BUHLMANN_ZHL16C.map((compartment) => ({
      ...compartment,
      pN2: surfaceN2Pressure,
    }))
  );

  const gradientFactorLow = ref(gfLow);
  const gradientFactorHigh = ref(gfHigh);

  /**
   * Calculate ambient pressure at a given depth
   */
  function getAmbientPressure(depth: number): number {
    return SURFACE_PRESSURE + depth * METERS_TO_BAR;
  }

  /**
   * Calculate inspired N2 partial pressure at depth
   */
  function getInspiredN2Pressure(depth: number): number {
    const ambientPressure = getAmbientPressure(depth);
    return (ambientPressure - WATER_VAPOR_PRESSURE) * N2_FRACTION;
  }

  /**
   * Calculate tissue loading after exposure time using Schreiner equation
   */
  function calculateTissueLoading(
    initialPressure: number,
    inspiredPressure: number,
    halfTime: number,
    time: number
  ): number {
    const k = Math.LN2 / halfTime;
    return initialPressure + (inspiredPressure - initialPressure) * (1 - Math.exp(-k * time));
  }

  /**
   * Calculate M-value (maximum tolerable pressure) for a compartment at a given depth
   * Using Bühlmann formula: M = a + P_ambient / b
   */
  function getMValue(compartment: TissueCompartment, depth: number): number {
    const ambientPressure = getAmbientPressure(depth);
    return compartment.a + ambientPressure / compartment.b;
  }

  /**
   * Calculate gradient factor adjusted M-value
   */
  function getGFMValue(
    compartment: TissueCompartment,
    depth: number,
    firstStopDepth: number
  ): number {
    const currentMValue = getMValue(compartment, depth);

    // Calculate gradient factor based on depth between first stop and surface
    let gf: number;
    if (firstStopDepth <= 0) {
      gf = gradientFactorHigh.value;
    } else {
      const depthRatio = depth / firstStopDepth;
      gf =
        gradientFactorHigh.value +
        (gradientFactorLow.value - gradientFactorHigh.value) * depthRatio;
    }

    // Apply gradient factor
    const ambientPressure = getAmbientPressure(depth);
    return ambientPressure + gf * (currentMValue - ambientPressure);
  }

  /**
   * Calculate ceiling depth (minimum safe depth)
   */
  function calculateCeiling(): number {
    let maxCeiling = 0;

    for (const tissue of tissues.value) {
      // Calculate the depth at which this tissue would be at its M-value
      // Rearranging: P_ambient = b * (pN2 - a)
      const ambientPressure = tissue.b * (tissue.pN2 - tissue.a);
      const depth = (ambientPressure - SURFACE_PRESSURE) / METERS_TO_BAR;

      // Apply gradient factor adjustment
      const gfAdjustedDepth = depth / gradientFactorLow.value;

      if (gfAdjustedDepth > maxCeiling) {
        maxCeiling = gfAdjustedDepth;
      }
    }

    // Round up to nearest meter, minimum 0
    return Math.max(0, Math.ceil(maxCeiling));
  }

  /**
   * Calculate No-Decompression Limit at current depth
   */
  function calculateNDL(depth: number): number {
    if (depth <= 0) return Infinity;

    const inspiredN2 = getInspiredN2Pressure(depth);
    let minNDL = Infinity;

    for (const tissue of tissues.value) {
      // Calculate M-value at surface (where we want to ascend to)
      const surfaceMValue = tissue.a + SURFACE_PRESSURE / tissue.b;

      // Apply gradient factor
      const gfMValue =
        SURFACE_PRESSURE + gradientFactorHigh.value * (surfaceMValue - SURFACE_PRESSURE);

      // If tissue is already above limit, NDL is 0
      if (tissue.pN2 >= gfMValue) {
        return 0;
      }

      // If inspired pressure is less than or equal to target, NDL is infinite for this tissue
      if (inspiredN2 <= gfMValue) {
        continue;
      }

      // Calculate time to reach M-value
      // Using inverse Schreiner equation
      const k = Math.LN2 / tissue.halfTime;
      const ndl = -Math.log((inspiredN2 - gfMValue) / (inspiredN2 - tissue.pN2)) / k;

      if (ndl < minNDL) {
        minNDL = ndl;
      }
    }

    // Return NDL in minutes, rounded down
    return minNDL === Infinity ? 999 : Math.floor(minNDL);
  }

  /**
   * Calculate required decompression stops
   */
  function calculateDecoStops(_currentDepth: number): DecoStop[] {
    const stops: DecoStop[] = [];
    const ceiling = calculateCeiling();

    if (ceiling <= 0) {
      return stops;
    }

    // Calculate stops at 3m intervals from ceiling to surface
    const firstStopDepth = Math.ceil(ceiling / 3) * 3;

    // Clone tissues for simulation
    const simTissues = tissues.value.map((t) => ({ ...t }));

    for (let stopDepth = firstStopDepth; stopDepth >= 3; stopDepth -= 3) {
      const inspiredN2 = getInspiredN2Pressure(stopDepth);
      let stopTime = 0;

      // Calculate time needed at this stop
      while (true) {
        // Check if we can ascend to next stop (or surface)
        const nextStopDepth = stopDepth - 3;
        let canAscend = true;

        for (const tissue of simTissues) {
          const gfMValue = getGFMValue(tissue, nextStopDepth, firstStopDepth);
          if (tissue.pN2 > gfMValue) {
            canAscend = false;
            break;
          }
        }

        if (canAscend) {
          break;
        }

        // Simulate 1 minute at stop
        stopTime += 1;
        for (const tissue of simTissues) {
          tissue.pN2 = calculateTissueLoading(tissue.pN2, inspiredN2, tissue.halfTime, 1);
        }

        // Safety limit
        if (stopTime > 120) break;
      }

      if (stopTime > 0) {
        stops.push({ depth: stopDepth, duration: stopTime });
      }
    }

    return stops;
  }

  /**
   * Calculate Time To Surface
   */
  function calculateTTS(currentDepth: number): number {
    const ceiling = calculateCeiling();
    const ascentRate = 10; // m/min

    // Time to ascend from current depth to ceiling
    const ascentTime = (currentDepth - ceiling) / ascentRate;

    // Add deco stop times
    const decoStops = calculateDecoStops(currentDepth);
    const decoTime = decoStops.reduce((sum, stop) => sum + stop.duration, 0);

    // Add final ascent from last stop to surface
    const lastStop = decoStops[decoStops.length - 1];
    const lastStopDepth = lastStop ? lastStop.depth : ceiling;
    const finalAscent = lastStopDepth / ascentRate;

    return Math.ceil(ascentTime + decoTime + finalAscent);
  }

  /**
   * Update tissues after spending time at depth
   */
  function updateTissues(depth: number, time: number): void {
    const inspiredN2 = getInspiredN2Pressure(depth);

    tissues.value = tissues.value.map((tissue) => ({
      ...tissue,
      pN2: calculateTissueLoading(tissue.pN2, inspiredN2, tissue.halfTime, time),
    }));
  }

  /**
   * Reset tissues to surface saturation
   */
  function resetTissues(): void {
    tissues.value = BUHLMANN_ZHL16C.map((compartment) => ({
      ...compartment,
      pN2: surfaceN2Pressure,
    }));
  }

  /**
   * Get current decompression state
   */
  function getDecoState(currentDepth: number): DecoState {
    const ceiling = calculateCeiling();
    const ndl = ceiling > 0 ? -1 : calculateNDL(currentDepth);
    const decoStops = ceiling > 0 ? calculateDecoStops(currentDepth) : [];
    const tts = calculateTTS(currentDepth);

    return {
      tissues: tissues.value.map((t) => ({ ...t })),
      ndl,
      ceiling,
      decoStops,
      tts,
      gfLow: gradientFactorLow.value,
      gfHigh: gradientFactorHigh.value,
    };
  }

  /**
   * Get tissue saturation as percentage of M-value
   */
  const tissueSaturationPercentages = computed(() => {
    return tissues.value.map((tissue) => {
      const surfaceMValue = tissue.a + SURFACE_PRESSURE / tissue.b;
      const gfMValue =
        SURFACE_PRESSURE + gradientFactorHigh.value * (surfaceMValue - SURFACE_PRESSURE);
      const saturation = (tissue.pN2 / gfMValue) * 100;
      return Math.min(100, Math.max(0, saturation));
    });
  });

  return {
    tissues,
    gradientFactorLow,
    gradientFactorHigh,
    updateTissues,
    resetTissues,
    calculateCeiling,
    calculateNDL,
    calculateDecoStops,
    calculateTTS,
    getDecoState,
    tissueSaturationPercentages,
    getAmbientPressure,
  };
}
