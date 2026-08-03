// Shared client branding utilities

export interface ClientBranding {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly tertiaryColor: string;
  readonly ticker: string;
}

export const clientBranding: readonly ClientBranding[] = [
  {
    primaryColor: "#0078A3",
    secondaryColor: "#DAD55E",
    tertiaryColor: "#DB163A",
    ticker: "WEN",
  },
  {
    primaryColor: "#02833F",
    secondaryColor: "#193E2D",
    tertiaryColor: "#193E2D",
    ticker: "PAYC",
  },
  {
    primaryColor: "#920128",
    secondaryColor: "#24272A",
    tertiaryColor: "#24272A",
    ticker: "WWD",
  },
  {
    primaryColor: "#243E89",
    secondaryColor: "#F8EF76",
    tertiaryColor: "#1A1C45",
    ticker: "ELVN",
  },
  {
    primaryColor: "#7600E1",
    secondaryColor: "#2d235a",
    tertiaryColor: "#00FFBC",
    ticker: "DFIN",
  },
  {
    primaryColor: "#ff6400",
    secondaryColor: "#0b232d",
    tertiaryColor: "#98b9e4",
    ticker: "MRSO",
  },
];

// Compute a logo base path (without extension) from client name/ticker
export const computeClientLogoBase = (
  clientName?: string,
  ticker?: string
): string => {
  if (ticker) {
    // Use uppercase for ticker since that's how the logo files are named
    const tickerUpper = ticker.toUpperCase();
    return `/logos/${tickerUpper}_logo`;
  }

  if (clientName) {
    const nameLower = clientName.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");
    return `/logos/${nameLower}_logo`;
  }

  return "/images/betanxt-logo";
};

// Compute a logo src (with extension) matching the AppBar's SVG-first behavior
export const computeClientLogoSrc = (
  clientName?: string,
  ticker?: string,
  defaultSource = "/images/logo.svg",
  suffix?: string
): string => {
  const base = computeClientLogoBase(clientName, ticker);
  // Prefer SVG for UI usage
  if (base.startsWith("/logos/")) {
    const basePath = suffix ? `${base}${suffix}` : base;
    return `${basePath}.svg`;
  }
  return defaultSource;
};

const blobToDataUrl = async (blob: Blob): Promise<string> =>
  await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Expected string result from readAsDataURL"));
      }
    });
    reader.addEventListener("error", () => {
      reject(new Error("Failed to read image blob"));
    });
    reader.readAsDataURL(blob);
  });

const loadImage = async (source: string): Promise<HTMLImageElement> =>
  await new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      resolve(image);
    });
    image.addEventListener("error", () => {
      reject(new Error("Image load error"));
    });
    image.src = source;
  });

// Rasterize any image blob (SVG or otherwise) to PNG via canvas
const rasterizeImageToPng = async (blob: Blob): Promise<string> => {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl);
    const width = image.naturalWidth || 300;
    const height = image.naturalHeight || 60;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context unavailable");
    }
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

// Load the client logo as a PNG base64 string. Tries PNG first, then converts SVG to PNG, then falls back.
export const loadClientLogoAsPngBase64 = async (options: {
  clientName?: string;
  ticker?: string;
  overrideSrc?: string;
}): Promise<string> => {
  const defaultPng = "/images/betanxt-logo.png";
  const { clientName, ticker, overrideSrc } = options;

  // Determine candidates in order of preference
  const base = overrideSrc
    ? overrideSrc.replace(/\.(svg|png)$/i, "")
    : computeClientLogoBase(clientName, ticker);

  // Only the URL matters — whether to rasterize is decided from the response's
  // actual blob type, not from the extension we asked for.
  const candidates: string[] = [];

  // If override or base under /logos, try PNG then SVG
  if (base) {
    candidates.push(`${base}.png`, `${base}.svg`);
  }

  // Always add default PNG fallback
  candidates.push(defaultPng);

  // Attempt candidates in order, stopping at the first that resolves. Awaiting
  // in sequence is deliberate: this is a preference chain, so fetching every
  // candidate up front would request logos that are never used.
  /* eslint-disable no-await-in-loop -- ordered fallback chain */
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (!response.ok) {
        continue;
      }

      // Rasterize anything that is not already a PNG, SVG included.
      const blob = await response.blob();
      return blob.type === "image/png"
        ? await blobToDataUrl(blob)
        : await rasterizeImageToPng(blob);
    } catch {
      // try next candidate
    }
  }
  /* eslint-enable no-await-in-loop */

  // Last resort
  const fallbackResponse = await fetch(defaultPng);
  if (!fallbackResponse.ok) {
    throw new Error(`Request failed: ${fallbackResponse.status}`);
  }
  return await blobToDataUrl(await fallbackResponse.blob());
};

/**
 * Fetches an image URL and returns it as a PNG data URL, rasterizing SVG (or
 * any non-PNG format) via canvas. Returns `undefined` instead of falling back
 * when the image cannot be fetched or converted.
 */
export const loadImageAsPngDataUrl = async (
  url: string
): Promise<string | undefined> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return undefined;
    }

    const blob = await response.blob();
    if (blob.type === "image/png") {
      return await blobToDataUrl(blob);
    }
    return await rasterizeImageToPng(blob);
  } catch {
    return undefined;
  }
};
