# Smart Automated Cashier Alert

Edge Function ini menerima webhook dari Supabase, mengecek stok produk, memanggil AI hanya saat stok `<= 2`, lalu mengirim alert Telegram.

## Struktur

```txt
supabase/functions/smart-cashier-alert/
  deno.json
  index.ts
```

## Contoh payload webhook

Payload minimal, cocok untuk trigger custom yang sudah join data `Product`:

```json
{
  "type": "UPDATE",
  "table": "Stock",
  "record": {
    "id": "stock-id",
    "user_id": "user-id",
    "product_id": "product-id",
    "total": 2
  },
  "old_record": {
    "total": 5
  },
  "product": {
    "name": "Voucher Data 10GB",
    "harga_modal": 42000,
    "harga_jual": 50000
  }
}
```

Kalau memakai Database Webhook bawaan dari tabel `Stock`, function tetap akan skip jika `record.total > 2`, tetapi nama produk dan harga hanya lengkap kalau ikut dikirim di payload.

## Set env secret

```bash
supabase secrets set AI_API_KEY="your-ai-api-key"
supabase secrets set TELEGRAM_BOT_TOKEN="123456:telegram-token"
supabase secrets set TELEGRAM_CHAT_ID="123456789"
```

`AI_API_KEY` pada implementasi ini dipakai untuk Gemini API.

Opsional untuk production hardening:

```bash
supabase secrets set ALERT_WEBHOOK_SECRET="random-long-secret"
```

## Deploy

```bash
supabase functions deploy smart-cashier-alert
```

## Testing manual dengan curl

Ganti `PROJECT_REF` dengan project ref Supabase kamu.

```bash
curl -i -X POST "https://PROJECT_REF.functions.supabase.co/smart-cashier-alert" \
  -H "Content-Type: application/json" \
  -H "x-alert-secret: random-long-secret" \
  -d '{
    "type": "UPDATE",
    "table": "Stock",
    "record": {
      "id": "stock-id",
      "user_id": "user-id",
      "product_id": "product-id",
      "total": 2
    },
    "old_record": {
      "total": 5
    },
    "product": {
      "name": "Voucher Data 10GB",
      "harga_modal": 42000,
      "harga_jual": 50000
    }
  }'
```

Payload dengan `total: 3` harus mengembalikan `skipped: true` dan tidak memanggil AI.

## Saran trigger/webhook supaya hanya jalan saat qty <= 2

Opsi paling hemat adalah trigger SQL custom pada tabel `Stock`, karena bisa filter di database dan mengirim data produk yang sudah lengkap.

```sql
create extension if not exists pg_net;

create or replace function public.notify_smart_cashier_alert()
returns trigger
language plpgsql
security definer
as $$
declare
  product_row record;
  function_url text := 'https://PROJECT_REF.functions.supabase.co/smart-cashier-alert';
  webhook_secret text := 'random-long-secret';
begin
  if new.total > 2 then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.total <= 2 then
    return new;
  end if;

  select name, harga_modal, harga_jual
  into product_row
  from public."Product"
  where id = new.product_id
    and user_id = new.user_id;

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-alert-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', tg_op,
      'table', 'Stock',
      'record', jsonb_build_object(
        'id', new.id,
        'user_id', new.user_id,
        'product_id', new.product_id,
        'total', new.total
      ),
      'old_record', case
        when tg_op = 'UPDATE' then jsonb_build_object('total', old.total)
        else null
      end,
      'product', jsonb_build_object(
        'name', product_row.name,
        'harga_modal', product_row.harga_modal,
        'harga_jual', product_row.harga_jual
      )
    )
  );

  return new;
end;
$$;

drop trigger if exists smart_cashier_alert_on_low_stock on public."Stock";

create trigger smart_cashier_alert_on_low_stock
after insert or update of total on public."Stock"
for each row
when (new.total <= 2)
execute function public.notify_smart_cashier_alert();
```

Catatan: guard `old.total <= 2` mencegah spam Telegram saat stok sudah kritis lalu di-update lagi tanpa keluar dari kondisi kritis.
