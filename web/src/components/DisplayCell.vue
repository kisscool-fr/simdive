<script setup lang="ts">
import { computed } from 'vue';
import type { DiveState } from '../types/dive';
import type { ScreenWidget, WidgetType } from '../types/computer';

const props = defineProps<{
  widget: ScreenWidget;
  diveState: DiveState;
}>();

const DEFAULT_LABELS: Record<WidgetType, string> = {
  depth: 'Profondeur',
  maxDepth: 'Prof. max',
  time: 'Temps',
  ndl: 'NDL',
  air: 'Pression',
  autonomy: 'Autonomie',
  tts: 'TTS',
  ceiling: 'Plafond',
  ascentRate: 'Vitesse',
  sac: 'Conso',
  safetyStop: 'Palier de sécurité',
  decoStops: 'Paliers obligatoires',
  warnings: 'Alertes',
};

// Format time as MM:SS
function formatTime(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes - mins) * 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format seconds as M:SS
function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}

function formatDepth(depth: number): string {
  return depth.toFixed(1);
}

// Air gauge class based on remaining percentage
function getAirGaugeClass(pressure: number, initial: number = 200): string {
  const percent = (pressure / initial) * 100;
  if (percent <= 20) return 'gauge-critical';
  if (percent <= 33) return 'gauge-low';
  if (percent <= 50) return 'gauge-mid';
  return 'gauge-full';
}

const inDeco = computed(() => props.diveState.deco.ndl < 0);

/** Widgets that only appear when they have something to show */
const visible = computed(() => {
  const s = props.diveState;
  switch (props.widget.type) {
    case 'ceiling':
      return s.deco.ceiling > 0;
    case 'safetyStop':
      return s.safetyStop.active;
    case 'decoStops':
      return s.deco.decoStops.length > 0;
    case 'warnings':
      return s.activeWarnings.length > 0;
    default:
      return true;
  }
});

const label = computed(() => {
  if (props.widget.type === 'ndl' && inDeco.value) {
    return props.widget.labelDeco || 'Palier';
  }
  return props.widget.label || DEFAULT_LABELS[props.widget.type];
});

const ndlDisplay = computed(() => {
  const ndl = props.diveState.deco.ndl;
  if (ndl < 0) return 'DECO';
  if (ndl > 99) return '99+';
  return ndl.toString();
});

const ndlClass = computed(() => {
  const ndl = props.diveState.deco.ndl;
  if (ndl < 0) return 'critical';
  if (ndl <= 5) return 'warning';
  return '';
});

const airClass = computed(() =>
  getAirGaugeClass(props.diveState.air.tankPressure, props.diveState.air.initialTankPressure)
);

const airPercent = computed(
  () => (props.diveState.air.tankPressure / props.diveState.air.initialTankPressure) * 100
);

// Ascent bar height (max 100% at 15 m/min)
const ascentBarHeight = computed(() =>
  Math.min(100, (Math.abs(props.diveState.ascent.rate) / 15) * 100)
);

const isDescending = computed(() => props.diveState.ascent.rate > 0);

const isSection = computed(() =>
  ['safetyStop', 'decoStops', 'warnings'].includes(props.widget.type)
);

const cellClasses = computed(() => [
  'display-cell',
  props.widget.type,
  `size-${props.widget.size ?? 'md'}`,
  { highlight: props.widget.highlight },
]);
</script>

<template>
  <template v-if="visible">
    <!-- Sections: safety stop, deco stops, warnings -->
    <div
      v-if="widget.type === 'safetyStop'"
      class="safety-stop"
      :class="{ active: diveState.safetyStop.remaining > 0 }"
    >
      <span class="lcd-label">{{ label }}</span>
      <span class="lcd-value">{{ formatSeconds(diveState.safetyStop.remaining) }}</span>
      <span class="lcd-unit">à {{ diveState.safetyStop.depth }}m</span>
    </div>

    <div v-else-if="widget.type === 'decoStops'" class="deco-stops">
      <span class="lcd-label">{{ label }}</span>
      <div v-for="stop in diveState.deco.decoStops" :key="stop.depth" class="deco-stop">
        <span class="deco-stop-depth">{{ stop.depth }}m</span>
        <span class="deco-stop-time">{{ stop.duration }}min</span>
      </div>
    </div>

    <div v-else-if="widget.type === 'warnings'" class="warnings-panel">
      <div v-for="warning in diveState.activeWarnings" :key="warning.code" class="warning-item">
        <div class="warning-icon" :class="warning.type">
          <span v-if="warning.type === 'critical'">!</span>
          <span v-else-if="warning.type === 'warning'">⚠</span>
          <span v-else>i</span>
        </div>
        <span class="warning-text" :class="warning.type">{{ warning.message }}</span>
      </div>
    </div>

    <!-- Value widgets -->
    <div v-else-if="!isSection" :class="cellClasses">
      <span class="lcd-label">{{ label }}</span>

      <div class="lcd-value-container">
        <template v-if="widget.type === 'depth'">
          <span class="lcd-value">{{ formatDepth(diveState.currentDepth) }}</span>
          <span class="lcd-unit">m</span>
        </template>

        <template v-else-if="widget.type === 'maxDepth'">
          <span class="lcd-value">{{ formatDepth(diveState.maxDepth) }}</span>
          <span class="lcd-unit">m</span>
        </template>

        <template v-else-if="widget.type === 'time'">
          <span class="lcd-value">{{ formatTime(diveState.currentTime) }}</span>
        </template>

        <template v-else-if="widget.type === 'ndl'">
          <span class="lcd-value" :class="ndlClass">{{ ndlDisplay }}</span>
          <span v-if="!inDeco" class="lcd-unit">min</span>
        </template>

        <template v-else-if="widget.type === 'air'">
          <span class="lcd-value" :class="airClass">{{ diveState.air.tankPressure }}</span>
          <span class="lcd-unit">bar</span>
        </template>

        <template v-else-if="widget.type === 'autonomy'">
          <span class="lcd-value">{{ diveState.air.remainingAirTime }}</span>
          <span class="lcd-unit">min</span>
        </template>

        <template v-else-if="widget.type === 'tts'">
          <span class="lcd-value">{{ diveState.deco.tts }}</span>
          <span class="lcd-unit">min</span>
        </template>

        <template v-else-if="widget.type === 'ceiling'">
          <span class="lcd-value warning">{{ diveState.deco.ceiling }}</span>
          <span class="lcd-unit">m</span>
        </template>

        <template v-else-if="widget.type === 'ascentRate'">
          <div class="ascent-bar">
            <div
              class="ascent-bar-fill"
              :class="{ descending: isDescending, violation: diveState.ascent.isViolation }"
              :style="{ height: `${ascentBarHeight}%` }"
            ></div>
          </div>
          <span class="lcd-value" :class="{ critical: diveState.ascent.isViolation }">
            {{ Math.abs(diveState.ascent.rate).toFixed(0) }}
          </span>
          <span class="lcd-unit">m/min</span>
        </template>

        <template v-else-if="widget.type === 'sac'">
          <span class="lcd-value">{{ diveState.air.currentSacRate.toFixed(0) }}</span>
          <span class="lcd-unit">L/min</span>
        </template>
      </div>

      <span v-if="widget.type === 'depth' && widget.showMax" class="lcd-sublabel">
        Max: {{ formatDepth(diveState.maxDepth) }}m
      </span>

      <div v-if="widget.type === 'air' && widget.showGauge" class="air-gauge">
        <div class="air-gauge-bar">
          <div class="air-gauge-fill" :class="airClass" :style="{ width: `${airPercent}%` }"></div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.display-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.lcd-value-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Sizes are relative to the screen width (the screen is a size container) */
.display-cell .lcd-value {
  line-height: 1.1;
}
.size-sm .lcd-value {
  font-size: max(1.1rem, 6cqi);
}
.size-md .lcd-value {
  font-size: max(1.4rem, 7.5cqi);
}
.size-lg .lcd-value {
  font-size: max(1.75rem, 9cqi);
}
.size-xl .lcd-value {
  font-size: max(2.5rem, 14cqi);
}

.display-cell .lcd-label {
  font-size: max(0.625rem, 2.4cqi);
}

.display-cell .lcd-unit {
  font-size: max(0.75rem, 3cqi);
}

.lcd-sublabel {
  font-family: var(--dc-font-ui);
  font-size: max(0.75rem, 2.6cqi);
  color: var(--dc-lcd-text-dim);
  margin-top: 4px;
}

.air-gauge {
  margin-top: 8px;
}

.ascent-bar {
  height: max(48px, 14cqi);
}
</style>
