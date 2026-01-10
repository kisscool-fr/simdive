<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  saturations: number[];
}>();

// Tissue half-times for labels
const HALF_TIMES = [
  4, 8, 12.5, 18.5, 27, 38, 54, 77, 109, 146, 187, 239, 305, 390, 498, 635,
] as const;

// Get bar class based on saturation percentage
function getBarClass(saturation: number): string {
  if (saturation >= 90) return 'danger';
  if (saturation >= 70) return 'warning';
  return 'safe';
}

// Formatted saturations with min height
const bars = computed(() => {
  return props.saturations.map((sat, index) => ({
    height: Math.max(2, sat),
    class: getBarClass(sat),
    halfTime: HALF_TIMES[index],
    saturation: Math.round(sat),
  }));
});
</script>

<template>
  <div class="tissue-graph">
    <div class="tissue-graph-header">
      <span class="tissue-graph-title">Saturation des tissus (N₂)</span>
      <span class="tissue-graph-legend">
        <span class="legend-item safe">&#9632; &lt;70%</span>
        <span class="legend-item warning">&#9632; 70-90%</span>
        <span class="legend-item danger">&#9632; &gt;90%</span>
      </span>
    </div>

    <div class="tissue-container">
      <!-- M-value reference line at 100% -->
      <div class="m-value-marker">
        <span class="m-value-label">M-value (100%)</span>
        <div class="m-value-line"></div>
      </div>

      <!-- Tissue bars -->
      <div class="tissue-bars">
        <div
          v-for="(bar, index) in bars"
          :key="index"
          class="tissue-bar"
          :title="`T${index + 1}: ${bar.halfTime}min - ${bar.saturation}%`"
        >
          <div class="tissue-bar-fill" :class="bar.class" :style="{ height: `${bar.height}%` }">
            <span v-if="bar.saturation >= 50" class="bar-value">{{ bar.saturation }}</span>
          </div>
        </div>
      </div>

      <!-- Labels -->
      <div class="tissue-labels">
        <span v-for="index in bars.length" :key="index" class="tissue-label">
          {{ index }}
        </span>
      </div>
    </div>

    <div class="tissue-info">
      <span class="info-text">
        Compartiments 1-16 (demi-vie: {{ HALF_TIMES[0] }} - {{ HALF_TIMES[15] }} min)
      </span>
    </div>
  </div>
</template>

<style scoped>
.tissue-graph {
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  padding: 20px;
  margin-top: 20px;
}

.tissue-graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.tissue-graph-title {
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dc-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tissue-graph-legend {
  display: flex;
  gap: 12px;
  font-family: var(--dc-font-ui);
  font-size: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-item.safe {
  color: var(--dc-lcd-text);
}

.legend-item.warning {
  color: var(--dc-lcd-warning);
}

.legend-item.danger {
  color: var(--dc-lcd-critical);
}

.tissue-container {
  position: relative;
}

.m-value-marker {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  pointer-events: none;
}

.m-value-label {
  position: absolute;
  top: -4px;
  right: 0;
  font-family: var(--dc-font-ui);
  font-size: 0.625rem;
  color: var(--dc-lcd-critical);
  opacity: 0.7;
}

.m-value-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--dc-lcd-critical);
  opacity: 0.5;
}

.tissue-bars {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 120px;
  padding-top: 8px;
}

.tissue-bar {
  flex: 1;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px 4px 0 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  cursor: help;
  transition: transform 0.2s ease;
}

.tissue-bar:hover {
  transform: scaleY(1.02);
}

.tissue-bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition:
    height 0.3s ease,
    background 0.3s ease;
  min-height: 2px;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.bar-value {
  font-family: var(--dc-font-digital);
  font-size: 0.5rem;
  color: rgba(0, 0, 0, 0.7);
  padding-top: 2px;
}

.tissue-bar-fill.safe {
  background: linear-gradient(180deg, var(--dc-lcd-text) 0%, #00994d 100%);
}

.tissue-bar-fill.warning {
  background: linear-gradient(180deg, var(--dc-lcd-warning) 0%, #cc9900 100%);
}

.tissue-bar-fill.danger {
  background: linear-gradient(180deg, var(--dc-lcd-critical) 0%, #cc0022 100%);
}

.tissue-labels {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.tissue-label {
  flex: 1;
  text-align: center;
  font-family: var(--dc-font-digital);
  font-size: 0.625rem;
  color: var(--dc-lcd-text-dim);
}

.tissue-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
}

.info-text {
  font-family: var(--dc-font-ui);
  font-size: 0.75rem;
  color: var(--dc-lcd-text-dim);
}

@media (max-width: 640px) {
  .tissue-bars {
    height: 80px;
  }

  .tissue-label {
    font-size: 0.5rem;
  }

  .bar-value {
    display: none;
  }
}
</style>
