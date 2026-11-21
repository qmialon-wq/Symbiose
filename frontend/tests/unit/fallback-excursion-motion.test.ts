import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import ExcursionFallback from "../../src/experience/excursions/ExcursionFallback.vue";

const wrappers: VueWrapper[] = [];
beforeEach(() => {
  vi.stubGlobal(
    "Image",
    class {
      onload?: () => void;
      onerror?: () => void;
      value = "";
      set src(value: string) {
        this.value = value;
        if (value) queueMicrotask(() => this.onload?.());
      }
      get src() {
        return this.value;
      }
      decode() {
        return Promise.resolve();
      }
    },
  );
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.unstubAllGlobals();
});

for (const id of ["drone", "marine"] as const) {
  it(`keeps ${id} on a stable illustration while the reduced-motion jury clock advances`, async () => {
    const wrapper = mount(ExcursionFallback, {
      props: { state: { id, local: 0, weight: 1 }, reducedMotion: true },
    });
    wrappers.push(wrapper);
    await flushPromises();
    const still = wrapper.get(".sx-excursion-photographs").html();
    expect(wrapper.find("svg").exists()).toBe(false);
    for (const local of [0.1, 0.3, 0.55, 0.9, 1]) {
      await wrapper.setProps({ state: { id, local, weight: 1 } });
      expect(wrapper.get(".sx-excursion-photographs").html()).toBe(still);
    }
    await wrapper.setProps({
      reducedMotion: false,
      state: { id, local: 0.1, weight: 1 },
    });
    const discovery = wrapper.get(".sx-excursion-photographs").html();
    await wrapper.setProps({ state: { id, local: 0.5, weight: 1 } });
    if (id === "marine")
      expect(wrapper.get(".sx-excursion-photographs").html()).not.toBe(
        discovery,
      );
    else
      expect(wrapper.get(".sx-excursion-photographs").html()).toBe(discovery);
  });
}
