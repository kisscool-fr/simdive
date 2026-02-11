<script setup lang="ts">
import { computed } from 'vue';
import type { LayoutCell, DiveState } from '../types/dive';

const props = defineProps<{
  cell: LayoutCell;
  diveState: DiveState;
}>();

// Format time as MM:SS
function formatTime(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes - mins) * 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format depth with one decimal
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

// NDL display value
const ndlDisplay = computed(() => {
  const ndl = props.diveState.deco.ndl;
  if (ndl < 0) return 'DECO';
  if (ndl > 99) return '99+';
  return ndl.toString();
});

// NDL class for styling
const ndlClass = computed(() => {
  const ndl = props.diveState.deco.ndl;
  if (ndl < 0) return 'critical';
  if (ndl <= 5) return 'warning';
  return '';
});

// Air pressure percentage for gauge
const airPercent = computed(() => {
  return (props.diveState.air.tankPressure / props.diveState.air.initialTankPressure) * 100;
});

// Ascent bar height (max 100%)
const ascentBarHeight = computed(() => {
  const rate = Math.abs(props.diveState.ascent.rate);
  return Math.min(100, (rate / 15) * 100);
});

// Is descending (vs ascending)
const isDescending = computed(() => {
  return props.diveState.ascent.rate > 0;
});

// Cell CSS classes
const cellClasses = computed(() => {
  const classes: string[] = ['display-cell'];

  if (props.cell.primary) {
    classes.push('primary');
  }

  // Add type-specific class
  classes.push(props.cell.type);

  return classes;
});

// Cell style for grid span
const cellStyle = computed(() => {
  if (props.cell.span && props.cell.span > 1) {
    return { gridColumn: `span ${props.cell.span}` };
  }
  return {};
});

// Get label based on cell type and state
const cellLabel = computed(() => {
  if (props.cell.type === 'ndl' && props.diveState.deco.ndl < 0) {
    return props.cell.labelDeco || 'Palier';
  }
  return props.cell.label || getDefaultLabel(props.cell.type);
});

// Default labels for cell types
function getDefaultLabel(type: string): string {
  const labels: Record<string, string> = {
    depth: 'Profondeur',
    time: 'Temps',
    ndl: 'NDL',
    air: 'Pression',
    autonomy: 'Autonomie',
    tts: 'TTS',
    ceiling: 'Plafond',
    ascentRate: 'Vitesse',
    sac: 'Conso',
  };
  return labels[type] || type;
}

// Get unit for cell type
function getUnit(type: string): string {
  const units: Record<string, string> = {
    depth: 'm',
    time: '',
    ndl: props.diveState.deco.ndl < 0 ? 'm' : 'min',
    air: 'bar',
    autonomy: 'min',
    tts: 'min',
    ceiling: 'm',
    ascentRate: 'm/min',
    sac: 'L/min',
  };
  return units[type] || '';
}
</script>

<template>
  <div :class="cellClasses" :style="cellStyle">
    <!-- Depth Cell -->
    <template v-if="cell.type === 'depth'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <div class="lcd-value-container">
        <span class="lcd-value">{{ formatDepth(diveState.currentDepth) }}</span>
        <span class="lcd-unit">m</span>
      </div>
      <span v-if="cell.showMax" class="lcd-sublabel"
        >Max: {{ formatDepth(diveState.maxDepth) }}m</span
      >
    </template>

    <!-- Time Cell -->
    <template v-else-if="cell.type === 'time'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <span class="lcd-value">{{ formatTime(diveState.currentTime) }}</span>
    </template>

    <!-- NDL Cell -->
    <template v-else-if="cell.type === 'ndl'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <span class="lcd-value" :class="ndlClass">{{ ndlDisplay }}</span>
      <span class="lcd-unit">{{ getUnit('ndl') }}</span>
    </template>

    <!-- Air Pressure Cell -->
    <template v-else-if="cell.type === 'air'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <span
        class="lcd-value"
        :class="getAirGaugeClass(diveState.air.tankPressure, diveState.air.initialTankPressure)"
      >
        {{ diveState.air.tankPressure }}
      </span>
      <span class="lcd-unit">bar</span>
      <div v-if="cell.showGauge" class="air-gauge">
        <div class="air-gauge-bar">
          <div
            class="air-gauge-fill"
            :class="getAirGaugeClass(diveState.air.tankPressure, diveState.air.initialTankPressure)"
            :style="{ width: `${airPercent}%` }"
          ></div>
        </div>
      </div>
    </template>

    <!-- Autonomy Cell -->
    <template v-else-if="cell.type === 'autonomy'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <span class="lcd-value">{{ diveState.air.remainingAirTime }}</span>
      <span class="lcd-unit">min</span>
    </template>

    <!-- TTS Cell -->
    <template v-else-if="cell.type === 'tts'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <span class="lcd-value">{{ diveState.deco.tts }}</span>
      <span class="lcd-unit">min</span>
    </template>

    <!-- Ceiling Cell -->
    <template v-else-if="cell.type === 'ceiling'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <span class="lcd-value warning">{{ diveState.deco.ceiling }}</span>
      <span class="lcd-unit">m</span>
    </template>

    <!-- Ascent Rate Cell -->
    <template v-else-if="cell.type === 'ascentRate'">
      <span class="lcd-label">{{ cellLabel }}</span>
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
    </template>

    <!-- SAC Rate Cell -->
    <template v-else-if="cell.type === 'sac'">
      <span class="lcd-label">{{ cellLabel }}</span>
      <span class="lcd-value" style="font-size: 1.5rem">
        {{ diveState.air.currentSacRate.toFixed(0) }}
      </span>
      <span class="lcd-unit">L/min</span>
    </template>
  </div>
</template>

<style scoped>
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
</style>
