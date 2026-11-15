<script setup lang="ts">
import poster from "./office-poster.webp";
defineProps<{ local: number }>();
</script>
<template>
  <div
    class="sx-prologue-fallback"
    aria-hidden="true"
    :style="{ opacity: local > 0.9 ? Math.max(0, (1 - local) * 10) : 1 }"
  >
    <img :src="poster" alt="" />
    <span>Prologue · vue fixe sans WebGL</span>
  </div>
</template>
<style scoped>
.sx-prologue-fallback {
  position: absolute;
  inset: 0;
  background: #323b30;
}
.sx-prologue-fallback img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sx-prologue-fallback span {
  position: absolute;
  bottom: 190px;
  right: var(--sx-gutter);
  color: #f5f8ef;
  font-size: 10px;
  text-shadow: 0 2px 6px #000;
}
</style>
