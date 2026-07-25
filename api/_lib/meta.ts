import { createHmac, timingSafeEqual } from 'node:crypto'

// Meta signs every webhook POST body with the app secret. Without this check
// anyone who finds the URL could forge "expenses" straight into the user's
// dashboard, so this must run before any payload parsing.
export function verifyMetaSignature(rawBody: string, signatureHeader: string | undefined, appSecret: string): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false

  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const provided = signatureHeader.slice('sha256='.length)

  const expectedBuf = Buffer.from(expected, 'hex')
  const providedBuf = Buffer.from(provided, 'hex')
  if (expectedBuf.length !== providedBuf.length) return false

  return timingSafeEqual(expectedBuf, providedBuf)
}
