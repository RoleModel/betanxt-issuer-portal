/**
 * Browser-only logo utilities: resolve logo paths from a client name/ticker and
 * load logos as PNG data URLs (rasterizing SVGs via `<canvas>`).
 *
 * These functions use `fetch`, `document`, `Image`, `canvas`, and `FileReader`,
 * so they must run in the browser (client components, not SSR/Node). PNG data
 * URLs are handy when embedding logos into generated PDFs or `<img src>`.
 *
 * @module logo/browser
 */

/**
 * Compute a logo base path (without extension) from a client name/ticker.
 *
 * Ticker wins when present (uppercased, matching typical asset naming); then
 * company name (lowercased, alphanumerics only); otherwise a generic fallback.
 *
 * @param clientName - Full client/company name.
 * @param ticker - Stock ticker.
 * @param fallbackBase - Base path when neither is provided.
 * @returns A path base such as `/logos/WEN_logo` (no file extension).
 */
export function computeClientLogoBase(
  clientName?: string,
  ticker?: string,
  fallbackBase = "/images/logo",
): string {
  if (ticker) return `/logos/${ticker.toUpperCase()}_logo`;
  if (clientName) return `/logos/${clientName.toLowerCase().replace(/[^a-z0-9]/g, "")}_logo`;
  return fallbackBase;
}

/**
 * Compute a display logo `src` (with extension), preferring SVG for UI use.
 *
 * @param clientName - Full client/company name.
 * @param ticker - Stock ticker.
 * @param defaultSrc - Returned when no client-specific base can be built.
 * @param suffix - Optional suffix appended to the base (e.g. `"-dark"`).
 * @returns An SVG URL under `/logos/`, or `defaultSrc`.
 */
export function computeClientLogoSrc(
  clientName?: string,
  ticker?: string,
  defaultSrc = "/images/logo.svg",
  suffix?: string,
): string {
  const base = computeClientLogoBase(clientName, ticker);
  if (base.startsWith("/logos/")) return `${suffix ? `${base}${suffix}` : base}.svg`;
  return defaultSrc;
}

/**
 * Read a `Blob` as a data URL. Browser-only.
 *
 * @param blob - The blob to encode.
 * @returns A promise resolving to the `data:` URL string.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Expected string result from readAsDataURL"));
    };
    reader.onerror = () => reject(new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Load an image URL into an `HTMLImageElement`. Browser-only.
 *
 * @param src - Image URL (may be an object URL).
 * @returns A promise resolving to the loaded image element.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load error"));
    img.src = src;
  });
}

/**
 * Rasterize any image blob (SVG or otherwise) to a PNG data URL via `<canvas>`.
 * Browser-only.
 *
 * @param blob - Source image blob.
 * @returns A promise resolving to a `data:image/png;base64,...` URL.
 * @throws {Error} If a 2D canvas context is unavailable.
 */
async function rasterizeImageToPng(blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const width = img.naturalWidth || 300;
    const height = img.naturalHeight || 60;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Fetch an image URL and return it as a PNG data URL, rasterizing SVG (or any
 * non-PNG format) via `<canvas>`. Browser-only.
 *
 * @param url - Image URL to fetch.
 * @returns The PNG data URL, or `undefined` if the image cannot be fetched or
 *   converted.
 */
export async function loadImageAsPngDataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    if (blob.type === "image/png") return await blobToDataUrl(blob);
    return await rasterizeImageToPng(blob);
  } catch {
    return undefined;
  }
}

/** Options for {@link loadClientLogoAsPngBase64}. */
export interface LoadClientLogoOptions {
  /** Full client/company name (used to build candidate paths). */
  clientName?: string;
  /** Stock ticker (preferred over name). */
  ticker?: string;
  /** Explicit logo URL that overrides name/ticker resolution. */
  overrideSrc?: string;
  /** Data URL returned when every candidate fails. */
  defaultSrc?: string;
}

/**
 * Load a client's logo as a PNG (base64 data URL), trying PNG first, then SVG
 * (rasterized), then a default fallback. Browser-only.
 *
 * @param options - Client identity and fallback overrides.
 * @returns A promise resolving to a PNG data URL.
 */
export async function loadClientLogoAsPngBase64(options: LoadClientLogoOptions): Promise<string> {
  const { clientName, ticker, overrideSrc, defaultSrc = "/images/logo.png" } = options;

  const base = overrideSrc
    ? overrideSrc.replace(/\.(svg|png)$/i, "")
    : computeClientLogoBase(clientName, ticker);

  const candidates: { url: string; type: "png" | "svg" }[] = [];
  if (base) {
    candidates.push({ url: `${base}.png`, type: "png" });
    candidates.push({ url: `${base}.svg`, type: "svg" });
  }

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate.url);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (candidate.type === "png" && blob.type === "image/png") return await blobToDataUrl(blob);
      return await rasterizeImageToPng(blob);
    } catch {
      // Try the next candidate.
    }
  }

  return blobToDataUrl(await (await fetch(defaultSrc)).blob());
}
