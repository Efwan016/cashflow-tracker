const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-alert-secret',
}

type WebhookPayload = {
  type?: string
  table?: string
  record?: Record<string, unknown>
  old_record?: Record<string, unknown> | null
  product?: {
    name?: unknown
    harga_modal?: unknown
    harga_jual?: unknown
  }
}

type CriticalProduct = {
  name: string
  stock: number
  hargaModal: number
  hargaJual: number
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const toNumber = (value: unknown): number | null => {
  if (isFiniteNumber(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const toText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

const escapeMarkdown = (value: string) =>
  value.replace(/([_*[\]`])/g, '\\$1')

const getCriticalProduct = (payload: WebhookPayload): CriticalProduct | null => {
  const record = payload.record ?? {}
  const product = payload.product ?? {}
  const stock = toNumber(record.total ?? record.stock ?? record.qty_left)

  if (stock === null || stock > 2) return null

  const name =
    toText(product.name) ??
    toText(record.product_name) ??
    toText(record.name) ??
    'Produk tanpa nama'
  const hargaModal = toNumber(product.harga_modal ?? record.harga_modal) ?? 0
  const hargaJual = toNumber(product.harga_jual ?? record.harga_jual) ?? 0

  return { name, stock, hargaModal, hargaJual }
}

const generateInsight = async (
  apiKey: string,
  product: CriticalProduct & { language?: string },
) => {
  const margin = product.hargaJual - product.hargaModal
  const language = product.language?.trim() || 'Bahasa Indonesia'

  const fallbackInsight = `${product.name} tinggal ${product.stock} pcs, bro, jadi ini harus jadi prioritas restock biar penjualan gak putus. Margin per item masih ${formatRupiah(margin)}, jadi stok ini masih layak diamankan.`

  const isBadInsight = (value: unknown) => {
    if (typeof value !== 'string') return true

    const text = value.trim()
    if (text.length < 40) return true
    if (/^[\d%.,;:!?()[\]{}\-+*/\\|"'`~#@]/.test(text)) return true
    if (!text.toLowerCase().includes(product.name.toLowerCase())) return true

    return false
  }

  const prompt = `
You are a smart cashier assistant for a small phone credit / retail counter owner.

Respond only in ${language}.
Write 1 to 2 natural sentences only.
Use casual, practical, sharp language suitable for a small counter owner.
The insight must mention:
- product name: ${product.name}
- remaining stock: ${product.stock} pcs
- restock urgency

Rules:
- Do not use markdown.
- Do not use bullet points or numbered lists.
- Do not start with a number, percentage, punctuation, or random symbol.
- Do not invent new data.
- Do not mention percentages unless provided in the data.
- Do not cut the sentence midway.
- Keep it short, clear, and action-oriented.

Data:
Product name: ${product.name}
Remaining stock: ${product.stock} pcs
Cost price: ${product.hargaModal}
Selling price: ${product.hargaJual}
Margin per item: ${margin}
`

  try {
    const aiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 220,
          },
        }),
      },
    )

    if (!aiRes.ok) {
      throw new Error(`AI request failed: ${aiRes.status}`)
    }

    const result = await aiRes.json()
    const insight = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    return isBadInsight(insight) ? fallbackInsight : insight
  } catch (error) {
    console.error(error)
    return fallbackInsight
  }
}

const getOwnerName = async (userId: string | null) => {
  if (!userId) return 'Owner'

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) return 'Owner'

  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=full_name&id=eq.${userId}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  )

  if (!res.ok) return 'Owner'

  const data = await res.json()
  const fullName = data?.[0]?.full_name

  return typeof fullName === 'string' && fullName.trim()
    ? fullName.trim()
    : 'Owner'
}

const buildTelegramMessage = (
  product: CriticalProduct,
  insight: string,
  ownerName: string,
) => {
  const margin = product.hargaJual - product.hargaModal
  const urgency =
    product.stock <= 0
      ? 'Restock sekarang, stok sudah kosong dan penjualan bisa langsung berhenti.'
      : product.stock === 1
        ? 'Tambah stok hari ini minimal 5-10 pcs kalau produk ini sering laku.'
        : 'Siapkan restock sebelum stok habis supaya penjualan tetap jalan.'

  return [
    `Hello, ${escapeMarkdown(ownerName)}!`,
    '',
    `Produk: *${escapeMarkdown(product.name)}*`,
    `Sisa stok: *${product.stock}*`,
    `Harga modal: ${escapeMarkdown(formatRupiah(product.hargaModal))}`,
    `Harga jual: ${escapeMarkdown(formatRupiah(product.hargaJual))}`,
    `Margin/item: ${escapeMarkdown(formatRupiah(margin))}`,
    '',
    `Insight AI: ${escapeMarkdown(insight)}`,
    `Next Action: ${escapeMarkdown(urgency)}`,
  ].join('\n')
}
const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  text: string,
) => {
  const telegramRes = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    },
  )

  if (!telegramRes.ok) {
    const errorText = await telegramRes.text()
    throw new Error(`Telegram request failed: ${telegramRes.status} ${errorText}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const aiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!aiApiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable')
    }

    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')
    const alertWebhookSecret = Deno.env.get('ALERT_WEBHOOK_SECRET')

    if (!aiApiKey || !telegramBotToken || !telegramChatId) {
      return jsonResponse({ error: 'Missing server environment configuration' }, 500)
    }

    if (
      alertWebhookSecret &&
      req.headers.get('x-alert-secret') !== alertWebhookSecret
    ) {
      return jsonResponse({ error: 'Unauthorized request' }, 401)
    }

    const payload = (await req.json()) as WebhookPayload
    const criticalProduct = getCriticalProduct(payload)

    if (!criticalProduct) {
      return jsonResponse({
        skipped: true,
        reason: 'Stock is not critical or payload is invalid',
      })
    }

    const userId = toText(payload.record?.user_id)
const ownerName = await getOwnerName(userId)

const insight = await generateInsight(aiApiKey, criticalProduct)
const message = buildTelegramMessage(criticalProduct, insight, ownerName)
    await sendTelegramMessage(telegramBotToken, telegramChatId, message)

    return jsonResponse({
      ok: true,
      product: criticalProduct.name,
      stock: criticalProduct.stock,
      notifiedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error(error)

    return jsonResponse(
      {
        error: 'Failed to process cashier alert',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
})
