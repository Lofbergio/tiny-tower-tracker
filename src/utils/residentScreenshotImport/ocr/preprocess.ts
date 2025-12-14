export async function preprocessImageForOcr(
  file: File,
  opts?: {
    contrast?: number
    gamma?: number
    scaleBoostSmall?: number
    scaleBoostLarge?: number
  }
): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const scaleBoostSmall = opts?.scaleBoostSmall ?? 2
  const scaleBoostLarge = opts?.scaleBoostLarge ?? 1.5
  const scale = bitmap.width < 900 ? scaleBoostSmall : scaleBoostLarge

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close?.()
    throw new Error('Canvas 2D context not available')
  }

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data

  const contrast = opts?.contrast ?? 1.6
  const gamma = opts?.gamma ?? 0.85
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const gammaAdjusted = 255 * Math.pow(Math.max(0, Math.min(1, lum / 255)), gamma)
    const boosted = (gammaAdjusted - 128) * contrast + 128
    const v = Math.max(0, Math.min(255, Math.round(boosted)))
    d[i] = v
    d[i + 1] = v
    d[i + 2] = v
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}
