import { afterEach, describe, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import NarrativeOverlay from "../../src/experience/NarrativeOverlay.vue";
import ExcursionOverlay from "../../src/experience/excursions/ExcursionOverlay.vue";
import PitchVisual from "../../src/experience/PitchVisual.vue";
import PitchSources from "../../src/experience/PitchSources.vue";
import { narrativeCues } from "../../src/experience/narrative-cues";
import {
  editorialFacts,
  sceneEditorial,
  notebookEditorial,
} from "../../src/experience/editorial-content";

const wrappers: VueWrapper[] = [];
const keep = <T extends VueWrapper>(wrapper: T) => {
  wrappers.push(wrapper);
  return wrapper;
};
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

describe("one editorial narrative, two navigation modes", () => {
  it("renders the exact shared title for every scene and every jury event, including returns and the whole epilogue", () => {
    for (const cue of narrativeCues) {
      expect(sceneEditorial(cue).exploration.length).toBeGreaterThan(100);
      for (const presentation of [false, true]) {
        for (const seconds of new Set([
          cue.events[0].start,
          ...cue.events.map((event) => event.start),
          ...(cue.end === 300 ? [300] : []),
        ])) {
          const wrapper = keep(
            cue.excursion
              ? mount(ExcursionOverlay, {
                  props: {
                    state: { id: cue.excursion, local: 0.4, weight: 1 },
                    seconds,
                    presentation,
                  },
                })
              : mount(NarrativeOverlay, {
                  props: {
                    progress: 0,
                    seconds,
                    presentation,
                    reducedMotion: true,
                  },
                }),
          );
          expect(normalize(wrapper.get("h2").text())).toBe(
            normalize(cue.title),
          );
          if (!presentation)
            expect(wrapper.get(".sx-exploration-detail").text()).toBe(
              sceneEditorial(cue).exploration,
            );
          else
            expect(wrapper.find(".sx-exploration-detail").exists()).toBe(false);
          wrapper.unmount();
          wrappers.pop();
        }
      }
    }
  });

  it("uses the return scene's own screen points and does not repeat the opening question", () => {
    const cue = narrativeCues.find((cue) => cue.id === "forest-return")!;
    const wrapper = keep(
      mount(NarrativeOverlay, {
        props: {
          progress: 0,
          seconds: 42,
          presentation: false,
          reducedMotion: true,
        },
      }),
    );
    expect(
      wrapper.findAll(".sx-pitch-points li").map((item) => item.text()),
    ).toEqual(cue.screen);
    expect(wrapper.text()).not.toContain("Qui habite ici ?");
  });

  it("keeps all five illustrative lighting phases under manual control without changing their factual content", async () => {
    const wrapper = keep(
      mount(PitchVisual, {
        props: { chapter: "meadow", seconds: 135, presentation: false },
      }),
    );
    const cue = narrativeCues.find((cue) => cue.id === "meadow")!;
    const buttons = wrapper.findAll(".sx-case-steps button");
    expect(buttons).toHaveLength(5);
    for (const [index, phase] of cue.events.entries()) {
      await buttons[index].trigger("click");
      expect(
        wrapper.get("[data-demo-stage]").attributes("data-demo-stage"),
      ).toBe(phase.id);
      expect(wrapper.get(".sx-demo-copy h3").text()).toBe(phase.label);
      expect(wrapper.text()).toContain(editorialFacts.lighting);
    }
    await wrapper.setProps({ seconds: 150 });
    expect(wrapper.get("[data-demo-stage]").attributes("data-demo-stage")).toBe(
      "lighting-sources",
    );
    expect(wrapper.findAll(".sx-design-catalogue section li")).toHaveLength(12);
    expect(wrapper.get(".sx-design-catalogue").text()).toContain(
      editorialFacts.alternatives,
    );
    await wrapper.get(".sx-jury-demo button.sx-inline-source").trigger("click");
    expect(wrapper.emitted("sources")).toHaveLength(1);
  });

  it("discloses synthetic observations in both wetland modes and the current classifier in discovery", async () => {
    const wrapper = keep(
      mount(PitchVisual, {
        props: { chapter: "wetland", seconds: 103, presentation: false },
      }),
    );
    for (const presentation of [false, true]) {
      await wrapper.setProps({ presentation });
      expect(wrapper.get(".sx-territory-limit").text()).toBe(
        editorialFacts.territory,
      );
    }
    await wrapper.setProps({
      chapter: "rivers",
      seconds: 73,
      presentation: false,
    });
    expect(wrapper.text()).toContain(editorialFacts.classifier);
    expect(wrapper.text()).toContain(editorialFacts.pipeline);
    expect(wrapper.findAll(".sx-living-pipeline li button")).toHaveLength(6);
  });

  it("explains manual jury startup in the shared notebook and uses the same thirteen titles", async () => {
    const wrapper = keep(
      mount(PitchSources, { props: { chapterId: "rivers" } }),
    );
    expect(wrapper.text()).toContain(editorialFacts.classifier);
    expect(wrapper.text()).toContain(notebookEditorial.archives);
    await wrapper.findAll(".sx-book-tabs button")[1].trigger("click");
    expect(wrapper.text()).toContain(notebookEditorial.timing);
    expect(wrapper.text()).not.toContain(
      "la lecture continue démarre à l’arrivée",
    );
    expect(
      wrapper
        .findAll(".sx-speaker-chapter h3")
        .map((heading) => normalize(heading.text())),
    ).toEqual(narrativeCues.map((cue) => normalize(cue.title)));
  });
});
