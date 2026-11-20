import { afterEach, describe, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import JuryDemonstration from "../../src/experience/JuryDemonstration.vue";
import PitchVisual from "../../src/experience/PitchVisual.vue";
import NarrativeOverlay from "../../src/experience/NarrativeOverlay.vue";
import ExcursionOverlay from "../../src/experience/excursions/ExcursionOverlay.vue";
import { narrativeCues } from "../../src/experience/narrative-cues";

const wrappers: VueWrapper[] = [];
function keep<T extends VueWrapper>(wrapper: T): T {
  wrappers.push(wrapper);
  return wrapper;
}
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

describe("clock-driven jury demonstrations", () => {
  it("shows detection, proposed identification and human review without requiring clicks or inventing a result", async () => {
    const wrapper = keep(
      mount(JuryDemonstration, { props: { chapter: "rivers", seconds: 67 } }),
    );
    expect(wrapper.get("[data-demo-stage]").attributes("data-demo-stage")).toBe(
      "river-detect",
    );
    expect(wrapper.text()).toContain("Illustration du parcours");
    expect(wrapper.find("video").exists()).toBe(false);
    expect(wrapper.find("canvas").exists()).toBe(false);
    await wrapper.setProps({ seconds: 73 });
    expect(wrapper.get("[data-demo-stage]").attributes("data-demo-stage")).toBe(
      "river-identify",
    );
    expect(wrapper.text()).toContain("espèce à confirmer");
    expect(wrapper.text()).toContain("SpeciesNet reste une piste");
    expect(wrapper.text()).not.toMatch(/\d+(?:[.,]\d+)?\s*%/);
    await wrapper.setProps({ seconds: 80 });
    expect(wrapper.get("[data-demo-stage]").attributes("data-demo-stage")).toBe(
      "river-review",
    );
    expect(wrapper.text()).toContain("jamais de validation automatique");
    await wrapper.setProps({ seconds: 67 });
    expect(wrapper.get("[data-demo-stage]").attributes("data-demo-stage")).toBe(
      "river-detect",
    );
    expect(wrapper.text()).not.toContain("Classification illustrative");
  });

  it("replays every wetland source and lighting phase deterministically in both directions", async () => {
    const wrapper = keep(
      mount(JuryDemonstration, {
        props: { chapter: "wetland", seconds: 103, reducedMotion: true },
      }),
    );
    for (const chapter of ["wetland", "meadow"] as const) {
      const cue = narrativeCues.find(
        (item) => item.chapter === chapter && !item.excursion,
      )!;
      for (const event of [...cue.events, ...[...cue.events].reverse()]) {
        await wrapper.setProps({ chapter, seconds: event.start });
        expect(
          wrapper.get("[data-demo-stage]").attributes("data-demo-stage"),
        ).toBe(event.id);
        expect(wrapper.get(".sx-demo-copy h3").text()).toBe(event.label);
        expect(wrapper.findAll(".sx-demo-copy")).toHaveLength(1);
      }
    }
    await wrapper.setProps({ chapter: "meadow", seconds: 164 });
    expect(wrapper.findAll(".sx-lighting-options li")).toHaveLength(3);
    expect(wrapper.text()).toContain("Scénario illustratif en Normandie");
    await wrapper.setProps({ seconds: 176 });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("sources")).toHaveLength(1);
    await wrapper.setProps({ seconds: 145 });
    expect(wrapper.find(".sx-lighting-options").exists()).toBe(false);
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("preserves all six discovery steps, archived Norman points and twelve actual design alternatives", async () => {
    const wrapper = keep(
      mount(PitchVisual, { props: { chapter: "rivers", presentation: false } }),
    );
    const buttons = wrapper.findAll(".sx-living-pipeline li button");
    expect(buttons).toHaveLength(6);
    await buttons[3].trigger("click");
    expect(wrapper.get(".sx-pipeline-detail").text()).toContain(
      "confirme, corrige ou rejette",
    );
    await wrapper.setProps({ chapter: "wetland" });
    expect(
      wrapper.findAll(".sx-place-choice button").map((button) => button.text()),
    ).toEqual(["Caen", "Carentan"]);
    expect(wrapper.text()).toContain("FR2500088");
    await wrapper.get(".sx-place-choice button").trigger("click");
    expect(wrapper.text()).not.toContain("FR2500088");
    expect(wrapper.text()).toContain("Aucun objet renvoyé");
    await wrapper.setProps({ chapter: "meadow" });
    expect(wrapper.findAll(".sx-design-catalogue section li")).toHaveLength(12);
    expect(wrapper.findAll(".sx-design-references a")).toHaveLength(3);
    expect(wrapper.text()).toContain(
      "Efficacité écologique locale : non mesurée",
    );
    await wrapper.get(".sx-inline-source").trigger("click");
    expect(wrapper.emitted("sources")).toHaveLength(1);
    await wrapper.setProps({ presentation: true, seconds: 135 });
    expect(wrapper.find(".sx-design-catalogue").exists()).toBe(false);
    await wrapper.setProps({ seconds: 176 });
    expect(wrapper.findAll(".sx-design-catalogue section li")).toHaveLength(12);
  });
});

describe("restrained narrative overlays", () => {
  it("shares the exact return cues with discovery while keeping discovery interactions", async () => {
    const wrapper = keep(
      mount(NarrativeOverlay, {
        props: {
          progress: 1,
          presentation: false,
          seconds: 42,
          reducedMotion: false,
        },
      }),
    );
    expect(wrapper.get("[data-cue]").attributes("data-cue")).toBe(
      "forest-return",
    );
    expect(wrapper.get(".sx-pitch-message").text()).toBe(
      narrativeCues.find((cue) => cue.id === "forest-return")!.message,
    );
    expect(wrapper.find(".sx-discover").exists()).toBe(true);
    await wrapper.setProps({ seconds: 258 });
    expect(wrapper.get("[data-cue]").attributes("data-cue")).toBe(
      "coast-return",
    );
    expect(wrapper.get(".sx-pitch-message").text()).toBe(
      narrativeCues.find((cue) => cue.id === "coast-return")!.message,
    );
    await wrapper.setProps({ seconds: 67 });
    expect(wrapper.findAll(".sx-living-pipeline li button")).toHaveLength(6);
  });

  it("uses the jury cue even when a held camera has another progress, and delays the final signature", async () => {
    const wrapper = keep(
      mount(NarrativeOverlay, {
        props: {
          progress: 0,
          presentation: true,
          seconds: 135,
          reducedMotion: true,
          appHref: "/connexion",
        },
      }),
    );
    expect(wrapper.get("[data-chapter]").attributes("data-chapter")).toBe(
      "meadow",
    );
    expect(wrapper.find(".sx-pitch-points").exists()).toBe(false);
    expect(wrapper.get("h2").text()).toContain("Observer, situer, décider");
    await wrapper.setProps({ seconds: 270 });
    expect(wrapper.find(".sx-final-logo").exists()).toBe(false);
    expect(wrapper.find(".sx-cta").exists()).toBe(false);
    expect(wrapper.find(".sx-pitch-source").exists()).toBe(false);
    await wrapper.setProps({ seconds: 289 });
    expect(wrapper.find(".sx-final-logo").exists()).toBe(true);
    expect(wrapper.get(".sx-cta").attributes("href")).toBe("/connexion");
    await wrapper.setProps({ seconds: 300 });
    expect(wrapper.findAll(".sx-final-logo")).toHaveLength(1);
    expect(wrapper.get("h2").text()).toContain("Comprendre le vivant");
    await wrapper.setProps({ seconds: 280 });
    expect(wrapper.find(".sx-final-logo").exists()).toBe(false);
    expect(wrapper.get("h2").text()).toContain("Comprendre le vivant");
    expect(wrapper.get(".sx-pitch-message").text()).toContain("La même forêt");
  });

  it("reveals one ARQ skill after the flyover and one marine need per clock phase", async () => {
    const wrapper = keep(
      mount(ExcursionOverlay, {
        props: {
          state: { id: "drone", local: 0.2, weight: 1 },
          presentation: true,
          seconds: 186,
        },
      }),
    );
    expect(wrapper.find(".sx-excursion-copy").exists()).toBe(false);
    for (const seconds of [191, 198, 205]) {
      await wrapper.setProps({ seconds });
      expect(wrapper.findAll(".sx-excursion-phase h3")).toHaveLength(1);
      expect(wrapper.find("ul").exists()).toBe(false);
    }
    await wrapper.setProps({ seconds: 191 });
    expect(wrapper.get(".sx-excursion-phase h3").text()).toBe(
      "Intelligence artificielle",
    );
    await wrapper.setProps({
      state: { id: "marine", local: 0.4, weight: 1 },
      seconds: 228,
    });
    expect(wrapper.get(".sx-excursion-phase h3").text()).toBe(
      "Partenaires de terrain",
    );
    await wrapper.setProps({ seconds: 238 });
    expect(wrapper.get(".sx-excursion-phase h3").text()).toContain(
      "expertise scientifique",
    );
    await wrapper.setProps({ seconds: 248 });
    expect(wrapper.get(".sx-excursion-phase h3").text()).toBe(
      "Moyens d’expérimenter",
    );
    await wrapper.get(".sx-excursion-leave").trigger("click");
    expect(wrapper.emitted("leave")).toHaveLength(1);
    await wrapper.setProps({ presentation: false });
    expect(wrapper.findAll("li")).toHaveLength(3);
  });
});
