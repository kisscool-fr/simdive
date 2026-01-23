<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import type { LayoutConfig, LayoutIndexEntry } from '../types/dive';
import { useLayout } from '../composables/useLayout';

const props = defineProps<{
  modelValue?: LayoutConfig | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [layout: LayoutConfig | null];
  change: [layout: LayoutConfig];
}>();

const layout = useLayout();

const selectedId = ref<string>('default');

// Load layouts on mount
onMounted(async () => {
  await layout.loadLayoutsIndex();
  if (layout.layoutConfig.value) {
    selectedId.value = layout.layoutConfig.value.id;
    emit('update:modelValue', layout.layoutConfig.value);
    emit('change', layout.layoutConfig.value);
  }
});

// Handle layout selection change
async function handleSelect() {
  if (selectedId.value) {
    await layout.loadLayout(selectedId.value);
    if (layout.layoutConfig.value) {
      emit('update:modelValue', layout.layoutConfig.value);
      emit('change', layout.layoutConfig.value);
    }
  }
}

// Sync with modelValue prop
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal.id !== selectedId.value) {
      selectedId.value = newVal.id;
    }
  }
);

// Selected layout details
const selectedLayout = computed(() => layout.layoutConfig.value);
</script>

<template>
  <div class="layout-selector">
    <label class="layout-label">Affichage ordinateur</label>

    <div v-if="layout.loading.value" class="loading">Chargement des layouts...</div>

    <div v-else-if="layout.error.value" class="error">
      {{ layout.error.value }}
      <button class="retry-btn" @click="layout.loadLayoutsIndex()">Réessayer</button>
    </div>

    <template v-else>
      <select v-model="selectedId" class="layout-select" @change="handleSelect">
        <option value="" disabled>Sélectionnez un affichage</option>
        <option v-for="l in layout.layouts.value" :key="l.id" :value="l.id">
          {{ l.name }}
        </option>
      </select>

      <div v-if="selectedLayout" class="layout-description">
        <p>{{ selectedLayout.description }}</p>
        <div class="layout-details">
          <span class="detail">
            <strong>Cellules:</strong> {{ selectedLayout.cells.length }}
          </span>
          <span class="detail">
            <strong>Grille:</strong> {{ selectedLayout.grid.columns }} colonnes
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.layout-selector {
  margin-bottom: 4px;
}

.layout-label {
  display: block;
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dc-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.loading,
.error {
  padding: 16px;
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  color: var(--dc-lcd-text-dim);
  font-family: var(--dc-font-ui);
  text-align: center;
}

.error {
  color: var(--dc-lcd-critical);
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--dc-accent-blue);
  border: none;
  border-radius: var(--dc-border-radius);
  color: white;
  cursor: pointer;
  font-family: var(--dc-font-ui);
}

.retry-btn:hover {
  background: var(--dc-accent-cyan);
}

.layout-select {
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

.layout-select:focus {
  outline: none;
  border-color: var(--dc-accent-cyan);
  box-shadow: var(--dc-glow);
}

.layout-select option {
  background: var(--dc-bg-primary);
  color: white;
}

.layout-description {
  margin-top: 8px;
  font-family: var(--dc-font-ui);
  font-size: 0.875rem;
  color: var(--dc-lcd-text-dim);
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--dc-border-radius);
}

.layout-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
}

.detail {
  font-size: 0.8125rem;
  color: var(--dc-lcd-text);
}

.detail strong {
  color: var(--dc-accent-cyan);
  font-weight: 600;
}
</style>
