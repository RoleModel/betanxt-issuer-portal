// Shared client branding utilities

// Compute a logo base path (without extension) from client name/ticker
export const computeClientLogoBase = (clientName?: string, ticker?: string): string => {
  if (ticker) {
    // Use uppercase for ticker since that's how the logo files are named
    const tickerUpper = ticker.toUpperCase()
    return `/logos/${tickerUpper}_logo`
  }

  if (clientName) {
    const nameLower = clientName.toLowerCase().replace(/[^a-z0-9]/g, '')
    return `/logos/${nameLower}_logo`
  }

  return '/images/betanxt-logo'
}

// Compute a logo src (with extension) matching the AppBar's SVG-first behavior
export const computeClientLogoSrc = (
  clientName?: string,
  ticker?: string,
  defaultSrc = '/images/logo.svg',
  suffix?: string
): string => {
  const base = computeClientLogoBase(clientName, ticker)
  // Prefer SVG for UI usage
  if (base.startsWith('/logos/')) {
    const basePath = suffix ? `${base}${suffix}` : base
    return `${basePath}.svg`
  }
  return defaultSrc
}

// Load the client logo as a PNG base64 string. Tries PNG first, then converts SVG to PNG, then falls back.
export const loadClientLogoAsPngBase64 = async (opts: {
  clientName?: string
  ticker?: string
  overrideSrc?: string
}): Promise<string> => {
  const defaultPng = '/images/betanxt-logo.png'
  const { clientName, ticker, overrideSrc } = opts

  // Determine candidates in order of preference
  const base = overrideSrc
    ? overrideSrc.replace(/\.(svg|png)$/i, '')
    : computeClientLogoBase(clientName, ticker)

  const candidates: { url: string; type: 'png' | 'svg' | 'default' }[] = []

  // If override or base under /logos, try PNG then SVG
  if (base) {
    candidates.push({ url: `${base}.png`, type: 'png' })
    candidates.push({ url: `${base}.svg`, type: 'svg' })
  }

  // Always add default PNG fallback
  candidates.push({ url: defaultPng, type: 'png' })

  // Attempt to load candidates
  for (const c of candidates) {
    try {
      const res = await fetch(c.url)
      if (!res.ok) continue

      if (c.type === 'png') {
        const blob = await res.blob()
        if (blob.type !== 'image/png') {
          // Convert non-png (rare) to png via canvas
          const png = await rasterizeImageToPng(blob)
          return png
        }
        const dataUrl = await blobToDataUrl(blob)
        return dataUrl
      } else {
        // SVG → rasterize to PNG
        const blob = await res.blob()
        const png = await rasterizeImageToPng(blob)
        return png
      }
    } catch {
      // try next candidate
    }
  }

  // Last resort
  return await blobToDataUrl(await (await fetch(defaultPng)).blob())
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read image blob'))
    reader.readAsDataURL(blob)
  })

// Rasterize any image blob (svg or otherwise) to PNG via canvas
const rasterizeImageToPng = async (blob: Blob): Promise<string> => {
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    const width = img.naturalWidth || 300
    const height = img.naturalHeight || 60
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load error'))
    img.src = src
  })
