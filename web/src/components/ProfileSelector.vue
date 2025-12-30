<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { DiveProfile, DiveProfilesConfig } from '../types/dive';

const props = defineProps<{
  modelValue?: DiveProfile | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [profile: DiveProfile | null];
  load: [profile: DiveProfile];
}>();

const profiles = ref<DiveProfile[]>([]);
const selectedId = ref<string>('');
const loading = ref(true);
const error = ref<string | null>(null);

// Load profiles from JSON
async function loadProfiles() {
  try {
    loading.value = true;
    error.value = null;

    const response = await fetch('/data/dive-profiles.json');
    if (!response.ok) {
      throw new Error('Erreur de chargement des profils');
    }

    const data: DiveProfilesConfig = await response.json();
    profiles.value = data.profiles;

    // Select first profile by default if none selected
    const firstProfile = profiles.value[0];
    if (firstProfile && !selectedId.value) {
      selectedId.value = firstProfile.id;
      handleSelect();
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur inconnue';
    console.error('Failed to load dive profiles:', e);
  } finally {
    loading.value = false;
  }
}

// Handle profile selection
function handleSelect() {
  const profile = profiles.value.find((p) => p.id === selectedId.value);
  if (profile) {
    emit('update:modelValue', profile);
    emit('load', profile);
  }
}

// Get selected profile
const selectedProfile = ref<DiveProfile | null>(null);

watch(selectedId, () => {
  selectedProfile.value = profiles.value.find((p) => p.id === selectedId.value) || null;
});

// Sync with modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal.id !== selectedId.value) {
      selectedId.value = newVal.id;
    }
  }
);

onMounted(loadProfiles);
</script>

<template>
  <div class="profile-selector">
    <label class="profile-label">Profil de plongée</label>

    <div v-if="loading" class="loading">Chargement des profils...</div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button class="retry-btn" @click="loadProfiles">Réessayer</button>
    </div>

    <template v-else>
      <select v-model="selectedId" class="profile-select" @change="handleSelect">
        <option value="" disabled>Sélectionnez un profil</option>
        <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
          {{ profile.name }}
        </option>
      </select>

      <div v-if="selectedProfile" class="profile-description">
        <p>{{ selectedProfile.description }}</p>
        <div class="profile-details">
          <span class="detail">
            <strong>Bloc:</strong> {{ selectedProfile.tankVolume }}L @
            {{ selectedProfile.initialTankPressure }}bar
          </span>
          <span class="detail"> <strong>Conso:</strong> {{ selectedProfile.sacRate }}L/min </span>
          <span class="detail">
            <strong>Durée:</strong>
            {{ selectedProfile.waypoints[selectedProfile.waypoints.length - 1]?.time || 0 }}min
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-selector {
  margin-bottom: 4px;
}

.profile-label {
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

.profile-details {
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
