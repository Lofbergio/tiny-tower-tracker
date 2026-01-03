# OCR Fixtures

Drop Google Vision OCR responses in this folder as `.json` files.

## How to capture a fixture

1. Run the app via Netlify Dev (so the OCR endpoint works):
   - `yarn dev:netlify`
2. Import a screenshot once.
3. In your browser DevTools → **Network**:
   - Find the request to `/.netlify/functions/google-vision-ocr`
   - Copy the **Response** JSON
4. Save it here as: `tests/fixtures/ocr/<any-name>.json`

Tip: when running in dev, the screenshot import dialog includes a **Dev: Fixture workflow** box
with one-click buttons to copy the OCR JSON and suggested fixture path.

## Expected JSON shape

The Netlify function returns something like:

```json
{
  "text": "...full text...",
  "lines": [{ "text": "Alice", "bbox": { "x0": 0, "y0": 0, "x1": 100, "y1": 20 } }]
}
```

You _do not_ need to include the base64 image.

## Running / updating golden tests

- Run tests: `yarn test`
- Add new fixture(s), then update snapshots once: `yarn test:update`

The “expected values” for these golden tests live in Vitest’s snapshot file:

- `tests/__snapshots__/ocrFixtures.test.ts.snap`

After running `yarn test:update`, make sure the updated `.snap` file is included in your git change.

If a change breaks an old fixture unexpectedly, `yarn test` will fail and show a diff.
