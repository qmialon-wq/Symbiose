<script setup lang="ts">
import { ref } from "vue";
import { sceneAsset } from "../runtime-assets";
import poster from "./office-poster.webp";
defineProps<{ local: number }>();
defineEmits<{ ready: [] }>();
const forest = sceneAsset("forest", "primary");
const forestReady = ref(false);
</script>
<template>
  <div
    class="sx-prologue-fallback"
    data-testid="experience-fallback"
    aria-hidden="true"
  >
    <img
      class="sx-prologue-forest"
      :src="forest"
      alt=""
      @load="forestReady = true"
    />
    <div
      class="sx-prologue-photograph"
      :style="{
        opacity: forestReady && local > 0.9 ? Math.max(0, (1 - local) * 10) : 1,
      }"
    >
      <img
        class="sx-prologue-poster"
        :src="poster"
        alt=""
        width="2560"
        height="1440"
        fetchpriority="high"
        @load="$emit('ready')"
        @error="$emit('ready')"
      />
      <span>Prologue · image générée · sans WebGL</span>
    </div>
  </div>
</template>
<style scoped>
.sx-prologue-fallback {
  position: absolute;
  inset: 0;
  background: #081b17;
}
.sx-prologue-forest,
.sx-prologue-photograph {
  position: absolute;
  inset: 0;
}
.sx-prologue-fallback img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}
.sx-prologue-fallback span {
  position: absolute;
  bottom: 190px;
  right: var(--sx-gutter);
  color: #f5f8ef;
  font-size: 10px;
  text-shadow: 0 2px 6px #000;
}
@media (max-width: 760px) {
  .sx-prologue-fallback .sx-prologue-poster {
    object-position: 72% center;
  }
  .sx-prologue-fallback span {
    display: none;
  }
}
</style>
