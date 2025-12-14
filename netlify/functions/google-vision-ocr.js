// Netlify Function: Google Vision OCR
// Expects JSON: { imageBase64: string, mimeType?: string, fileName?: string }
// Returns: { text: string, lines: Array<{ text: string, bbox: {x0:number,y0:number,x1:number,y1:number} }> }

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

function clampNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function bboxFromVertices(vertices) {
  const xs = (vertices ?? []).map(v => clampNumber(v.x))
  const ys = (vertices ?? []).map(v => clampNumber(v.y))
  return {
    x0: xs.length ? Math.min(...xs) : 0,
    y0: ys.length ? Math.min(...ys) : 0,
    x1: xs.length ? Math.max(...xs) : 0,
    y1: ys.length ? Math.max(...ys) : 0,
  }
}

function mergeBboxes(a, b) {
  return {
    x0: Math.min(a.x0, b.x0),
    y0: Math.min(a.y0, b.y0),
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
  }
}

function getBreakType(symbol) {
  return symbol?.property?.detectedBreak?.type || ''
}

function wordText(word) {
  const symbols = word?.symbols ?? []
  return symbols.map(s => s?.text ?? '').join('')
}

function extractLinesFromFullTextAnnotation(fullTextAnnotation) {
  const pages = fullTextAnnotation?.pages ?? []
  const out = []

  let currentText = ''
  let currentBBox = null

  function flush() {
    const text = currentText.trim()
    if (text) {
      out.push({ text, bbox: currentBBox ?? { x0: 0, y0: 0, x1: 0, y1: 0 } })
    }
    currentText = ''
    currentBBox = null
  }

  for (const page of pages) {
    for (const block of page?.blocks ?? []) {
      for (const para of block?.paragraphs ?? []) {
        for (const word of para?.words ?? []) {
          const wText = wordText(word)
          if (!wText) continue

          const wBBox = bboxFromVertices(word?.boundingBox?.vertices)
          if (currentText) currentText += ' '
          currentText += wText
          currentBBox = currentBBox ? mergeBboxes(currentBBox, wBBox) : wBBox

          const lastSymbol = (word?.symbols ?? [])[word?.symbols?.length - 1]
          const br = getBreakType(lastSymbol)
          if (br === 'LINE_BREAK' || br === 'EOL_SURE_SPACE') {
            flush()
          }
        }
      }
    }
  }

  flush()
  return out
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) {
    return json(500, { error: 'GOOGLE_VISION_API_KEY is not configured' })
  }

  let payload
  try {
    payload = event.body ? JSON.parse(event.body) : null
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  let imageBase64 = payload?.imageBase64
  // mimeType is accepted from the client for convenience, but it is NOT a valid field
  // for the synchronous `images:annotate` request schema.
  // (mimeType is used with other endpoints like async file annotation input configs.)
  const mimeType = payload?.mimeType

  if (typeof imageBase64 !== 'string' || imageBase64.length < 32) {
    return json(400, { error: 'imageBase64 is required' })
  }

  // Allow callers to accidentally pass a full data URL ("data:image/png;base64,...").
  const dataUrlIdx = imageBase64.indexOf('base64,')
  if (dataUrlIdx >= 0) {
    imageBase64 = imageBase64.slice(dataUrlIdx + 'base64,'.length)
  }

  // Basic size guard (~10MB raw base64 payload is bigger; this is just a safety check)
  if (imageBase64.length > 20_000_000) {
    return json(413, { error: 'Image too large' })
  }

  const requestBody = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: { languageHints: ['en'] },
      },
    ],
  }

  try {
    const resp = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    )

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return json(502, {
        error: 'Google Vision request failed',
        status: resp.status,
        details: text,
      })
    }

    const data = await resp.json()
    const first = (data?.responses ?? [])[0] ?? {}

    if (first?.error?.message) {
      return json(502, { error: 'Google Vision error', details: first.error.message })
    }

    const full = first.fullTextAnnotation
    const text = typeof full?.text === 'string' ? full.text : ''
    const lines = full ? extractLinesFromFullTextAnnotation(full) : []

    return json(200, { text, lines })
  } catch (err) {
    return json(500, { error: 'Server error', details: String(err?.message ?? err) })
  }
}
