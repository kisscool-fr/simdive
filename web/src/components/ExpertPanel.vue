<script setup lang="ts">
import { computed } from 'vue';
import type { DiveState } from '../types/dive';
import type { ScreenWidget } from '../types/computer';
import DisplayCell from './DisplayCell.vue';

const props = defineProps<{
  diveState: DiveState;
}>();

// Engine values shown in expert mode, whatever the selected computer model displays
const widgets: ScreenWidget[] = [
  { area: 'tts', type: 'tts', size: 'sm' },
  { area: 'ceiling', type: 'ceiling', size: 'sm' },
  { area: 'ascent', type: 'ascentRate', size: 'sm' },
  { area: 'sac', type: 'sac', size: 'sm' },
  { area: 'deco', type: 'decoStops' },
];

const gradientFactors = computed(
  () =>
    `GF ${Math.round(props.diveState.deco.gfLow * 100)}/${Math.round(props.diveState.deco.gfHigh * 100)}`
);
</script>

<template>
  <section class="expert-panel">
    <h3 class="expert-title">
      Données du moteur
      <span class="expert-algo">Bühlmann ZHL-16C · {{ gradientFactors }}</span>
    </h3>
    <div class="expert-grid">
      <DisplayCell
        v-for="widget in widgets"
        :key="widget.area"
        :widget="widget"
        :dive-state="diveState"
      />
    </div>
  </section>
</template>

<style scoped>
.expert-panel {
  container-type: inline-size;
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  padding: 20px;
  margin-top: 20px;
}

.expert-title {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dc-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

.expert-algo {
  color: var(--dc-lcd-text-dim);
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
}

.expert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.expert-grid :deep(.display-cell) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--dc-border-radius);
  padding: 12px;
}

.expert-grid :deep(.display-cell .lcd-value) {
  font-size: 1.75rem;
}

.expert-grid :deep(.deco-stops) {
  grid-column: 1 / -1;
}
</style>
