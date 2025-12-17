<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { DiveProfile, DisplayMode, PlaybackSpeed } from './types/dive';
import { useDiveEngine } from './composables/useDiveEngine';

import DiveComputerDisplay from './components/DiveComputerDisplay.vue';
import PlaybackControls from './components/PlaybackControls.vue';
import ProfileSelector from './components/ProfileSelector.vue';
import TissueSaturationGraph from './components/TissueSaturationGraph.vue';
import ModeToggle from './components/ModeToggle.vue';

// Initialize dive engine
const engine = useDiveEngine();

// Keyboard controls
function handleKeydown(event: KeyboardEvent) {
  // Ignore if typing in an input field
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Space bar toggles play/pause
  if (event.code === 'Space' && selectedProfile.value) {
    event.preventDefault();
    if (engine.playback.value.state === 'playing') {
      engine.pause();
    } else {
      engine.play();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Display mode state
const displayMode = ref<DisplayMode>('essential');

// Selected profile
const selectedProfile = ref<DiveProfile | null>(null);

// Handle profile load
function handleProfileLoad(profile: DiveProfile) {
  selectedProfile.value = profile;
  engine.loadProfile(profile);
}

// Playback handlers
function handlePlay() {
  engine.play();
}

function handlePause() {
  engine.pause();
}

function handleStop() {
  engine.stop();
}

function handleStepForward() {
  engine.stepForward();
}

function handleStepBackward() {
  engine.stepBackward();
}

function handleSeek(time: number) {
  engine.seekTo(time);
}

function handleSpeedChange(speed: PlaybackSpeed) {
  engine.setSpeed(speed);
}

// Computed for disabled state
const controlsDisabled = computed(() => !selectedProfile.value);
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <span class="title-icon">🤿</span>
          SimDive
        </h1>
        <p class="app-subtitle">Simulateur d'ordinateur de plongée pédagogique</p>
      </div>
    </header>

    <main class="app-main">
      <div class="simulator-container">
        <!-- Left Panel: Profile Selection -->
        <aside class="sidebar">
          <ProfileSelector v-model="selectedProfile" @load="handleProfileLoad" />

          <!-- Display Mode Toggle -->
          <div class="mode-section">
            <label class="section-label">Mode d'affichage</label>
            <ModeToggle v-model="displayMode" />
          </div>

          <!-- Instructions -->
          <div class="instructions">
            <h3 class="instructions-title">Comment utiliser</h3>
            <ol class="instructions-list">
              <li>Sélectionnez un profil de plongée</li>
              <li>Appuyez sur ▶️ ou <kbd>Espace</kbd> pour lancer la simulation</li>
              <li>Utilisez les contrôles pour naviguer dans la plongée</li>
              <li>Basculez entre les modes Essentiel et Expert</li>
            </ol>
          </div>
        </aside>

        <!-- Main Panel: Dive Computer -->
        <div class="main-panel">
          <DiveComputerDisplay :dive-state="engine.diveState.value" :display-mode="displayMode">
            <template #mode-toggle>
              <ModeToggle v-model="displayMode" />
            </template>
          </DiveComputerDisplay>

          <PlaybackControls
            :playback="engine.playback.value"
            :disabled="controlsDisabled"
            @play="handlePlay"
            @pause="handlePause"
            @stop="handleStop"
            @step-forward="handleStepForward"
            @step-backward="handleStepBackward"
            @seek="handleSeek"
            @speed-change="handleSpeedChange"
          />

          <!-- Tissue Saturation Graph (Expert Mode) -->
          <TissueSaturationGraph
            v-if="displayMode === 'expert' && engine.diveState.value"
            :saturations="engine.tissueSaturationPercentages.value"
          />
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>
        SimDive - Application pédagogique pour l'enseignement de la décompression
        <br />
        <small
          >Inspiré par
          <a href="https://e-plouf.com/" target="_blank" rel="noopener">e-Plouf</a></small
        >
      </p>
      <p class="disclaimer">
        ⚠️ Cette application est uniquement destinée à l'enseignement. Ne jamais utiliser pour
        planifier des plongées réelles.
      </p>
    </footer>
  </div>
</template>

<style>
@import './assets/styles/dive-computer.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

body {
  font-family: var(--dc-font-ui);
  background: linear-gradient(135deg, #020617 0%, #0a1628 50%, #0f172a 100%);
  min-height: 100vh;
  color: white;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(180deg, rgba(0, 212, 255, 0.1) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  padding: 24px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--dc-accent-cyan);
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 2.5rem;
}

.app-subtitle {
  margin-top: 4px;
  color: var(--dc-lcd-text-dim);
  font-size: 1rem;
}

.app-main {
  flex: 1;
  padding: 24px;
}

.simulator-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-panel {
  display: flex;
  flex-direction: column;
}

.mode-section {
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  padding: 16px;
}

.section-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dc-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.instructions {
  background: var(--dc-bg-panel);
  border-radius: var(--dc-border-radius);
  padding: 20px;
}

.instructions-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--dc-accent-cyan);
  margin-bottom: 16px;
}

.instructions-list {
  list-style: decimal;
  padding-left: 20px;
  color: var(--dc-lcd-text-dim);
  font-size: 0.875rem;
  line-height: 1.8;
}

.instructions-list li {
  margin-bottom: 8px;
}

.instructions-list kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: var(--dc-font-mono);
  font-size: 0.75rem;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 4px;
  color: var(--dc-accent-cyan);
}

.app-footer {
  background: var(--dc-bg-primary);
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  padding: 24px;
  text-align: center;
  color: var(--dc-lcd-text-dim);
  font-size: 0.875rem;
}

.app-footer a {
  color: var(--dc-accent-cyan);
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

.disclaimer {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid var(--dc-lcd-warning);
  border-radius: var(--dc-border-radius);
  color: var(--dc-lcd-warning);
  font-size: 0.8125rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Responsive */
@media (max-width: 1024px) {
  .simulator-container {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .main-panel {
    order: 1;
  }
}

@media (max-width: 640px) {
  .app-header {
    padding: 16px;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .title-icon {
    font-size: 1.75rem;
  }

  .app-main {
    padding: 16px;
  }
}
</style>
