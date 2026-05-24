const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supportedLanguages = {
  en: { name: 'English', fallback: 'No insight generated.' },
  id: { name: 'Indonesian', fallback: 'Tidak ada insight yang dihasilkan.' },
  es: { name: 'Spanish', fallback: 'No se generó ningún insight.' },
  zh: { name: 'Chinese', fallback: '未生成洞察。' },
  fr: { name: 'French', fallback: 'Aucun aperçu généré.' },
  de: { name: 'German', fallback: 'Keine Erkenntnis generiert.' },
  ja: { name: 'Japanese', fallback: 'インサイトは生成されませんでした。' },
  pt: { name: 'Portuguese', fallback: 'Nenhum insight gerado.' },
  ru: { name: 'Russian', fallback: 'Инсайт не создан.' },
  ar: { name: 'Arabic', fallback: 'لم يتم إنشاء أي رؤية.' },
} as const

type InsightLanguage = keyof typeof supportedLanguages

type ReportInsightPayload = {
  revenue?: number
  grossProfit?: number
  expenses?: number
  netProfit?: number
  expenseRatio?: number
  bestSellingProduct?: string | null
  mostProfitableProduct?: string | null
  lowStockCount?: number
  language?: string
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

const isSupportedLanguage = (value: unknown): value is InsightLanguage =>
  typeof value === 'string' && value in supportedLanguages

const getInsightLanguage = (value: unknown): InsightLanguage =>
  isSupportedLanguage(value) ? value : 'en'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing server environment configuration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const authorization = req.headers.get('authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized request' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const accessToken = authorization.split(' ')[1]
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    })

    if (!authResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized request' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const user = await authResponse.json()

    if (!user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized request' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const body = (await req.json()) as ReportInsightPayload

    const invalidFields: string[] = []

    if (!isFiniteNumber(body.revenue)) invalidFields.push('revenue')
    if (!isFiniteNumber(body.grossProfit)) invalidFields.push('grossProfit')
    if (!isFiniteNumber(body.expenses)) invalidFields.push('expenses')
    if (!isFiniteNumber(body.netProfit)) invalidFields.push('netProfit')
    if (!isFiniteNumber(body.expenseRatio)) invalidFields.push('expenseRatio')
    if (!isFiniteNumber(body.lowStockCount)) invalidFields.push('lowStockCount')
    if (!isNullableString(body.bestSellingProduct)) invalidFields.push('bestSellingProduct')
    if (!isNullableString(body.mostProfitableProduct)) invalidFields.push('mostProfitableProduct')

    if (invalidFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: `Invalid or missing fields: ${invalidFields.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const language = getInsightLanguage(body.language)
    const responseLanguage = supportedLanguages[language].name
    const fallbackText = supportedLanguages[language].fallback

    const prompt = `
You are a business analyst for a small retail/cashflow app.

Analyze this report data and return 3-5 short, practical business insights.

Rules:
- Respond only in ${responseLanguage}.
- Return plain text only.
- Do not use markdown syntax such as **bold**, __underline__, or numbered headings.
- Use simple bullet list format with one insight per line.
- Each line should follow this pattern: Title: explanation
- Do not include list markers other than a simple leading hyphen if needed.
- Do not make up numbers.
- If data is missing, mention that insight is limited.
- Use natural ${responseLanguage} business language.

Report data:
Revenue: ${body.revenue ?? 0}
Gross Profit: ${body.grossProfit ?? 0}
Expenses: ${body.expenses ?? 0}
Net Profit: ${body.netProfit ?? 0}
Expense Ratio: ${body.expenseRatio ?? 0}%
Best Selling Product: ${body.bestSellingProduct ?? 'N/A'}
Most Profitable Product: ${body.mostProfitableProduct ?? 'N/A'}
Low Stock Count: ${body.lowStockCount ?? 0}
`

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text()

      return new Response(
        JSON.stringify({
          error: 'Failed to generate insight',
          details: errorText,
        }),
        {
          status: geminiRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const result = await geminiRes.json()
    const insight =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ??
      fallbackText

    return new Response(
      JSON.stringify({
        insight,
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
