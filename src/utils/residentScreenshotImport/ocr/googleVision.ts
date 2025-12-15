import type { OcrLine } from '../types'

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })

  const idx = dataUrl.indexOf('base64,')
  if (idx < 0) throw new Error('Unexpected file encoding')
  return dataUrl.slice(idx + 'base64,'.length)
}

export async function recognizeWithGoogleVision(
  file: File
): Promise<{ lines: OcrLine[]; text: string }> {
  const endpoint = '/.netlify/functions/google-vision-ocr'
  const imageBase64 = await fileToBase64(file)

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      mimeType: file.type || undefined,
      fileName: file.name,
    }),
  })

  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error(
        'Google Vision OCR endpoint not found. If you are running locally, start Netlify Dev (yarn dev:netlify) and open http://localhost:8888 (not the Vite-only server on 5173).'
      )
    }

    const contentType = resp.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = (await resp.json().catch(() => null)) as {
        error?: string
        details?: string
        status?: number
      } | null
      const detail = body?.details ? `: ${body.details}` : ''
      throw new Error(body?.error ? `${body.error}${detail}` : `Cloud OCR failed (${resp.status})`)
    }

    const msg = await resp.text().catch(() => '')
    throw new Error(`Cloud OCR failed (${resp.status})${msg ? `: ${msg}` : ''}`)
  }

  const data = (await resp.json()) as {
    text?: string
    lines?: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>
  }

  const lines: OcrLine[] = (data.lines ?? [])
    .filter(l => typeof l?.text === 'string')
    .map(l => ({ text: l.text, bbox: l.bbox }))
  const text = typeof data.text === 'string' ? data.text : ''
  return { lines, text }
}
