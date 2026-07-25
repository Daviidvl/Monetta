import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyMetaSignature } from './_lib/meta'
import { parseExpense } from './_lib/claude'
import { supabaseAdmin } from './_lib/supabase'

// Meta re-parses the raw body to auto-JSON by default, but signature
// verification needs the exact bytes Meta signed — so body parsing is
// disabled here and the raw body is read and JSON-parsed manually below.
export const config = { api: { bodyParser: false } }

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

interface MetaMessage {
  type: string
  text?: { body: string }
}

interface MetaWebhookBody {
  entry?: Array<{
    changes?: Array<{
      value?: { messages?: MetaMessage[] }
    }>
  }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      res.status(200).send(challenge)
      return
    }
    res.status(403).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const rawBody = await readRawBody(req)
  const signature = req.headers['x-hub-signature-256']
  const valid = verifyMetaSignature(
    rawBody,
    Array.isArray(signature) ? signature[0] : signature,
    process.env.META_APP_SECRET!,
  )

  if (!valid) {
    res.status(401).end()
    return
  }

  // Respond fast — Meta retries the webhook if it doesn't get a 200 quickly.
  res.status(200).end()

  const body = JSON.parse(rawBody) as MetaWebhookBody
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

  // Status callbacks (delivered/read) and unsupported message types
  // (audio is phase 2) have nothing to parse — no-op.
  if (!message || message.type !== 'text' || !message.text?.body) {
    return
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const parsed = await parseExpense(message.text.body, todayISO)

  await supabaseAdmin.from('pending_expenses').insert({
    amount: parsed.amount,
    description: parsed.description,
    category: parsed.category,
    expense_date: parsed.date,
    source: 'whatsapp',
    raw_message: message.text.body,
  })
}
