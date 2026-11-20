<script setup lang="ts">
import { computed } from "vue";
import type { ExcursionState } from "./route";
const props = defineProps<{ state: ExcursionState; reducedMotion?: boolean }>();
const local = computed(() => (props.reducedMotion ? 0.5 : props.state.local));
const underwater = computed(() => local.value > 0.32 && local.value < 0.73);
const droneX = computed(() => 810 + Math.sin(local.value * Math.PI * 5) * 190);
const droneY = computed(() => 270 + Math.cos(local.value * Math.PI * 3) * 28);
</script>
<template>
  <div
    class="sx-excursion-fallback"
    :data-excursion-fallback="state.id"
    aria-hidden="true"
  >
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ex-soil" x2="0" y2="1">
          <stop stop-color="#806448" />
          <stop offset=".42" stop-color="#4d3627" />
          <stop offset="1" stop-color="#201b1a" />
        </linearGradient>
        <linearGradient id="ex-sea" x2="0" y2="1">
          <stop stop-color="#519d9c" />
          <stop offset="1" stop-color="#092f3c" />
        </linearGradient>
        <linearGradient id="ex-field" x2="0" y2="1">
          <stop stop-color="#b2c3af" />
          <stop offset=".48" stop-color="#5d8057" />
          <stop offset="1" stop-color="#2b4933" />
        </linearGradient>
        <pattern
          id="ex-grain"
          width="29"
          height="37"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="8" cy="9" r="2" fill="#d6ad7633" />
          <circle cx="24" cy="27" r="1.5" fill="#1b130f66" />
        </pattern>
      </defs>
      <g v-if="state.id === 'soil'">
        <rect width="1600" height="900" fill="url(#ex-soil)" />
        <path
          d="M0 160Q400 120 800 160T1600 150V210Q1200 190 800 220T0 215Z"
          fill="#668451"
        />
        <path
          d="M0 365Q400 330 800 370T1600 340M0 570Q400 535 800 580T1600 555"
          stroke="#af88616b"
          stroke-width="12"
          fill="none"
        />
        <rect width="1600" height="900" fill="url(#ex-grain)" />
        <g fill="none" stroke="#ba9c74" stroke-linecap="round">
          <path
            d="M1020 0L1000 200L1060 325L1015 500L1120 645"
            stroke-width="24"
          />
          <path
            d="M1010 240L860 360L800 540M1060 330L1200 450L1260 620M1020 470L950 590L930 720"
            stroke-width="10"
          />
          <path
            d="M860 360L790 350M800 520L730 590M1210 475L1330 490M952 595L870 620"
            stroke-width="4"
          />
        </g>
        <rect
          x="650"
          y="185"
          width="52"
          height="500"
          rx="18"
          fill="#a7b1a266"
          stroke="#d3d8c2"
          stroke-width="3"
        />
        <path
          d="M920 650C880 610 900 570 970 580S1100 660 1060 700S945 720 970 680"
          fill="none"
          stroke="#b77d71"
          stroke-width="24"
          stroke-linecap="round"
        />
        <g transform="translate(1230 360) rotate(25)">
          <path
            d="M0 0C-30 0-40 50-10 65S55 50 35 20"
            fill="none"
            stroke="#e4d8af"
            stroke-width="25"
            stroke-linecap="round"
          />
          <circle cx="0" cy="0" r="15" fill="#6f452c" />
        </g>
      </g>
      <g v-else-if="state.id === 'drone'">
        <rect width="1600" height="900" fill="url(#ex-field)" />
        <path d="M0 500Q500 330 900 460T1600 430V900H0Z" fill="#54764b" />
        <path
          d="M0 700L1600 520M250 900L650 455M950 900L1050 430"
          stroke="#293f2c"
          stroke-width="32"
        />
        <g stroke="#b5f58b" stroke-width="2" opacity=".55">
          <path
            d="M700 560H1230M660 610H1280M620 660H1330M580 710H1380M600 740L780 540M800 740L920 540M1000 740L1060 540M1200 740V540"
          />
        </g>
        <path
          :d="`M${droneX} ${droneY}L${droneX - 150} 640Q${droneX} 700 ${droneX + 150} 640Z`"
          fill="#9dff7430"
          stroke="#c1ff9a55"
        />
        <g
          :transform="`translate(${droneX} ${droneY})`"
          stroke="#202e2b"
          stroke-width="12"
          fill="#b3b9aa"
        >
          <path d="M-70-20L70 20M-70 20L70-20" />
          <ellipse
            v-for="n in [-1, 1]"
            :key="n"
            :cx="n * 70"
            cy="-20"
            rx="48"
            ry="8"
          />
          <ellipse
            v-for="n in [-1, 1]"
            :key="'b' + n"
            :cx="n * 70"
            cy="20"
            rx="48"
            ry="8"
          />
          <rect x="-30" y="-20" width="60" height="40" rx="12" />
        </g>
      </g>
      <g v-else>
        <rect
          width="1600"
          height="900"
          :fill="underwater ? 'url(#ex-sea)' : '#b0c8bd'"
        />
        <path
          d="M0 550L400 450L650 480L850 260L1300 210L1600 300V720H0Z"
          :fill="underwater ? '#447371' : '#d7d7b7'"
        />
        <path
          d="M800 520Q1050 200 1240 500L1280 610H1100Q1060 440 1000 610H800Z"
          :fill="underwater ? '#3a6d69' : '#e4e1c5'"
        />
        <path d="M0 580Q400 550 800 580T1600 570V900H0Z" fill="url(#ex-sea)" />
        <g v-if="underwater" fill="none" stroke-linecap="round">
          <path
            v-for="n in 10"
            :key="n"
            :d="`M${580 + n * 75} 900Q${540 + n * 75} 700 ${600 + n * 75} ${650 - (n % 3) * 60}`"
            stroke="#619b6c"
            stroke-width="12"
          />
          <path
            d="M0 80L900 900M650 0L1350 900M1100 0L1600 760"
            stroke="#b6e0ce22"
            stroke-width="70"
          />
        </g>
        <g v-if="underwater" fill="#c2d1ac">
          <path
            v-for="n in 9"
            :key="n"
            :d="`M${690 + n * 65} ${400 + (n % 3) * 45}l28-10l-8 10l8 10Z`"
          />
        </g>
      </g>
    </svg>
    <span class="sx-excursion-fallback-label"
      >Aperçu illustratif · sans WebGL</span
    >
  </div>
</template>
