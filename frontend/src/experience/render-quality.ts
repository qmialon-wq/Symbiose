export type QualityPreference = "auto" | "eco" | "standard";
export type RenderQuality = "standard" | "eco";
export const qualityStorageKey = "symbiose:landing-quality:v1";

export interface DeviceHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  mobile?: boolean;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
    downlink?: number;
  };
}

export function deviceHints(): DeviceHints {
  const device = navigator as Navigator & DeviceHints;
  return {
    hardwareConcurrency: device.hardwareConcurrency,
    deviceMemory: device.deviceMemory,
    mobile: window.matchMedia("(max-width: 600px)").matches,
    connection: device.connection,
  };
}

export function constrainedConnection(hints: DeviceHints) {
  const connection = hints.connection;
  return (
    !!connection &&
    (!!connection.saveData ||
      /^(slow-2g|2g|3g)$/.test(connection.effectiveType ?? "") ||
      (connection.downlink !== undefined &&
        connection.downlink > 0 &&
        connection.downlink < 2))
  );
}

export function initialQuality(
  preference: QualityPreference,
  hints: DeviceHints,
): RenderQuality {
  if (preference !== "auto") return preference;
  return hints.mobile ||
    constrainedConnection(hints) ||
    (hints.hardwareConcurrency !== undefined &&
      hints.hardwareConcurrency <= 4) ||
    (hints.deviceMemory !== undefined && hints.deviceMemory <= 4)
    ? "eco"
    : "standard";
}

/** Bound fragment work even on a large/high-density screen. */
export function renderPixelRatio(
  quality: RenderQuality,
  width: number,
  height: number,
  dpr: number,
) {
  const pixels = Math.max(1, width * height);
  const cap = quality === "eco" ? 0.8 : 1.5;
  const budget = quality === "eco" ? 900_000 : 2_600_000;
  return Math.min(Math.max(0.5, dpr), cap, Math.sqrt(budget / pixels));
}

export function readQualityPreference(): QualityPreference {
  try {
    const value =
      new URLSearchParams(location.search).get("quality") ||
      localStorage.getItem(qualityStorageKey);
    return value === "eco" || value === "standard" ? value : "auto";
  } catch {
    return "auto";
  }
}

export interface LoadingState {
  progress: number;
  label: string;
}
