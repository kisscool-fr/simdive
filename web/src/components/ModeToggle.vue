<script setup lang="ts">
import type { DisplayMode } from '../types/dive';

defineProps<{
  modelValue: DisplayMode;
}>();

const emit = defineEmits<{
  'update:modelValue': [mode: DisplayMode];
}>();
</script>

<template>
  <div class="mode-toggle">
    <button
      class="mode-btn"
      :class="{ active: modelValue === 'essential' }"
      @click="emit('update:modelValue', 'essential')"
    >
      Essentiel
    </button>
    <button
      class="mode-btn"
      :class="{ active: modelValue === 'expert' }"
      @click="emit('update:modelValue', 'expert')"
    >
      Expert
    </button>
  </div>
</template>
