const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ReportInsightPayload = {
  revenue?: number
  grossProfit?: number
  expenses?: number
  netProfit?: number
  expenseRatio?: number
  bestSellingProduct?: string | null
  mostProfitableProduct?: string | null
  lowStockCount?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing GEMINI_API_KEY' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const body = (await req.json()) as ReportInsightPayload

    const prompt = `
You are a business analyst for a small retail/cashflow app.

Analyze this report data and return 3-5 short, practical business insights.

Rules:
- Be concise.
- Use simple English.
- Focus on profit, expenses, stock, and product performance.
- Do not make up numbers.
- If data is missing, mention that insight is limited.
- Return the answer as plain bullet points.

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
      'No insight generated.'

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