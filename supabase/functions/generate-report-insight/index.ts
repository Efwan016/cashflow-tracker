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

type TelegramStatus = 'sent' | 'not_configured' | 'misconfigured' | 'failed'
type GeminiStatus = 'generated' | 'fallback'

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
  reportPeriod?: string
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

const isSupportedLanguage = (value: unknown): value is InsightLanguage =>
  typeof value === 'string' && value in supportedLanguages

const getInsightLanguage = (value: unknown): InsightLanguage =>
  isSupportedLanguage(value) ? value : 'en'

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

const compactMessageText = (value: string | null | undefined, fallback: string) =>
  value?.trim().slice(0, 120) || fallback

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const shouldRetryGemini = (status: number) =>
  status === 429 || status === 500 || status === 502 || status === 503 || status === 504

const buildFallbackInsight = (
  body: ReportInsightPayload,
  language: InsightLanguage,
) => {
  const netProfit = body.netProfit ?? 0
  const expenseRatio = body.expenseRatio ?? 0
  const lowStockCount = body.lowStockCount ?? 0
  const bestSeller = compactMessageText(body.bestSellingProduct, '-')

  if (language === 'id') {
    return [
      `Ringkasan sementara: Gemini sedang tidak tersedia, jadi insight ini dibuat dari data laporan yang ada.`,
      `Profitabilitas: Laba bersih saat ini ${formatRupiah(netProfit)} dengan rasio pengeluaran ${expenseRatio.toFixed(1)}%.`,
      `Produk utama: Produk terlaris periode ini adalah ${bestSeller}.`,
      `Inventaris: Ada ${lowStockCount} produk stok rendah yang perlu dipantau.`,
    ].join('\n')
  }

  if (language === 'es') {
    return [
      'Resumen temporal: Gemini no está disponible, por lo que este insight se generó con los datos del informe.',
      `Rentabilidad: La ganancia neta actual es ${formatRupiah(netProfit)} con una relación de gastos de ${expenseRatio.toFixed(1)}%.`,
      `Producto principal: El producto más vendido en este período es ${bestSeller}.`,
      `Inventario: Hay ${lowStockCount} productos con bajo stock para supervisar.`,
    ].join('\n')
  }

  if (language === 'zh') {
    return [
      '临时摘要：Gemini 当前不可用，因此此洞察基于现有报表数据生成。',
      `盈利能力：当前净利润为 ${formatRupiah(netProfit)}，费用率为 ${expenseRatio.toFixed(1)}%。`,
      `重点商品：本期间最畅销的商品是 ${bestSeller}。`,
      `库存：有 ${lowStockCount} 个低库存商品需要关注。`,
    ].join('\n')
  }

  if (language === 'fr') {
    return [
      'Résumé temporaire : Gemini est actuellement indisponible, cet aperçu a donc été généré à partir des données du rapport.',
      `Rentabilité : Le bénéfice net actuel est de ${formatRupiah(netProfit)} avec un ratio de dépenses de ${expenseRatio.toFixed(1)}%.`,
      `Produit clé : Le produit le plus vendu sur cette période est ${bestSeller}.`,
      `Inventaire : ${lowStockCount} produits à faible stock doivent être surveillés.`,
    ].join('\n')
  }

  if (language === 'de') {
    return [
      'Vorläufige Zusammenfassung: Gemini ist derzeit nicht verfügbar, daher wurde dieser Einblick aus den vorhandenen Berichtsdaten erstellt.',
      `Rentabilität: Der aktuelle Nettogewinn beträgt ${formatRupiah(netProfit)} bei einer Ausgabenquote von ${expenseRatio.toFixed(1)}%.`,
      `Produktfokus: Das meistverkaufte Produkt in diesem Zeitraum ist ${bestSeller}.`,
      `Inventar: Es gibt ${lowStockCount} Produkte mit niedrigem Bestand, die überwacht werden sollten.`,
    ].join('\n')
  }

  if (language === 'ja') {
    return [
      '一時的な概要: Gemini が現在利用できないため、このインサイトは利用可能なレポートデータから生成されました。',
      `収益性: 現在の純利益は ${formatRupiah(netProfit)}、経費率は ${expenseRatio.toFixed(1)}% です。`,
      `主要商品: この期間のベストセラー商品は ${bestSeller} です。`,
      `在庫: 監視が必要な低在庫商品が ${lowStockCount} 件あります。`,
    ].join('\n')
  }

  if (language === 'pt') {
    return [
      'Resumo temporário: O Gemini está indisponível no momento, então este insight foi gerado a partir dos dados disponíveis do relatório.',
      `Rentabilidade: O lucro líquido atual é ${formatRupiah(netProfit)} com uma relação de despesas de ${expenseRatio.toFixed(1)}%.`,
      `Produto em foco: O produto mais vendido neste período é ${bestSeller}.`,
      `Inventário: Há ${lowStockCount} produtos com baixo stock para monitorar.`,
    ].join('\n')
  }

  if (language === 'ru') {
    return [
      'Временная сводка: Gemini сейчас недоступен, поэтому этот инсайт создан на основе доступных данных отчета.',
      `Прибыльность: Текущая чистая прибыль составляет ${formatRupiah(netProfit)}, доля расходов — ${expenseRatio.toFixed(1)}%.`,
      `Ключевой продукт: Самый продаваемый продукт за период — ${bestSeller}.`,
      `Запасы: Нужно отслеживать ${lowStockCount} товаров с низким остатком.`,
    ].join('\n')
  }

  if (language === 'ar') {
    return [
      'ملخص مؤقت: Gemini غير متاح حالياً، لذلك تم إنشاء هذه الرؤية من بيانات التقرير المتاحة.',
      `الربحية: صافي الربح الحالي هو ${formatRupiah(netProfit)} مع نسبة مصروفات ${expenseRatio.toFixed(1)}%.`,
      `المنتج الرئيسي: المنتج الأكثر مبيعاً في هذه الفترة هو ${bestSeller}.`,
      `المخزون: هناك ${lowStockCount} منتجات منخفضة المخزون تحتاج إلى متابعة.`,
    ].join('\n')
  }

  return [
    'Temporary summary: Gemini is currently unavailable, so this insight was generated from the available report data.',
    `Profitability: Current net profit is ${formatRupiah(netProfit)} with an expense ratio of ${expenseRatio.toFixed(1)}%.`,
    `Product focus: The best-selling product for this period is ${bestSeller}.`,
    `Inventory: There are ${lowStockCount} low-stock products to monitor.`,
  ].join('\n')
}

const requestGeminiInsight = async (
  geminiApiKey: string,
  prompt: string,
) => {
  let lastStatus = 500
  let lastErrorText = ''

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
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

    if (geminiRes.ok) {
      return {
        ok: true as const,
        result: await geminiRes.json(),
      }
    }

    lastStatus = geminiRes.status
    lastErrorText = await geminiRes.text()

    if (!shouldRetryGemini(geminiRes.status) || attempt === 2) {
      break
    }

    await sleep(400 * (attempt + 1))
  }

  return {
    ok: false as const,
    status: lastStatus,
    errorText: lastErrorText,
  }
}

const buildTelegramReportMessage = (
  body: ReportInsightPayload,
  insight: string,
  generatedAt: string,
) => {
  const period = compactMessageText(body.reportPeriod, 'Periode terpilih')
  const bestSeller = compactMessageText(body.bestSellingProduct, '-')
  const profitableProduct = compactMessageText(body.mostProfitableProduct, '-')
  const safeInsight = insight.trim().slice(0, 2500)

  return [
    'Laporan Insight AI Cashflow',
    `Periode: ${period}`,
    `Dibuat: ${new Date(generatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
    '',
    `Pendapatan: ${formatRupiah(body.revenue ?? 0)}`,
    `Laba kotor: ${formatRupiah(body.grossProfit ?? 0)}`,
    `Pengeluaran: ${formatRupiah(body.expenses ?? 0)}`,
    `Laba bersih: ${formatRupiah(body.netProfit ?? 0)}`,
    `Rasio pengeluaran: ${(body.expenseRatio ?? 0).toFixed(1)}%`,
    `Produk terlaris: ${bestSeller}`,
    `Produk paling menguntungkan: ${profitableProduct}`,
    `Produk stok rendah: ${body.lowStockCount ?? 0}`,
    '',
    'Insight AI:',
    safeInsight,
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
    if (body.reportPeriod !== undefined && typeof body.reportPeriod !== 'string') {
      invalidFields.push('reportPeriod')
    }

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

    const geminiResponse = await requestGeminiInsight(geminiApiKey, prompt)
    let geminiStatus: GeminiStatus = 'generated'
    let insight = fallbackText

    if (!geminiResponse.ok) {
      console.error(
        `Gemini insight generation failed after retries: ${geminiResponse.status} ${geminiResponse.errorText}`,
      )

      if (shouldRetryGemini(geminiResponse.status)) {
        geminiStatus = 'fallback'
        insight = buildFallbackInsight(body, language)
      } else {
        return new Response(
          JSON.stringify({
            error: 'Failed to generate insight',
            details: geminiResponse.errorText,
          }),
          {
            status: geminiResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    } else {
      insight =
        geminiResponse.result?.candidates?.[0]?.content?.parts?.[0]?.text ??
        fallbackText
    }

    const generatedAt = new Date().toISOString()
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')
    let telegramStatus: TelegramStatus = 'not_configured'

    if (telegramBotToken && telegramChatId) {
      try {
        const message = buildTelegramReportMessage(body, insight, generatedAt)
        await sendTelegramMessage(telegramBotToken, telegramChatId, message)
        telegramStatus = 'sent'
      } catch (error) {
        telegramStatus = 'failed'
        console.error('Failed to send report insight to Telegram:', error)
      }
    } else if (telegramBotToken || telegramChatId) {
      telegramStatus = 'misconfigured'
      console.error('Telegram notification is disabled because one Telegram secret is missing.')
    }

    return new Response(
      JSON.stringify({
        insight,
        generatedAt,
        geminiStatus,
        telegramNotified: telegramStatus === 'sent',
        telegramStatus,
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
