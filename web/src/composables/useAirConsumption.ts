import { ref, computed } from 'vue';
import type { AirState, DiveEvent } from '../types/dive';
import { SURFACE_PRESSURE, METERS_TO_BAR } from '../types/dive';

/**
 * Air Consumption Calculator
 *
 * Calculates tank pressure, remaining air time, and consumption rates
 * based on depth, SAC rate, and dive events.
 */
export function useAirConsumption(
  initialTankPressure: number,
  tankVolume: number,
  baseSacRate: number
) {
  const tankPressure = ref(initialTankPressure);
  const currentSacRate = ref(baseSacRate);
  const totalAirConsumed = ref(0);
  const sacHistory = ref<{ time: number; rate: number }[]>([]);

  /**
   * Calculate ambient pressure factor for depth
   * Air consumption increases linearly with depth due to pressure
   */
  function getDepthFactor(depth: number): number {
    return (SURFACE_PRESSURE + depth * METERS_TO_BAR) / SURFACE_PRESSURE;
  }

  /**
   * Calculate air consumption for a period at depth
   * Returns bar consumed from tank
   */
  function calculateConsumption(depth: number, durationMinutes: number): number {
    const depthFactor = getDepthFactor(depth);
    const actualConsumptionRate = currentSacRate.value * depthFactor;

    // Liters consumed = rate (L/min) × time (min)
    const litersConsumed = actualConsumptionRate * durationMinutes;

    // Convert to bar: bar = liters / tank volume
    const barConsumed = litersConsumed / tankVolume;

    return barConsumed;
  }

  /**
   * Update air state after time at depth
   */
  function consumeAir(depth: number, durationMinutes: number, time: number): void {
    const consumed = calculateConsumption(depth, durationMinutes);
    tankPressure.value = Math.max(0, tankPressure.value - consumed);
    totalAirConsumed.value += consumed;

    // Record SAC rate for averaging
    sacHistory.value.push({ time, rate: currentSacRate.value });
  }

  /**
   * Calculate remaining air time at current depth and consumption rate
   */
  function calculateRemainingAirTime(depth: number): number {
    if (tankPressure.value <= 0) return 0;

    const depthFactor = getDepthFactor(depth);
    const actualConsumptionRate = currentSacRate.value * depthFactor;

    // Convert tank pressure to liters
    const remainingLiters = tankPressure.value * tankVolume;

    // Time = liters / rate (L/min)
    const remainingTime = remainingLiters / actualConsumptionRate;

    return Math.floor(remainingTime);
  }

  /**
   * Calculate average SAC rate over the dive
   */
  const averageSacRate = computed(() => {
    if (sacHistory.value.length === 0) return baseSacRate;

    const sum = sacHistory.value.reduce((acc, h) => acc + h.rate, 0);
    return sum / sacHistory.value.length;
  });

  /**
   * Apply event effects to SAC rate
   */
  function applyEvent(event: DiveEvent): void {
    switch (event.type) {
      case 'breathingRateIncrease':
        currentSacRate.value = baseSacRate * (event.value || 1.5);
        break;
      case 'breathingRateDecrease':
        currentSacRate.value = baseSacRate;
        break;
      case 'airSharing':
        // Double consumption when sharing air
        currentSacRate.value = baseSacRate * 2;
        break;
      case 'airSharingEnd':
        currentSacRate.value = baseSacRate;
        break;
    }
  }

  /**
   * Get current air state
   */
  function getAirState(depth: number): AirState {
    return {
      initialTankPressure,
      tankPressure: Math.round(tankPressure.value),
      remainingAirTime: calculateRemainingAirTime(depth),
      currentSacRate: currentSacRate.value,
      averageSacRate: averageSacRate.value,
      airConsumed: Math.round(totalAirConsumed.value),
    };
  }

  /**
   * Reset to initial state
   */
  function reset(): void {
    tankPressure.value = initialTankPressure;
    currentSacRate.value = baseSacRate;
    totalAirConsumed.value = 0;
    sacHistory.value = [];
  }

  /**
   * Check for air warnings (recreational diving thresholds)
   */
  function checkWarnings(): { lowAir: boolean; criticalAir: boolean } {
    return {
      lowAir: tankPressure.value <= 50, // Reserve at 50 bar
      criticalAir: tankPressure.value <= 20, // Critical at 20 bar
    };
  }

  return {
    tankPressure,
    currentSacRate,
    averageSacRate,
    totalAirConsumed,
    consumeAir,
    calculateRemainingAirTime,
    applyEvent,
    getAirState,
    checkWarnings,
    reset,
    getDepthFactor,
  };
}
