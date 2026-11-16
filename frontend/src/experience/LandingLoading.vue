<script setup lang="ts">
import GallopingDeer from "../components/symbiose/GallopingDeer.vue";
import type { LoadingState } from "./render-quality";
withDefaults(
  defineProps<{
    state: LoadingState;
    appHref: string;
    lightweightAvailable?: boolean;
  }>(),
  { lightweightAvailable: true },
);
defineEmits<{ lightweight: [] }>();
</script>

<template>
  <section
    class="sx-landing-loading"
    aria-label="Préparation de l’expérience"
    data-testid="landing-loading"
  >
    <div class="sx-loading-content">
      <p class="sx-loading-kicker">SYMBIOSE · NORMANDIE</p>
      <div class="sx-loading-deer" aria-hidden="true"><GallopingDeer /></div>
      <h2>Le voyage se prépare.</h2>
      <p class="sx-loading-status" role="status" aria-live="polite">
        {{ state.label }}
      </p>
      <div
        class="sx-loading-track"
        role="progressbar"
        aria-label="Chargement de l’expérience"
        :aria-valuenow="Math.round(state.progress * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuetext="state.label"
      >
        <span :style="{ transform: `scaleX(${state.progress})` }" />
      </div>
      <p class="sx-loading-hint">La qualité s’adapte à votre appareil.</p>
      <button
        v-if="lightweightAvailable"
        type="button"
        @click="$emit('lightweight')"
      >
        Continuer en version légère sans 3D <span aria-hidden="true">→</span>
      </button>
      <a :href="appHref">Accéder à l’application</a>
    </div>
  </section>
</template>

<style scoped>
.sx-landing-loading {
  --sym-primary: #203b2d;
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  overflow: auto;
  background: #13291f;
  color: #f5f8ef;
}
.sx-loading-content {
  width: min(460px, calc(100% - 48px));
  padding: 32px 0;
  text-align: center;
}
.sx-loading-kicker {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.22em;
  color: #d4e5bc;
}
.sx-loading-deer {
  width: 165px;
  margin: 8px auto 0;
  color: #d2e9b5;
}
.sx-loading-deer :deep(.login-deer) {
  --deer-stride-duration: 1000ms;
  --deer-far-offset: -216.667ms;
}
.sx-landing-loading.sx-loader-leave-active {
  transition: opacity 0.8s ease;
}
.sx-landing-loading.sx-loader-leave-to {
  opacity: 0;
}
.sx-loading-content h2 {
  margin: 4px 0 14px;
  font:
    400 clamp(28px, 4vw, 40px) / 1.15 Georgia,
    serif;
}
.sx-loading-status {
  min-height: 22px;
  font-size: 13px;
  color: #e0e8d6;
}
.sx-loading-track {
  height: 3px;
  overflow: hidden;
  margin: 22px 0 14px;
  background: #ffffff29;
}
.sx-loading-track span {
  display: block;
  height: 100%;
  background: #b9ef84;
  transform-origin: left;
  transition: transform 0.6s ease;
}
.sx-loading-hint {
  margin: 0 0 28px;
  font-size: 12px;
  color: #c7d6bc;
}
.sx-loading-content button {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 12px;
  border: 1px solid #b9ef8466;
  color: #f0f8e9;
  font-size: 12px;
}
.sx-loading-content button:hover {
  background: #ffffff0d;
}
.sx-loading-content a {
  display: inline-block;
  padding: 16px 8px 0;
  color: #d4e5bc;
  font-size: 12px;
}
@media (prefers-reduced-motion: reduce) {
  .sx-landing-loading.sx-loader-leave-active {
    transition: none;
  }
  .sx-loading-deer :deep(.login-deer) {
    display: block;
  }
  .sx-loading-deer :deep(*) {
    animation: none !important;
  }
  .sx-loading-track span {
    transition: none;
  }
}
</style>
