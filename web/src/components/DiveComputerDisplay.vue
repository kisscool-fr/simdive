<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { DiveState } from '../types/dive';
import type { ComputerModel } from '../types/computer';
import { THEME_KEYS } from '../types/computer';
import { DEFAULT_COMPUTER_MODEL } from '../composables/useComputerModels';
import DisplayCell from './DisplayCell.vue';

const props = defineProps<{
  diveState: DiveState | null;
  model?: ComputerModel | null;
}>();

const model = computed(() => props.model ?? DEFAULT_COMPUTER_MODEL);

// Current screen, reset when the model changes
const screenIndex = ref(0);
watch(
  () => model.value.id,
  () => {
    screenIndex.value = 0;
  }
);

const screen = computed(() => model.value.screens[screenIndex.value] ?? model.value.screens[0]);
const hasSeveralScreens = computed(() => model.value.screens.length > 1);

function nextScreen() {
  screenIndex.value = (screenIndex.value + 1) % model.value.screens.length;
}

// Theme colours as --dc-* variables, scoped to this element only
const themeStyle = computed(() => {
  const style: Record<string, string> = {};
  const theme = model.value.theme ?? {};
  for (const key of THEME_KEYS) {
    const value = theme[key];
    if (value) style[`--dc-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  }
  return style;
});

const computerClasses = computed(() => [
  'dive-computer',
  `shape-${model.value.formFactor.shape}`,
  `display-${model.value.formFactor.display}`,
]);

const screenStyle = computed(() =>
  model.value.formFactor.shape === 'rect' && model.value.formFactor.aspectRatio
    ? { aspectRatio: model.value.formFactor.aspectRatio }
    : {}
);

const gridStyle = computed(() => ({
  gridTemplateAreas: screen.value.areas.map((row) => `"${row}"`).join(' '),
  ...(screen.value.columns ? { gridTemplateColumns: screen.value.columns } : {}),
}));
</script>

<template>
  <div :class="computerClasses" :style="themeStyle" :data-model="model.id">
    <div class="dive-computer-header">
      <span class="dive-computer-title">{{ model.name }}</span>
      <slot name="mode-toggle"></slot>
    </div>

    <div class="computer-body">
      <div class="screen" :style="screenStyle">
        <div
          v-if="diveState"
          class="screen-grid"
          :class="`cells-${model.formFactor.cellStyle}`"
          :style="gridStyle"
          :data-screen="screen.id"
        >
          <div
            v-for="widget in screen.widgets"
            :key="`${screen.id}-${widget.area}`"
            class="screen-area"
            :style="{ gridArea: widget.area }"
          >
            <DisplayCell :widget="widget" :dive-state="diveState" />
          </div>
        </div>

        <div v-else class="no-data">
          <span class="lcd-label">Sélectionnez un profil de plongée</span>
        </div>
      </div>
    </div>

    <div v-if="hasSeveralScreens" class="computer-controls">
      <div class="screen-indicator">
        <span
          v-for="(s, i) in model.screens"
          :key="s.id"
          class="screen-dot"
          :class="{ active: i === screenIndex }"
        ></span>
        <span class="screen-name">{{ screen.name }}</span>
      </div>
      <button
        type="button"
        class="hw-button"
        aria-label="Écran suivant"
        title="Écran suivant"
        @click="nextScreen"
      >
        ▸
      </button>
    </div>
  </div>
</template>

<style scoped>
.computer-body {
  display: flex;
  justify-content: center;
}

.screen {
  container-type: inline-size;
  width: 100%;
  background: var(--dc-bg-lcd);
  border-radius: var(--dc-border-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Default (SimDive) screen blends into the frame */
.display-color.shape-rect .screen {
  background: transparent;
  padding: 0;
}

.screen-grid {
  display: grid;
  grid-auto-columns: 1fr;
  /* Row spacing comes from the areas' padding so rows of hidden widgets collapse entirely */
  column-gap: 16px;
}

.screen-grid.cells-flat {
  column-gap: 12px;
}

.screen-area {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 8px;
}

.cells-flat .screen-area {
  padding-block: 2px;
}

.screen-area:empty {
  display: none;
}

.no-data {
  padding: 60px 20px;
  text-align: center;
}

/* Panel cells: each value in its own box */
.cells-panel :deep(.display-cell) {
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  padding: 16px;
  min-height: 100px;
}

.cells-panel :deep(.display-cell.highlight) {
  background: linear-gradient(135deg, var(--dc-bg-lcd) 0%, var(--dc-bg-secondary) 100%);
  border: 2px solid var(--dc-accent-cyan);
  box-shadow: var(--dc-glow);
}

.cells-panel :deep(.display-cell.depth) {
  border-left: 4px solid var(--dc-accent-cyan);
}
.cells-panel :deep(.display-cell.time) {
  border-left: 4px solid var(--dc-lcd-info);
}
.cells-panel :deep(.display-cell.ndl) {
  border-left: 4px solid var(--dc-lcd-text);
}
.cells-panel :deep(.display-cell.air) {
  border-left: 4px solid var(--dc-gauge-full);
}

/* Flat cells: values drawn directly on the screen */
.cells-flat :deep(.display-cell) {
  padding: 2px;
}

.cells-flat :deep(.safety-stop) {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  column-gap: 6px;
  padding: 8px;
}

.cells-flat :deep(.safety-stop .lcd-label) {
  width: 100%;
}

.cells-flat :deep(.safety-stop .lcd-value) {
  font-size: max(1.4rem, 8cqi);
}

/* Segment LCD: dark digits on a reflective screen, no glow */
.display-segment-lcd .screen {
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.45);
}

.display-segment-lcd :deep(.lcd-value) {
  text-shadow: none;
  font-weight: 700;
}

.display-segment-lcd :deep(.lcd-label),
.display-segment-lcd :deep(.warning-text) {
  color: var(--dc-lcd-text);
}

.display-segment-lcd :deep(.safety-stop),
.display-segment-lcd :deep(.warnings-panel),
.display-segment-lcd :deep(.deco-stop) {
  background: transparent;
  border-color: var(--dc-lcd-text);
  box-shadow: none;
  animation: none;
}

.display-segment-lcd :deep(.safety-stop.active) {
  animation: pulse-critical 1s steps(1) infinite;
}

.display-segment-lcd :deep(.deco-stop-depth),
.display-segment-lcd :deep(.deco-stop-time) {
  color: var(--dc-lcd-text);
}

/* Round watch: circular bezel and screen */
.dive-computer.shape-round {
  max-width: 460px;
  background: none;
  border: none;
  box-shadow: none;
}

.shape-round .computer-body {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 6%;
  background: radial-gradient(circle at 30% 25%, var(--dc-bg-secondary), var(--dc-bg-primary) 75%);
  box-shadow:
    inset 0 0 0 3px rgba(255, 255, 255, 0.08),
    var(--dc-shadow);
}

.shape-round .screen {
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  /* Keep content inside the circle's inscribed square */
  padding: 15%;
}

/* Hardware-like controls */
.computer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  gap: 12px;
}

.screen-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--dc-font-ui);
  font-size: 0.8125rem;
  color: var(--dc-lcd-text-dim);
}

.screen-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.screen-dot.active {
  background: var(--dc-accent-cyan);
}

.screen-name {
  margin-left: 6px;
}

.hw-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--dc-accent-cyan);
  background: var(--dc-bg-panel);
  color: var(--dc-accent-cyan);
  font-size: 1.25rem;
  cursor: pointer;
}

.hw-button:hover,
.hw-button:focus-visible {
  background: var(--dc-accent-blue);
  color: white;
  outline: none;
}
</style>
