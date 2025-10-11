import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface SignatureArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  page?: number
  label?: string
  type?: 'signature' | 'text' | 'date'
  value?: string
}

interface EmbedSignaturesOptions {
  pdfBytes: ArrayBuffer | Uint8Array
  signatureDataMap: Record<string, string>
  formFieldValues: Record<string, string>
  signatureAreas: SignatureArea[]
}

export async function embedSignaturesIntoPDF({
  pdfBytes,
  signatureDataMap,
  formFieldValues,
  signatureAreas,
}: EmbedSignaturesOptions): Promise<Uint8Array> {
  try {
    // Load the existing PDF
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()

    // Embed standard font for text fields
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Process each signature area
    for (const area of signatureAreas) {
      const pageIndex = (area.page || 1) - 1
      if (pageIndex < 0 || pageIndex >= pages.length) continue

      const page = pages[pageIndex]
      const { width: pageWidth, height: pageHeight } = page.getSize()

      // Calculate actual positions from percentages
      const x = (area.x / 100) * pageWidth
      // PDF coordinates start from bottom-left, so we need to flip Y
      const y =
        pageHeight - (area.y / 100) * pageHeight - (area.height / 100) * pageHeight
      const width = (area.width / 100) * pageWidth
      const height = (area.height / 100) * pageHeight

      if (area.type === 'signature') {
        // Get the signature data for this area
        const signatureData = signatureDataMap[area.id]

        if (signatureData?.startsWith('data:image')) {
          try {
            // Extract the base64 image data
            const base64Data = signatureData.split(',')[1]
            const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

            // Embed the image
            let image
            if (signatureData.includes('image/png')) {
              image = await pdfDoc.embedPng(imageBytes)
            } else if (
              signatureData.includes('image/jpeg') ||
              signatureData.includes('image/jpg')
            ) {
              image = await pdfDoc.embedJpg(imageBytes)
            } else {
              console.warn('Unsupported image format for signature:', area.id)
              continue
            }

            // Calculate aspect ratio to fit within the area
            const imgDims = image.scale(1)
            const scaleX = width / imgDims.width
            const scaleY = height / imgDims.height
            const scale = Math.min(scaleX, scaleY) * 0.9 // Scale down slightly for padding

            // Draw the signature image
            page.drawImage(image, {
              x: x + (width - imgDims.width * scale) / 2, // Center horizontally
              y: y + (height - imgDims.height * scale) / 2, // Center vertically
              width: imgDims.width * scale,
              height: imgDims.height * scale,
            })
          } catch (error) {
            console.error('Error embedding signature image:', error)
          }
        }
      } else if (area.type === 'text' || area.type === 'date') {
        // Get the text value for this field
        const value = formFieldValues[area.id] || area.value

        if (value) {
          // Calculate font size to fit the area
          const fontSize = Math.min(height * 0.6, 12)

          // Draw the text
          page.drawText(value, {
            x: x + 5, // Small padding from left
            y: y + (height - fontSize) / 2, // Center vertically
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          })
        }
      }
    }

    // Save the modified PDF
    const pdfBytesModified = await pdfDoc.save()
    return pdfBytesModified
  } catch (error) {
    console.error('Error embedding signatures into PDF:', error)
    throw error
  }
}

export function convertDataUriToPdfBytes(dataUri: string): Uint8Array {
  if (!dataUri.startsWith('data:application/pdf')) {
    throw new Error('Invalid PDF data URI')
  }

  const base64Data = dataUri.split(',')[1]
  const pdfBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
  return pdfBytes
}
