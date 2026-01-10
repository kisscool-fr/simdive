<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { DiveProfile } from '../types/dive';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps<{
  profile: DiveProfile | null;
  currentTime: number;
}>();

// Collapsible state (closed by default)
const isExpanded = ref(false);

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

// Generate data points for smooth line (interpolate between waypoints)
const chartData = computed(() => {
  if (!props.profile) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const waypoints = props.profile.waypoints;
  const events = props.profile.events;

  // Generate points every 0.5 minutes for smooth curve
  const points: { time: number; depth: number }[] = [];
  const lastWaypoint = waypoints[waypoints.length - 1];
  const totalTime = lastWaypoint ? lastWaypoint.time : 0;

  for (let t = 0; t <= totalTime; t += 0.5) {
    points.push({
      time: t,
      depth: interpolateDepth(t, waypoints),
    });
  }

  // Ensure last point is included
  if (points.length > 0 && points[points.length - 1].time < totalTime) {
    points.push({
      time: totalTime,
      depth: interpolateDepth(totalTime, waypoints),
    });
  }

  // Create event time ranges for coloring
  // const eventTimes = new Set(events.map((e) => e.time));

  // Determine segment colors based on events
  const segmentColors = points.map((point) => {
    // Check if there's an active event around this time
    const hasEvent = events.some((event) => {
      const eventStart = event.time;
      // Events that have an "end" counterpart
      if (event.type === 'breathingRateIncrease') {
        const endEvent = events.filter(
          (e) => e.type === 'breathingRateDecrease' && e.time > eventStart
        )[0];
        const endTime = endEvent ? endEvent.time : totalTime;
        return point.time >= eventStart && point.time <= endTime;
      }
      if (event.type === 'airSharing') {
        const endEvent = events.filter((e) => e.type === 'airSharingEnd' && e.time > eventStart)[0];
        const endTime = endEvent ? endEvent.time : totalTime;
        return point.time >= eventStart && point.time <= endTime;
      }
      if (event.type === 'safetyStopStart') {
        const endEvent = events.filter((e) => e.type === 'safetyStopEnd' && e.time > eventStart)[0];
        const endTime = endEvent ? endEvent.time : totalTime;
        return point.time >= eventStart && point.time <= endTime;
      }
      // Point events - highlight just around the event time
      const pointEventTypes = ['lowAirWarning', 'criticalAirWarning', 'rapidAscent'];
      if (pointEventTypes.indexOf(event.type) !== -1) {
        return Math.abs(point.time - eventStart) < 1;
      }
      return false;
    });
    return hasEvent ? '#ff9500' : '#00d4ff';
  });

  return {
    labels: points.map((p) => p.time.toFixed(1)),
    datasets: [
      {
        label: 'Profondeur (m)',
        data: points.map((p) => p.depth),
        borderColor: segmentColors,
        segment: {
          borderColor: (ctx: { p0DataIndex: number }) =>
            segmentColors[ctx.p0DataIndex] || '#00d4ff',
        },
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
});

// Current position point
const currentPointData = computed(() => {
  if (!props.profile) return null;

  const depth = interpolateDepth(props.currentTime, props.profile.waypoints);
  return {
    time: props.currentTime,
    depth,
  };
});

function interpolateDepth(time: number, waypoints: { time: number; depth: number }[]): number {
  if (waypoints.length === 0) return 0;

  const first = waypoints[0];
  const last = waypoints[waypoints.length - 1];

  if (!first || !last) return 0;
  if (time <= first.time) return first.depth;
  if (time >= last.time) return last.depth;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];

    if (current && next && time >= current.time && time <= next.time) {
      const progress = (time - current.time) / (next.time - current.time);
      return current.depth + (next.depth - current.depth) * progress;
    }
  }

  return last.depth;
}

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0,
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Temps (min)',
        color: '#00994d',
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
      },
      ticks: {
        color: '#00994d',
        font: {
          family: "'Share Tech Mono', monospace",
          size: 10,
        },
        callback: function (_value: string | number, index: number) {
          // Show fewer labels
          if (index % 4 === 0) {
            const labels = chartData.value.labels;
            return labels[index] || '';
          }
          return '';
        },
      },
      grid: {
        color: 'rgba(0, 212, 255, 0.1)',
      },
    },
    y: {
      reverse: true, // Depth increases downward
      beginAtZero: true,
      title: {
        display: true,
        text: 'Profondeur (m)',
        color: '#00994d',
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
      },
      ticks: {
        color: '#00994d',
        font: {
          family: "'Share Tech Mono', monospace",
          size: 10,
        },
      },
      grid: {
        color: 'rgba(0, 212, 255, 0.1)',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      titleColor: '#00d4ff',
      bodyColor: '#00ff88',
      borderColor: '#00d4ff',
      borderWidth: 1,
      titleFont: {
        family: "'Inter', sans-serif",
      },
      bodyFont: {
        family: "'Share Tech Mono', monospace",
      },
      callbacks: {
        title: (items: { label: string }[]) => `Temps: ${items[0]?.label || ''} min`,
        label: (item: { raw: unknown }) =>
          `Profondeur: ${(item.raw as number)?.toFixed(1) || ''} m`,
      },
    },
  },
}));

// Canvas ref for drawing the current position dot
const chartRef = ref<{ chart: ChartJS } | null>(null);

// Dot position calculated from chart scales
const dotPosition = ref<{ left: string; top: string } | null>(null);

// Update dot position using chart's scale system
function updateDotPosition() {
  if (!chartRef.value?.chart || !props.profile || !currentPointData.value) {
    dotPosition.value = null;
    return;
  }

  const chart = chartRef.value.chart;
  const xScale = chart.scales['x'];
  const yScale = chart.scales['y'];

  if (!xScale || !yScale) {
    dotPosition.value = null;
    return;
  }

  // Find the data index closest to current time
  const totalTime = props.profile.waypoints[props.profile.waypoints.length - 1]?.time || 1;
  const timeRatio = props.currentTime / totalTime;
  const dataIndex = Math.round(timeRatio * (chartData.value.labels.length - 1));

  // Get pixel position from chart scales
  const xPixel = xScale.getPixelForValue(dataIndex);
  const yPixel = yScale.getPixelForValue(currentPointData.value.depth);

  // Account for container padding (8px)
  dotPosition.value = {
    left: `${xPixel + 8}px`,
    top: `${yPixel + 8}px`,
  };
}

// Watch for changes and update dot position
watch(
  [() => props.currentTime, () => props.profile, chartRef],
  () => {
    // Use nextTick to ensure chart is rendered
    setTimeout(updateDotPosition, 0);
  },
  { immediate: true }
);

// Also update on chart data changes
watch(chartData, () => {
  setTimeout(updateDotPosition, 50);
});
</script>

<template>
  <div class="dive-profile-chart" :class="{ expanded: isExpanded }">
    <h3 class="chart-title" @click="toggleExpanded">
      <span class="chart-title-text">Profil de plongée</span>
      <span class="chart-title-chevron" :class="{ rotated: isExpanded }">▼</span>
    </h3>

    <div v-show="isExpanded" class="chart-content">
      <div class="chart-container">
        <Line v-if="profile" ref="chartRef" :data="chartData" :options="chartOptions" />
        <div v-else class="no-profile">
          <span>Sélectionnez un profil pour visualiser la plongée</span>
        </div>

        <!-- Current position indicator overlay -->
        <div v-if="profile && dotPosition" class="current-position-dot" :style="dotPosition"></div>
      </div>

      <!-- Legend for events -->
      <div v-if="profile && profile.events.length > 0" class="chart-legend">
        <div class="legend-item">
          <span class="legend-color normal"></span>
          <span class="legend-text">Plongée normale</span>
        </div>
        <div class="legend-item">
          <span class="legend-color event"></span>
          <span class="legend-text">Événement actif</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dive-profile-chart {
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  padding: 16px;
  margin-top: 16px;
}

.chart-title {
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dc-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
  transition: color 0.2s ease;
}

.chart-title:hover {
  color: var(--dc-lcd-text);
}

.chart-title-text {
  flex: 1;
}

.chart-title-chevron {
  font-size: 0.625rem;
  transition: transform 0.3s ease;
  transform: rotate(-90deg);
}

.chart-title-chevron.rotated {
  transform: rotate(0deg);
}

.chart-content {
  margin-top: 12px;
}

.chart-container {
  position: relative;
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--dc-border-radius);
  padding: 8px;
}

.no-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--dc-lcd-text-dim);
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
}

.current-position-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #00ff88;
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 10px #00ff88,
    0 0 20px rgba(0, 255, 136, 0.5);
  z-index: 10;
  pointer-events: none;
  transition:
    left 0.1s linear,
    top 0.1s linear;
}

.chart-legend {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 4px;
  border-radius: 2px;
}

.legend-color.normal {
  background: #00d4ff;
}

.legend-color.event {
  background: #ff9500;
}

.legend-text {
  font-family: var(--dc-font-ui);
  font-size: 0.75rem;
  color: var(--dc-lcd-text-dim);
}
</style>
