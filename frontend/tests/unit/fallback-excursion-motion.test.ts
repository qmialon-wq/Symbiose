import { afterEach, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import ExcursionFallback from "../../src/experience/excursions/ExcursionFallback.vue";

const wrappers: VueWrapper[] = [];
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

for (const id of ["drone", "marine"] as const) {
  it(`keeps ${id} on a stable illustration while the reduced-motion jury clock advances`, async () => {
    const wrapper = mount(ExcursionFallback, {
      props: { state: { id, local: 0, weight: 1 }, reducedMotion: true },
    });
    wrappers.push(wrapper);
    const still = wrapper.get("svg").html();
    for (const local of [0.1, 0.3, 0.55, 0.9, 1]) {
      await wrapper.setProps({ state: { id, local, weight: 1 } });
      expect(wrapper.get("svg").html()).toBe(still);
    }
    await wrapper.setProps({
      reducedMotion: false,
      state: { id, local: 0.1, weight: 1 },
    });
    const discovery = wrapper.get("svg").html();
    await wrapper.setProps({ state: { id, local: 0.5, weight: 1 } });
    expect(wrapper.get("svg").html()).not.toBe(discovery);
  });
}
