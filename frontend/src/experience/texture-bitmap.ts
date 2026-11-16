/** Keep downloaded source maps intact; cap decoded texture memory on modest GPUs. */
export async function textureBitmap(blob: Blob, maxSize = Infinity) {
  const original = await createImageBitmap(blob);
  const scale = Math.min(
    1,
    maxSize / Math.max(original.width, original.height),
  );
  if (scale >= 1) return original;
  try {
    return await createImageBitmap(original, {
      resizeWidth: Math.max(1, Math.round(original.width * scale)),
      resizeHeight: Math.max(1, Math.round(original.height * scale)),
      resizeQuality: "medium",
    });
  } finally {
    original.close();
  }
}
