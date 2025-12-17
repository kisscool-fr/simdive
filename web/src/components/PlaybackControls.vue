<script setup lang="ts">
import { computed } from 'vue';
import type { PlaybackControl, PlaybackSpeed } from '../types/dive';

const props = defineProps<{
  playback: PlaybackControl;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  play: [];
  pause: [];
  stop: [];
  stepForward: [];
  stepBackward: [];
  seek: [time: number];
  speedChange: [speed: PlaybackSpeed];
}>();

const speeds: PlaybackSpeed[] = [0.5, 1, 2, 5, 10];

// Format time as MM:SS
function formatTime(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes - mins) * 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Progress percentage
const progressPercent = computed(() => {
  if (props.playback.totalTime === 0) return 0;
  return (props.playback.currentTime / props.playback.totalTime) * 100;
});

// Handle timeline click
function handleTimelineClick(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  const time = percent * props.playback.totalTime;
  emit('seek', time);
}

// Toggle play/pause
function togglePlayPause() {
  if (props.playback.state === 'playing') {
    emit('pause');
  } else {
    emit('play');
  }
}
</script>

<template>
  <div class="playback-container">
    <!-- Timeline -->
    <div class="timeline">
      <div class="timeline-track" @click="handleTimelineClick">
        <div class="timeline-progress" :style="{ width: `${progressPercent}%` }"></div>
        <div class="timeline-thumb" :style="{ left: `${progressPercent}%` }"></div>
      </div>
      <div class="time-display">
        <span>{{ formatTime(playback.currentTime) }}</span>
        <span>{{ formatTime(playback.totalTime) }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="playback-controls">
      <!-- Step Back -->
      <button
        class="control-btn"
        :disabled="disabled || playback.currentTime <= 0"
        title="Reculer"
        @click="emit('stepBackward')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polygon points="19 20 9 12 19 4 19 20"></polygon>
          <line x1="5" y1="19" x2="5" y2="5"></line>
        </svg>
      </button>

      <!-- Stop -->
      <button class="control-btn" :disabled="disabled" title="Arrêter" @click="emit('stop')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"></rect>
        </svg>
      </button>

      <!-- Play/Pause -->
      <button
        class="control-btn primary"
        :disabled="disabled"
        :title="playback.state === 'playing' ? 'Pause' : 'Lecture'"
        @click="togglePlayPause"
      >
        <!-- Pause Icon -->
        <svg
          v-if="playback.state === 'playing'"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1"></rect>
        </svg>
        <!-- Play Icon -->
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>

      <!-- Step Forward -->
      <button
        class="control-btn"
        :disabled="disabled || playback.currentTime >= playback.totalTime"
        title="Avancer"
        @click="emit('stepForward')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polygon points="5 4 15 12 5 20 5 4"></polygon>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
      </button>

      <!-- Speed Selector -->
      <div class="speed-selector">
        <button
          v-for="speed in speeds"
          :key="speed"
          class="speed-btn"
          :class="{ active: playback.speed === speed }"
          @click="emit('speedChange', speed)"
        >
          {{ speed }}x
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playback-container {
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  padding: 20px;
  margin-top: 20px;
}
</style>
