# Setup Supabase — Danh sách khách mời

Trước đây dữ liệu nằm trên **Cloudflare KV** (cần bind `GUESTS_KV` + set 2 secret
trong Dashboard → dễ lệch config → dữ liệu "không đồng bộ").
Nay chuyển sang **Supabase** — Cloudflare chỉ còn làm hosting static.

---

## Bước 1 — Tạo bảng + policy RLS

Mở <https://supabase.com/dashboard> → project của bạn → **SQL Editor** → **New query**

Dán toàn bộ nội dung file [`schema.sql`](./schema.sql) và bấm **Run**.

File này idempotent (chạy lại nhiều lần vẫn OK) và làm 4 việc:

1. Tạo bảng `public.guests` (cột `table_name` thay cho `table` vì `table` là từ khoá SQL)
2. Bật Row Level Security
3. Tạo policy `guests_admin_only` — **chỉ email `admin@wedding.local`** được đọc/ghi
4. Bật realtime (để mọi thiết bị tự đồng bộ)

---

## Bước 2 — Tài khoản admin

Tài khoản `admin@wedding.local` **đã được tạo** (qua API signup), nhưng đang ở
trạng thái **chưa xác nhận email** → chưa đăng nhập được.

> ⚠️ **Lỗi "Invalid login credentials" dù mật khẩu đúng**
>
> Khi signup mà user chưa confirm, Supabase vẫn tạo user **MỚI** dù email đã
> tồn tại. Do đã gọi signup nhiều lần nên có nhiều row trùng email →
> `signInWithPassword` không biết user nào cần soát mật khẩu → báo sai.
>
> **Cách sửa:** chạy script ở Bước 1 (phần 6 trong `schema.sql`) — nó tự xoá
> user trùng, giữ lại đúng 1 và **confirm email** cho user đó.

### Cách 1 (khuyến nghị) — dùng email thật

Nếu bạn muốn dùng email thật (vd. email của bạn):

1. **Authentication → Users → Add user → Create new user**
2. Điền email + mật khẩu
3. ✅ Tick **Auto Confirm User**
4. Xong

Sau đó cập nhật `ADMIN_EMAIL` trong `lib/supabase.ts` **và** email trong
policy (`supabase/schema.sql` → chạy lại script để áp policy mới).

### Cách 2 — dùng lại `admin@wedding.local`

Script ở Bước 1 đã tự xử lý (xoá trùng + confirm). Nếu script báo lỗi,
làm thủ công trong Dashboard:

1. **Authentication → Users** → tìm `admin@wedding.local`
2. Xoá các bản ghi trùng, **chỉ giữ lại 1**
3. Bấm **⋮** (menu) → **Confirm email**

> Email `.local` không nhận được mail nên không thể bấm link xác nhận qua
> email → phải xác nhận thủ công, hoặc dùng email thật (Cách 1).

### Đổi mật khẩu

**Authentication → Users → chọn user → ⋮ → Reset password / Edit user**

Mật khẩu **không** nằm trong code → an toàn khi bundle bị ai đó xem.

---

## Bước 3 — Tắt auto-pause (khuyến nghị)

**Project Settings → General → "Pause project after inactivity" → OFF**

Free tier có thể bị pause sau ~7 ngày không dùng. Nếu bị pause, vào Dashboard
bấm **Restore** là chạy lại.

---

## Bước 4 — Kiểm tra

Sau khi làm xong bước 1–3, mở `/admin` trên production → đăng nhập bằng mật khẩu
→ danh sách khách hiện ra.

Kiểm tra RLS đang chặn anonymous (không cần đăng nhập):

```bash
curl "https://qlqfyyzevlleksuepsxh.supabase.co/rest/v1/guests?select=id" \
  -H "apikey: <anon key>"
# → []
```

---

## Bước 5 — Migrate dữ liệu cũ từ Cloudflare KV

> ⚠️ **Bản mới ĐÃ deploy** → endpoint `/api/guests` cũ trả 404, nên **không
> xuất JSON được từ trang `/admin` nữa**. Phải lấy dữ liệu trực tiếp từ KV.

### Cách 1 — Cloudflare Dashboard (không cần CLI)

1. **Cloudflare Dashboard → Workers & Pages → wedding-journey → Settings → Functions → KV**
2. Chọn namespace `wedding_guests` → **KV Values** → tìm key `guests:list`
3. Bấm **View** → copy toàn bộ nội dung JSON

### Cách 2 — Cloudflare CLI (nhanh hơn)

```bash
npx wrangler kv key get "guests:list" \
  --namespace-id <NAMESPACE_ID> \
  --remote > khach-moi.json
```

> Nếu lệnh trên báo lỗi quyền → CLI của bạn đang đăng nhập **account khác**
> với project (xem `npx wrangler whoami`). Khi đó dùng Cách 1.

### Import vào Supabase

1. Đảm bảo đã đăng nhập thành công ở `/admin` (bước 1–3 xong)
2. Vào `/admin` → bấm **Nhập JSON** → chọn file `khach-moi.json`

`id` được sinh lại khi import → không trùng với dữ liệu cũ.

### Nếu không còn dữ liệu cũ

Không sao — bạn có thể nhập tay từ đầu, hoặc dùng **Xuất CSV** từ bản cũ
nếu còn file.

---

## Bước 6 — Dọn Cloudflare

Sau khi deploy bản mới và xác nhận hoạt động:

**Cloudflare Dashboard → Workers & Pages → wedding-journey → Settings → Functions**

- Xoá **KV namespace binding**: `GUESTS_KV`
- Xoá **Secrets**: `ADMIN_PASSWORD`, `ADMIN_SECRET`

Cloudflare giờ chỉ còn làm hosting static — không còn binding, không còn secret.

> ⚠️ **Chỉ xoá KV binding SAU khi đã migrate xong dữ liệu** (Bước 5) — xoá
> binding là mất dữ liệu cũ (KV vẫn còn namespace nhưng app không gọi tới).
