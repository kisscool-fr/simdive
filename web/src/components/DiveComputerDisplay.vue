<script setup lang="ts">
import { computed } from 'vue';
import type { DiveState, DisplayMode, LayoutConfig } from '../types/dive';
import DisplayCell from './DisplayCell.vue';

const props = defineProps<{
  diveState: DiveState | null;
  displayMode: DisplayMode;
  layoutConfig?: LayoutConfig | null;
}>();

// Default layout configuration (used when no layout is provided)
const defaultLayout: LayoutConfig = {
  id: 'default-fallback',
  name: 'Default',
  description: 'Default layout',
  grid: { columns: 2, gap: '16px' },
  header: { title: 'SimDive', showModeToggle: true },
  cells: [
    { type: 'depth', span: 2, primary: true, showMax: true, label: 'Profondeur' },
    { type: 'time', label: 'Temps' },
    { type: 'ndl', label: 'NDL', labelDeco: 'Palier' },
    { type: 'air', showGauge: true, label: 'Pression' },
    { type: 'autonomy', label: 'Autonomie' },
    { type: 'tts', mode: 'expert', label: 'TTS' },
    { type: 'ceiling', mode: 'expert', label: 'Plafond' },
    { type: 'ascentRate', mode: 'expert', label: 'Vitesse' },
    { type: 'sac', mode: 'expert', label: 'Conso' },
  ],
  sections: { safetyStop: true, decoStops: 'expert', warnings: true },
  theme: {},
};

// Active layout (prop or default)
const layout = computed(() => props.layoutConfig || defaultLayout);

// Filter cells based on display mode
const visibleCells = computed(() => {
  if (!props.diveState) return [];

  return layout.value.cells
    .filter((cell) => {
      // If cell has no mode restriction, always show
      if (!cell.mode) return true;

      // If cell has mode restriction, only show in that mode
      return cell.mode === props.displayMode;
    })
    .filter((cell) => {
      // Special handling for ceiling cell - only show when ceiling > 0
      if (cell.type === 'ceiling' && props.diveState) {
        return props.diveState.deco.ceiling > 0;
      }
      return true;
    });
});

// Grid style based on layout config
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${layout.value.grid.columns}, 1fr)`,
  gap: layout.value.grid.gap,
}));

// Check if safety stop section should be shown
const showSafetyStop = computed(() => {
  if (!props.diveState?.safetyStop.active) return false;
  return layout.value.sections.safetyStop;
});

// Check if deco stops section should be shown
const showDecoStops = computed(() => {
  if (!props.diveState || props.diveState.deco.decoStops.length === 0) return false;

  const decoConfig = layout.value.sections.decoStops;
  if (typeof decoConfig === 'boolean') return decoConfig;
  return decoConfig === props.displayMode;
});

// Check if warnings section should be shown
const showWarnings = computed(() => {
  if (!props.diveState || props.diveState.activeWarnings.length === 0) return false;
  return layout.value.sections.warnings;
});

// Header title from layout
const headerTitle = computed(() => layout.value.header.title);

// Show mode toggle in header
const showModeToggle = computed(() => layout.value.header.showModeToggle);
</script>

<template>
  <div class="dive-computer">
    <div class="dive-computer-header">
      <span class="dive-computer-title">{{ headerTitle }}</span>
      <slot v-if="showModeToggle" name="mode-toggle"></slot>
    </div>

    <div v-if="diveState" class="display-content">
      <!-- Dynamic Cell Grid -->
      <div class="display-grid" :style="gridStyle">
        <DisplayCell
          v-for="(cell, index) in visibleCells"
          :key="`${cell.type}-${index}`"
          :cell="cell"
          :dive-state="diveState"
        />
      </div>

      <!-- Safety Stop -->
      <div
        v-if="showSafetyStop"
        class="safety-stop"
        :class="{ active: diveState.safetyStop.remaining > 0 }"
      >
        <span class="lcd-label">Palier de sécurité</span>
        <span class="lcd-value">
          {{ Math.floor(diveState.safetyStop.remaining / 60) }}:{{
            Math.floor(diveState.safetyStop.remaining % 60)
              .toString()
              .padStart(2, '0')
          }}
        </span>
        <span class="lcd-unit">à {{ diveState.safetyStop.depth }}m</span>
      </div>

      <!-- Deco Stops -->
      <div v-if="showDecoStops" class="deco-stops">
        <span class="lcd-label">Paliers obligatoires</span>
        <div v-for="stop in diveState.deco.decoStops" :key="stop.depth" class="deco-stop">
          <span class="deco-stop-depth">{{ stop.depth }}m</span>
          <span class="deco-stop-time">{{ stop.duration }}min</span>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="showWarnings" class="warnings-panel">
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

.display-grid {
  display: grid;
  margin-bottom: 20px;
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
