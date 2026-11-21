<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { editorialFacts } from "../editorial-content";
import type { ExcursionState } from "./route";
import {
  excursionArt,
  excursionArtFrame,
  excursionArtPosition,
  nextExcursionArt,
  ExcursionArtLoader,
  type ExcursionArtFrame,
  type ExcursionArtId,
} from "./fallback-art";
import "./excursions.css";

const props = defineProps<{ state: ExcursionState; reducedMotion?: boolean }>();
const desired = computed(() =>
  excursionArtFrame(props.state.id, props.state.local, props.reducedMotion),
);
const frame = shallowRef<ExcursionArtFrame>();
const status = ref<"loading" | "ready" | "degraded">("loading");
const loader = new ExcursionArtLoader();
let sequence = 0,
  disposed = false;

function publish() {
  if (disposed) return;
  const next = desired.value;
  if (loader.prepared.has(next.base)) {
    frame.value =
      next.overlay && loader.prepared.has(next.overlay)
        ? next
        : { base: next.base, blend: 0 };
  } else if (next.overlay && loader.prepared.has(next.overlay)) {
    frame.value = { base: next.overlay, blend: 0 };
  }
  // Otherwise retain the last decoded image; the main 2D landscape stays behind this layer.
}

watch(
  () => props.state.id,
  async (id) => {
    const version = ++sequence;
    const requested = desired.value;
    const required: ExcursionArtId[] = [
      requested.base,
      ...(requested.overlay ? [requested.overlay] : []),
    ];
    const following = nextExcursionArt(id);
    loader.retain(new Set([...required, ...following]));
    status.value = "loading";
    const results = await Promise.allSettled(
      required.map(async (key) => {
        await loader.prepare(key);
        if (version === sequence) publish();
      }),
    );
    if (disposed || version !== sequence) return;
    publish();
    status.value = results.some((result) => result.status === "rejected")
      ? "degraded"
      : "ready";
    for (const key of following)
      void loader.prepare(key, "low").catch(() => {});
  },
  { immediate: true },
);
watch(desired, publish);
onBeforeUnmount(() => {
  disposed = true;
  sequence++;
  loader.dispose();
});
</script>

<template>
  <div
    class="sx-excursion-fallback sx-excursion-fallback--photographic"
    :data-excursion-fallback="state.id"
    :data-image-state="status"
    :data-image-base="frame?.base ?? ''"
    :data-image-overlay="frame?.overlay ?? ''"
    :data-image-blend="(frame?.blend ?? 0).toFixed(6)"
    :data-reduced-motion="!!reducedMotion"
  >
    <div
      class="sx-excursion-photographs"
      :class="{ 'sx-excursion-photographs--ready': !!frame }"
      aria-hidden="true"
    >
      <template v-if="frame">
        <img
          :key="frame.base"
          class="sx-excursion-photo"
          :data-art="frame.base"
          :src="excursionArt[frame.base].url"
          alt=""
          width="1664"
          height="936"
          :style="{ objectPosition: excursionArtPosition[frame.base] }"
        />
        <img
          v-if="frame.overlay"
          :key="frame.overlay"
          class="sx-excursion-photo sx-excursion-photo--overlay"
          :data-art="frame.overlay"
          :src="excursionArt[frame.overlay].url"
          alt=""
          width="1664"
          height="936"
          :style="{
            opacity: frame.blend,
            objectPosition: excursionArtPosition[frame.overlay],
          }"
        />
      </template>
      <div class="sx-excursion-photo-shade" />
    </div>
    <span class="sx-excursion-fallback-label" aria-hidden="true">{{
      editorialFacts.excursionFallback
    }}</span>
    <p
      v-if="status === 'degraded'"
      class="sx-excursion-image-notice"
      role="status"
    >
      Un décor est indisponible. Le paysage disponible et la navigation sont
      conservés.
    </p>
  </div>
</template>
