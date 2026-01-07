import { ref, computed } from 'vue';
import type {
  DiveProfile,
  DiveState,
  Waypoint,
  DiveEvent,
  PlaybackControl,
  PlaybackSpeed,
  DiveWarning,
  SafetyStopState,
  AscentState,
} from '../types/dive';
import { MAX_ASCENT_RATE, SAFETY_STOP_DEPTH, SAFETY_STOP_DURATION } from '../types/dive';
import { useDecompression } from './useDecompression';
import { useAirConsumption } from './useAirConsumption';

/**
 * Main Dive Engine - State Machine for Dive Simulation
 *
 * Manages playback, interpolates depth, and coordinates decompression
 * and air consumption calculations.
 */
export function useDiveEngine() {
  // Current profile
  const currentProfile = ref<DiveProfile | null>(null);

  // Playback control
  const playback = ref<PlaybackControl>({
    state: 'stopped',
    speed: 1,
    currentTime: 0,
    totalTime: 0,
    stepSize: 10, // 10 seconds per step
  });

  // Dive state
  const diveState = ref<DiveState | null>(null);

  // Internal references for calculators
  let decoCalculator: ReturnType<typeof useDecompression> | null = null;
  let airCalculator: ReturnType<typeof useAirConsumption> | null = null;

  // Animation frame and interval references
  let animationFrameId: number | null = null;
  let lastUpdateTime: number = 0;

  // Track processed events
  const processedEvents = ref<Set<string>>(new Set());

  // Max depth tracking
  const maxDepth = ref(0);

  /**
   * Interpolate depth at a given time from waypoints
   */
  function interpolateDepth(time: number, waypoints: Waypoint[]): number {
    if (waypoints.length === 0) return 0;

    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];

    if (!first || !last) return 0;
    if (time <= first.time) return first.depth;
    if (time >= last.time) return last.depth;

    // Find the two waypoints surrounding current time
    for (let i = 0; i < waypoints.length - 1; i++) {
      const current = waypoints[i];
      const next = waypoints[i + 1];

      if (current && next && time >= current.time && time <= next.time) {
        // Linear interpolation
        const progress = (time - current.time) / (next.time - current.time);
        return current.depth + (next.depth - current.depth) * progress;
      }
    }

    return last.depth;
  }

  /**
   * Calculate ascent/descent rate
   */
  function calculateAscentRate(
    previousDepth: number,
    currentDepth: number,
    timeDelta: number
  ): AscentState {
    if (timeDelta <= 0) {
      return {
        rate: 0,
        isViolation: false,
        maxAllowedRate: MAX_ASCENT_RATE,
      };
    }

    // Rate is positive for descent, negative for ascent
    const rate = (currentDepth - previousDepth) / timeDelta;
    const ascentRate = -rate; // Positive when ascending

    return {
      rate: Math.round(rate * 10) / 10,
      isViolation: ascentRate > MAX_ASCENT_RATE,
      maxAllowedRate: MAX_ASCENT_RATE,
    };
  }

  /**
   * Determine safety stop state
   */
  function calculateSafetyStopState(
    currentDepth: number,
    maxDepthReached: number,
    previousState: SafetyStopState | null,
    timeDelta: number // in minutes
  ): SafetyStopState {
    const needsSafetyStop = maxDepthReached >= 10; // Safety stop if max depth >= 10m
    const atSafetyStopDepth = currentDepth >= 4 && currentDepth <= 6;

    // If we're at safety stop depth and need one
    if (needsSafetyStop && atSafetyStopDepth) {
      if (previousState?.active) {
        // Continue counting down - timeDelta is in minutes, remaining is in seconds
        const elapsedSeconds = timeDelta * 60;
        const remaining = Math.max(0, previousState.remaining - elapsedSeconds);
        return {
          required: true,
          active: true,
          depth: SAFETY_STOP_DEPTH,
          duration: SAFETY_STOP_DURATION,
          remaining,
        };
      } else {
        // Start safety stop
        return {
          required: true,
          active: true,
          depth: SAFETY_STOP_DEPTH,
          duration: SAFETY_STOP_DURATION,
          remaining: SAFETY_STOP_DURATION,
        };
      }
    }

    // Check if safety stop was completed
    const completed = previousState?.active && previousState.remaining <= 0;

    return {
      required: needsSafetyStop && !completed,
      active: false,
      depth: SAFETY_STOP_DEPTH,
      duration: SAFETY_STOP_DURATION,
      remaining: completed ? 0 : SAFETY_STOP_DURATION,
    };
  }

  /**
   * Get active warnings based on current state
   */
  function getActiveWarnings(
    airWarnings: { lowAir: boolean; criticalAir: boolean },
    ascentState: AscentState,
    decoState: ReturnType<typeof useDecompression>['getDecoState'] extends (d: number) => infer R
      ? R
      : never,
    activeEvents: DiveEvent[]
  ): DiveWarning[] {
    const warnings: DiveWarning[] = [];

    // Air warnings
    if (airWarnings.criticalAir) {
      warnings.push({
        type: 'critical',
        message: 'AIR CRITIQUE',
        code: 'CRITICAL_AIR',
      });
    } else if (airWarnings.lowAir) {
      warnings.push({
        type: 'warning',
        message: 'RÉSERVE',
        code: 'LOW_AIR',
      });
    }

    // Ascent rate warning
    if (ascentState.isViolation) {
      warnings.push({
        type: 'critical',
        message: 'REMONTÉE TROP RAPIDE',
        code: 'FAST_ASCENT',
      });
    }

    // Deco ceiling violation
    if (decoState.ceiling > 0) {
      warnings.push({
        type: 'warning',
        message: `PALIER ${decoState.ceiling}m`,
        code: 'DECO_REQUIRED',
      });
    }

    // Event-based warnings
    for (const event of activeEvents) {
      if (event.message) {
        const type = event.type.includes('critical')
          ? 'critical'
          : event.type.includes('Warning')
            ? 'warning'
            : 'info';
        warnings.push({
          type,
          message: event.message,
          code: event.type,
        });
      }
    }

    return warnings;
  }

  /**
   * Process events at current time
   */
  function processEvents(currentTime: number, events: DiveEvent[]): DiveEvent[] {
    const activeEvents: DiveEvent[] = [];

    for (const event of events) {
      const eventKey = `${event.type}-${event.time}`;

      // Check if event should be triggered (within 0.1 min window)
      if (Math.abs(currentTime - event.time) < 0.1 && !processedEvents.value.has(eventKey)) {
        processedEvents.value.add(eventKey);

        // Apply event to air calculator if relevant
        if (airCalculator) {
          airCalculator.applyEvent(event);
        }

        activeEvents.push(event);
      }
    }

    return activeEvents;
  }

  /**
   * Update dive state at current time
   */
  function updateDiveState(timeDelta: number = 1 / 60): void {
    if (!currentProfile.value || !decoCalculator || !airCalculator) return;

    const previousDepth = diveState.value?.currentDepth ?? 0;
    const currentTime = playback.value.currentTime;
    const currentDepthRaw = interpolateDepth(currentTime, currentProfile.value.waypoints);
    // Round to 1 decimal place for display and rate calculations
    // This ensures consistency with previousDepth (which comes from stored rounded value)
    const currentDepth = Math.round(currentDepthRaw * 10) / 10;

    // Update max depth
    if (currentDepth > maxDepth.value) {
      maxDepth.value = currentDepth;
    }

    // Process events
    const activeEvents = processEvents(currentTime, currentProfile.value.events);

    // Update decompression (using raw depth for precision)
    decoCalculator.updateTissues(currentDepthRaw, timeDelta);
    const decoState = decoCalculator.getDecoState(currentDepthRaw);

    // Update air consumption (using raw depth for precision)
    airCalculator.consumeAir(currentDepthRaw, timeDelta, currentTime);
    const airState = airCalculator.getAirState(currentDepthRaw);
    const airWarnings = airCalculator.checkWarnings();

    // Calculate ascent rate (using rounded depths for consistency)
    const ascentState = calculateAscentRate(previousDepth, currentDepth, timeDelta);

    // Calculate safety stop state
    const safetyStopState = calculateSafetyStopState(
      currentDepth,
      maxDepth.value,
      diveState.value?.safetyStop ?? null,
      timeDelta
    );

    // Get warnings
    const warnings = getActiveWarnings(airWarnings, ascentState, decoState, activeEvents);

    // Update dive state
    diveState.value = {
      currentTime,
      currentDepth,
      maxDepth: maxDepth.value,
      deco: decoState,
      air: airState,
      ascent: ascentState,
      safetyStop: safetyStopState,
      activeWarnings: warnings,
    };
  }

  /**
   * Animation loop for playback
   */
  function animationLoop(timestamp: number): void {
    if (playback.value.state !== 'playing') return;

    if (lastUpdateTime === 0) {
      lastUpdateTime = timestamp;
    }

    const realTimeDelta = (timestamp - lastUpdateTime) / 1000; // seconds
    const simTimeDelta = (realTimeDelta * playback.value.speed) / 60; // minutes

    // Update simulation time
    playback.value.currentTime = Math.min(
      playback.value.currentTime + simTimeDelta,
      playback.value.totalTime
    );

    // Update dive state
    updateDiveState(simTimeDelta);

    lastUpdateTime = timestamp;

    // Check if dive is complete
    if (playback.value.currentTime >= playback.value.totalTime) {
      pause();
      return;
    }

    // Continue animation
    animationFrameId = requestAnimationFrame(animationLoop);
  }

  /**
   * Load a dive profile
   */
  function loadProfile(profile: DiveProfile): void {
    currentProfile.value = profile;

    // Calculate total dive time from waypoints
    const lastWaypoint = profile.waypoints[profile.waypoints.length - 1];
    const totalTime = lastWaypoint ? lastWaypoint.time : 0;

    // Reset playback
    playback.value = {
      state: 'stopped',
      speed: 1,
      currentTime: 0,
      totalTime,
      stepSize: 10,
    };

    // Reset tracking
    maxDepth.value = 0;
    processedEvents.value.clear();

    // Initialize calculators
    decoCalculator = useDecompression();
    airCalculator = useAirConsumption(
      profile.initialTankPressure,
      profile.tankVolume,
      profile.sacRate
    );

    // Initialize dive state
    updateDiveState(0);
  }

  /**
   * Start or resume playback
   */
  function play(): void {
    if (!currentProfile.value) return;

    playback.value.state = 'playing';
    lastUpdateTime = 0;
    animationFrameId = requestAnimationFrame(animationLoop);
  }

  /**
   * Pause playback
   */
  function pause(): void {
    playback.value.state = 'paused';
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  /**
   * Stop playback and reset
   */
  function stop(): void {
    pause();

    if (currentProfile.value) {
      loadProfile(currentProfile.value);
    }
  }

  /**
   * Step forward in time
   */
  function stepForward(): void {
    if (!currentProfile.value) return;

    pause();

    const stepMinutes = playback.value.stepSize / 60;
    playback.value.currentTime = Math.min(
      playback.value.currentTime + stepMinutes,
      playback.value.totalTime
    );

    updateDiveState(stepMinutes);
  }

  /**
   * Step backward in time
   */
  function stepBackward(): void {
    if (!currentProfile.value) return;

    pause();

    const stepMinutes = playback.value.stepSize / 60;
    const newTime = Math.max(0, playback.value.currentTime - stepMinutes);

    // Need to recalculate from start to maintain accuracy
    const profile = currentProfile.value;
    loadProfile(profile);

    // Fast-forward to new time
    const steps = Math.floor(newTime / (1 / 60));
    for (let i = 0; i < steps; i++) {
      playback.value.currentTime = (i + 1) * (1 / 60);
      updateDiveState(1 / 60);
    }

    playback.value.currentTime = newTime;
    playback.value.state = 'paused';
  }

  /**
   * Seek to specific time
   */
  function seekTo(time: number): void {
    if (!currentProfile.value) return;

    const wasPlaying = playback.value.state === 'playing';
    pause();

    const targetTime = Math.max(0, Math.min(time, playback.value.totalTime));

    // Recalculate from start
    const profile = currentProfile.value;
    loadProfile(profile);

    // Simulate to target time in larger steps for performance
    const stepSize = 1 / 60; // 1 second steps
    let currentTime = 0;

    while (currentTime < targetTime) {
      const delta = Math.min(stepSize, targetTime - currentTime);
      currentTime += delta;
      playback.value.currentTime = currentTime;
      updateDiveState(delta);
    }

    playback.value.state = 'paused';

    if (wasPlaying) {
      play();
    }
  }

  /**
   * Set playback speed
   */
  function setSpeed(speed: PlaybackSpeed): void {
    playback.value.speed = speed;
  }

  /**
   * Set step size (in seconds)
   */
  function setStepSize(seconds: number): void {
    playback.value.stepSize = seconds;
  }

  // Computed properties
  const isPlaying = computed(() => playback.value.state === 'playing');
  const isPaused = computed(() => playback.value.state === 'paused');
  const isStopped = computed(() => playback.value.state === 'stopped');
  const progress = computed(() => {
    if (playback.value.totalTime === 0) return 0;
    return (playback.value.currentTime / playback.value.totalTime) * 100;
  });

  const tissueSaturationPercentages = computed(() => {
    return decoCalculator?.tissueSaturationPercentages.value ?? [];
  });

  return {
    // State
    currentProfile,
    playback,
    diveState,

    // Computed
    isPlaying,
    isPaused,
    isStopped,
    progress,
    tissueSaturationPercentages,

    // Actions
    loadProfile,
    play,
    pause,
    stop,
    stepForward,
    stepBackward,
    seekTo,
    setSpeed,
    setStepSize,
  };
}
