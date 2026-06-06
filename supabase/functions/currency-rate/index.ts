const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPPORTED_RATES: Record<string, number> = {
  IDR: 1,
  USD: 1 / 16200,
  EUR: 1 / 17600,
  CNY: 1 / 2240,
  JPY: 1 / 105,
  RUB: 1 / 205,
  SAR: 1 / 4320,
}

type CurrencyRatePayload = {
  base?: unknown
  target?: unknown
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const normalizeCurrency = (value: unknown) =>
  typeof value === 'string' ? value.trim().toUpperCase() : ''

const getFallbackRate = (base: string, target: string) => {
  const baseToIdr = SUPPORTED_RATES[base]
  const targetToIdr = SUPPORTED_RATES[target]

  if (!baseToIdr || !targetToIdr) return null
  return targetToIdr / baseToIdr
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let payload: CurrencyRatePayload

  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const base = normalizeCurrency(payload.base) || 'IDR'
  const target = normalizeCurrency(payload.target) || 'IDR'

  if (!SUPPORTED_RATES[base] || !SUPPORTED_RATES[target]) {
    return jsonResponse({ error: 'Unsupported currency pair' }, 400)
  }

  if (base === target) {
    return jsonResponse({
      base,
      target,
      rate: 1,
      date: new Date().toISOString().slice(0, 10),
      source: 'base',
    })
  }

  try {
    const url = new URL('https://api.frankfurter.dev/v2/rates')
    url.searchParams.set('base', base)
    url.searchParams.set('quotes', target)

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Frankfurter returned ${response.status}`)
    }

    const data = await response.json() as {
      date?: string
      rates?: Record<string, number>
    }
    const rate = data.rates?.[target]

    if (!Number.isFinite(rate)) {
      throw new Error('Frankfurter response did not include requested rate')
    }

    return jsonResponse({
      base,
      target,
      rate,
      date: data.date ?? new Date().toISOString().slice(0, 10),
      source: 'api',
    })
  } catch (error) {
    const rate = getFallbackRate(base, target)

    if (rate === null) {
      const message = error instanceof Error ? error.message : 'Unknown currency rate error'
      return jsonResponse({ error: message }, 502)
    }

    return jsonResponse({
      base,
      target,
      rate,
      date: new Date().toISOString().slice(0, 10),
      source: 'fallback',
    })
  }
})
