<script setup lang="ts">
import { computed } from 'vue';
import type { ComputerModel } from '../types/computer';

const props = defineProps<{
  modelValue: string;
  models: ComputerModel[];
  errors?: string[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [id: string];
}>();

const selected = computed(() => props.models.find((m) => m.id === props.modelValue));

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <div class="model-selector">
    <label class="model-label" for="computer-model">Modèle d'ordinateur</label>

    <select
      id="computer-model"
      class="model-select"
      :value="modelValue"
      :disabled="loading"
      @change="onChange"
    >
      <option v-for="m in models" :key="m.id" :value="m.id">{{ m.name }}</option>
    </select>

    <div v-if="selected" class="model-description">
      <p>{{ selected.description }}</p>
      <p class="model-note">
        Seul l'affichage change : les calculs restent ceux de SimDive (Bühlmann ZHL-16C), pas ceux
        de l'algorithme d'un fabricant.
      </p>
    </div>

    <ul v-if="errors && errors.length > 0" class="model-errors">
      <li v-for="(error, i) in errors" :key="i">{{ error }}</li>
    </ul>
  </div>
</template>

<style scoped>
.model-label {
  display: block;
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dc-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.model-select {
  width: 100%;
  padding: 12px 16px;
  background: var(--dc-bg-panel);
  border: 2px solid var(--dc-accent-blue);
  border-radius: var(--dc-border-radius);
  color: var(--dc-lcd-text);
  font-family: var(--dc-font-ui);
  font-size: 1rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2300d4ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 48px;
}

.model-select:focus {
  outline: none;
  border-color: var(--dc-accent-cyan);
  box-shadow: var(--dc-glow);
}

.model-select option {
  background: var(--dc-bg-primary);
  color: white;
}

.model-description {
  margin-top: 8px;
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
  color: var(--dc-lcd-text-dim);
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--dc-border-radius);
}

.model-note {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--dc-lcd-warning);
}

.model-errors {
  margin-top: 8px;
  padding: 12px 12px 12px 28px;
  font-family: var(--dc-font-ui);
  font-size: 0.8125rem;
  color: var(--dc-lcd-critical);
  background: rgba(255, 51, 68, 0.1);
  border-radius: var(--dc-border-radius);
}
</style>
