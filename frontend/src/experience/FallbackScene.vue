<script setup lang="ts">
import { editorialFacts } from "./editorial-content";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { fallbackFrame } from "./fallback-frame";
import { sceneAsset } from "./runtime-assets";
import { chapterIds, type ChapterId } from "./config";
const props = defineProps<{ progress: number; reducedMotion: boolean }>();
const emit = defineEmits<{ ready: [] }>();
const rig = computed(() => fallbackFrame(props.progress, props.reducedMotion));
const frame = ref<ReturnType<typeof fallbackFrame>>({
    from: "forest",
    to: "forest",
    opacity: 0,
  }),
  loading = ref(true),
  failure = ref(false);
let sequence = 0,
  disposed = false;
const cache = new Map<string, Promise<void>>();
const prepared = new Set<ChapterId>();
const pending = new Set<() => void>();
function prepare(id: ChapterId) {
  if (!cache.has(id))
    cache.set(
      id,
      new Promise<void>((resolve, reject) => {
        const image = new Image();
        let settled = false;
        const finish = (error = false) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          pending.delete(cancel);
          image.onload = null;
          image.onerror = null;
          if (error) {
            cache.delete(id);
            reject(new Error(id));
          } else {
            prepared.add(id);
            resolve();
          }
        };
        const cancel = () => {
          image.src = "";
          finish(true);
        };
        const timeout = setTimeout(cancel, 8000);
        pending.add(cancel);
        image.onload = () => {
          void image.decode().then(
            () => finish(),
            () => finish(true),
          );
        };
        image.onerror = () => finish(true);
        image.src = sceneAsset(id, "primary");
      }),
    );
  return cache.get(id)!;
}
function publish() {
  const desired = rig.value;
  if (disposed || !prepared.has(desired.from)) return;
  frame.value = prepared.has(desired.to)
    ? desired
    : { from: desired.from, to: desired.from, opacity: 0 };
}
function holdCompleteImage() {
  const visible =
    frame.value.opacity >= 0.5 ? frame.value.to : frame.value.from;
  frame.value = { from: visible, to: visible, opacity: 0 };
}
watch(
  () => `${rig.value.from}/${rig.value.to}`,
  async () => {
    const version = ++sequence,
      from = rig.value.from,
      to = rig.value.to;
    loading.value = true;
    failure.value = false;
    holdCompleteImage();
    try {
      // Une image suivante indisponible ne doit pas bloquer le chapitre courant.
      await prepare(from);
      if (disposed || version !== sequence) return;
      publish();
      emit("ready");
      await prepare(to);
      if (disposed || version !== sequence) return;
      publish();
      const next = chapterIds[chapterIds.indexOf(to) + 1];
      if (next) void prepare(next).catch(() => {});
    } catch {
      if (!disposed && version === sequence) {
        holdCompleteImage();
        failure.value = true;
        emit("ready");
      }
    } finally {
      if (!disposed && version === sequence) loading.value = false;
    }
  },
  { immediate: true },
);
watch(rig, publish);
onBeforeUnmount(() => {
  disposed = true;
  sequence++;
  pending.forEach((cancel) => cancel());
  pending.clear();
  cache.clear();
  prepared.clear();
});
</script>
<template>
  <div
    class="sx-fallback-scene"
    data-testid="experience-fallback"
    :data-chapter="frame.from"
    :data-next="frame.to"
    :data-blend="frame.opacity.toFixed(6)"
    :data-requested-chapter="rig.from"
  >
    <img :src="sceneAsset(frame.from, 'primary')" alt="" /><img
      :src="sceneAsset(frame.to, 'primary')"
      alt=""
      :style="{ opacity: frame.opacity }"
    />
    <p>{{ editorialFacts.fallback }}</p>
    <span v-if="loading" role="status">Chargement du prochain paysage…</span
    ><span v-if="failure" role="alert"
      >Un paysage est indisponible. Le récit et la navigation restent
      accessibles.</span
    >
  </div>
</template>
