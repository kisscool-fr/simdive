<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  pressure: number;
  maxPressure?: number;
}>();

const max = computed(() => props.maxPressure || 200);

const percent = computed(() => {
  return Math.max(0, Math.min(100, (props.pressure / max.value) * 100));
});

const gaugeClass = computed(() => {
  if (percent.value <= 20) return 'gauge-critical';
  if (percent.value <= 33) return 'gauge-low';
  if (percent.value <= 50) return 'gauge-mid';
  return 'gauge-full';
});

// Generate marker positions
const markers = computed(() => {
  const marks = [];
  for (let i = 0; i <= max.value; i += 50) {
    marks.push({
      value: i,
      position: (i / max.value) * 100,
    });
  }
  return marks;
});
</script>

<template>
  <div class="air-gauge-wrapper">
    <div class="air-gauge">
      <div class="air-gauge-bar">
        <div class="air-gauge-fill" :class="gaugeClass" :style="{ width: `${percent}%` }"></div>
        <!-- Marker lines -->
        <div
          v-for="marker in markers"
          :key="marker.value"
          class="gauge-marker"
          :style="{ left: `${marker.position}%` }"
        ></div>
      </div>
      <div class="air-gauge-markers">
        <span
          v-for="marker in markers"
          :key="marker.value"
          class="air-gauge-marker"
          :style="{ left: `${marker.position}%` }"
        >
          {{ marker.value }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.air-gauge-wrapper {
  width: 100%;
  padding: 8px 0;
}

.air-gauge {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.air-gauge-bar {
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: visible;
  position: relative;
}

.air-gauge-fill {
  height: 100%;
  border-radius: 10px;
  transition:
    width 0.3s ease,
    background 0.3s ease;
}

.gauge-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-50%);
}

.air-gauge-markers {
  position: relative;
  height: 16px;
}

.air-gauge-marker {
  position: absolute;
  transform: translateX(-50%);
  font-family: var(--dc-font-digital);
  font-size: 0.625rem;
  color: var(--dc-lcd-text-dim);
}

.gauge-full {
  background: linear-gradient(90deg, var(--dc-gauge-full), #00cc6f);
}

.gauge-mid {
  background: linear-gradient(90deg, #00cc6f, var(--dc-gauge-mid));
}

.gauge-low {
  background: linear-gradient(90deg, var(--dc-gauge-mid), var(--dc-gauge-low));
}

.gauge-critical {
  background: linear-gradient(90deg, var(--dc-gauge-low), var(--dc-gauge-critical));
  animation: pulse-critical 0.5s ease-in-out infinite;
}

@keyframes pulse-critical {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
