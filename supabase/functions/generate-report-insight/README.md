# Generate Report Insight + Telegram

Function ini dipanggil tombol `Generate AI Insight` pada halaman Reports. Setelah Gemini
menghasilkan insight, function juga mengirim ringkasan laporan yang sama ke Telegram.
Token bot tetap disimpan di Supabase Edge Function secrets, bukan di browser.

## Secret yang dibutuhkan

```bash
supabase secrets set GEMINI_API_KEY="your-gemini-api-key"
supabase secrets set TELEGRAM_BOT_TOKEN="123456:telegram-token"
supabase secrets set TELEGRAM_CHAT_ID="123456789"
```

Jika secret Telegram belum dipasang, insight di website tetap bisa dibuat tetapi pesan
Telegram tidak dikirim. Halaman Reports menampilkan status pengiriman berdasarkan
`telegramStatus` dari response function.

## Deploy

```bash
supabase functions deploy generate-report-insight
```

Setelah deploy, buka halaman Reports lalu klik `Generate AI Insight`. Pesan Telegram akan
memuat periode laporan, angka keuangan, produk utama, stok rendah, dan hasil insight AI.
