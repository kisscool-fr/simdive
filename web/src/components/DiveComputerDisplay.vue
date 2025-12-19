<script setup lang="ts">
import { computed } from 'vue';
import type { DiveState, DisplayMode } from '../types/dive';

const props = defineProps<{
  diveState: DiveState | null;
  displayMode: DisplayMode;
}>();

// Format time as MM:SS
function formatTime(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes - mins) * 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format depth
function formatDepth(depth: number): string {
  return depth.toFixed(1);
}

// Get air gauge class based on percentage
function getAirGaugeClass(pressure: number, initial: number = 200): string {
  const percent = (pressure / initial) * 100;
  if (percent <= 20) return 'gauge-critical';
  if (percent <= 33) return 'gauge-low';
  if (percent <= 50) return 'gauge-mid';
  return 'gauge-full';
}

// Get NDL display
const ndlDisplay = computed(() => {
  if (!props.diveState) return '--';
  const ndl = props.diveState.deco.ndl;
  if (ndl < 0) return 'DECO';
  if (ndl > 99) return '99+';
  return ndl.toString();
});

// NDL class
const ndlClass = computed(() => {
  if (!props.diveState) return '';
  const ndl = props.diveState.deco.ndl;
  if (ndl < 0) return 'critical';
  if (ndl <= 5) return 'warning';
  return '';
});

// Air pressure percentage
const airPercent = computed(() => {
  if (!props.diveState) return 100;
  return (props.diveState.air.tankPressure / props.diveState.air.initialTankPressure) * 100;
});

// Ascent rate bar height (max 100%)
const ascentBarHeight = computed(() => {
  if (!props.diveState) return 0;
  const rate = Math.abs(props.diveState.ascent.rate);
  return Math.min(100, (rate / 15) * 100);
});

const isDescending = computed(() => {
  return props.diveState ? props.diveState.ascent.rate > 0 : false;
});
</script>

<template>
  <div class="dive-computer">
    <div class="dive-computer-header">
      <span class="dive-computer-title">SimDive</span>
      <slot name="mode-toggle"></slot>
    </div>

    <div v-if="diveState" class="display-content">
      <!-- Primary Display: Depth -->
      <div class="display-grid">
        <div class="display-cell primary depth">
          <span class="lcd-label">Profondeur</span>
          <div class="lcd-value-container">
            <span class="lcd-value">{{ formatDepth(diveState.currentDepth) }}</span>
            <span class="lcd-unit">m</span>
          </div>
          <span class="lcd-sublabel">Max: {{ formatDepth(diveState.maxDepth) }}m</span>
        </div>

        <!-- Time -->
        <div class="display-cell time">
          <span class="lcd-label">Temps</span>
          <span class="lcd-value">{{ formatTime(diveState.currentTime) }}</span>
        </div>

        <!-- NDL / Deco -->
        <div class="display-cell ndl">
          <span class="lcd-label">{{ diveState.deco.ndl < 0 ? 'Palier' : 'NDL' }}</span>
          <span class="lcd-value" :class="ndlClass">{{ ndlDisplay }}</span>
          <span class="lcd-unit">{{ diveState.deco.ndl < 0 ? 'm' : 'min' }}</span>
        </div>

        <!-- Air Pressure -->
        <div class="display-cell air">
          <span class="lcd-label">Pression</span>
          <span
            class="lcd-value"
            :class="getAirGaugeClass(diveState.air.tankPressure, diveState.air.initialTankPressure)"
          >
            {{ diveState.air.tankPressure }}
          </span>
          <span class="lcd-unit">bar</span>
          <div class="air-gauge">
            <div class="air-gauge-bar">
              <div
                class="air-gauge-fill"
                :class="
                  getAirGaugeClass(diveState.air.tankPressure, diveState.air.initialTankPressure)
                "
                :style="{ width: `${airPercent}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Remaining Air Time (Essential + Expert) -->
        <div class="display-cell">
          <span class="lcd-label">Autonomie</span>
          <span class="lcd-value">{{ diveState.air.remainingAirTime }}</span>
          <span class="lcd-unit">min</span>
        </div>

        <!-- Expert Mode: Additional Info -->
        <template v-if="displayMode === 'expert'">
          <!-- TTS -->
          <div class="display-cell">
            <span class="lcd-label">TTS</span>
            <span class="lcd-value">{{ diveState.deco.tts }}</span>
            <span class="lcd-unit">min</span>
          </div>

          <!-- Ceiling -->
          <div v-if="diveState.deco.ceiling > 0" class="display-cell">
            <span class="lcd-label">Plafond</span>
            <span class="lcd-value warning">{{ diveState.deco.ceiling }}</span>
            <span class="lcd-unit">m</span>
          </div>

          <!-- Ascent Rate -->
          <div class="display-cell">
            <span class="lcd-label">Vitesse</span>
            <div class="ascent-indicator">
              <div class="ascent-bar">
                <div
                  class="ascent-bar-fill"
                  :class="{
                    descending: isDescending,
                    violation: diveState.ascent.isViolation,
                  }"
                  :style="{ height: `${ascentBarHeight}%` }"
                ></div>
              </div>
              <span
                class="lcd-value"
                :class="{ critical: diveState.ascent.isViolation }"
                style="font-size: 1.5rem"
              >
                {{ Math.abs(diveState.ascent.rate).toFixed(0) }}
              </span>
              <span class="lcd-unit">m/min</span>
            </div>
          </div>

          <!-- SAC Rate -->
          <div class="display-cell">
            <span class="lcd-label">Conso</span>
            <span class="lcd-value" style="font-size: 1.5rem">
              {{ diveState.air.currentSacRate.toFixed(0) }}
            </span>
            <span class="lcd-unit">L/min</span>
          </div>
        </template>
      </div>

      <!-- Safety Stop -->
      <div v-if="diveState.safetyStop.active" class="safety-stop active">
        <span class="lcd-label">Palier de sécurité</span>
        <span class="lcd-value"
          >{{ Math.ceil(diveState.safetyStop.remaining / 60) }}:{{
            (diveState.safetyStop.remaining % 60).toString().padStart(2, '0')
          }}</span
        >
        <span class="lcd-unit">à {{ diveState.safetyStop.depth }}m</span>
      </div>

      <!-- Deco Stops (Expert Mode) -->
      <div
        v-if="displayMode === 'expert' && diveState.deco.decoStops.length > 0"
        class="deco-stops"
      >
        <span class="lcd-label">Paliers obligatoires</span>
        <div v-for="stop in diveState.deco.decoStops" :key="stop.depth" class="deco-stop">
          <span class="deco-stop-depth">{{ stop.depth }}m</span>
          <span class="deco-stop-time">{{ stop.duration }}min</span>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="diveState.activeWarnings.length > 0" class="warnings-panel">
        <div v-for="warning in diveState.activeWarnings" :key="warning.code" class="warning-item">
          <div class="warning-icon" :class="warning.type">
            <span v-if="warning.type === 'critical'">!</span>
            <span v-else-if="warning.type === 'warning'">⚠</span>
            <span v-else>i</span>
          </div>
          <span class="warning-text" :class="warning.type">{{ warning.message }}</span>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="no-data">
      <span class="lcd-label">Sélectionnez un profil de plongée</span>
    </div>
  </div>
</template>

<style scoped>
.display-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lcd-value-container {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.lcd-sublabel {
  font-family: var(--dc-font-ui);
  font-size: 0.75rem;
  color: var(--dc-lcd-text-dim);
  margin-top: 4px;
}

.no-data {
  padding: 60px 20px;
  text-align: center;
}

.warning-text.critical {
  color: var(--dc-lcd-critical);
}

.warning-text.warning {
  color: var(--dc-lcd-warning);
}

.warning-text.info {
  color: var(--dc-lcd-info);
}
</style>
