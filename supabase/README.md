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

## Bước 2 — Tạo / sửa tài khoản admin

**Authentication → Users**

Tài khoản `admin@wedding.local` **đã được tạo** (qua API signup), nhưng đang ở
trạng thái **chưa xác nhận email** → chưa đăng nhập được.

### Cách 1 (khuyến nghị) — dùng email thật

Nếu bạn muốn dùng email thật (vd. email của bạn):

1. **Authentication → Users → Add user → Create new user**
2. Điền email + mật khẩu
3. ✅ Tick **Auto Confirm User**
4. Xong

Sau đó cập nhật `ADMIN_EMAIL` trong `lib/supabase.ts` và `email` trong policy
(`supabase/schema.sql` → chạy lại script để áp policy mới).

### Cách 2 — xác nhận tài khoản `admin@wedding.local` sẵn có

Trong danh sách Users, tìm `admin@wedding.local` → bấm **⋮** (menu) → **Confirm email**

> ⚠️ **Lưu ý**: email `.local` không nhận được mail, nên không thể bấm link
> xác nhận qua email. Phải xác nhận thủ công trong Dashboard (Cách 2) hoặc
> dùng email thật (Cách 1).

### Có thể xoá user cũ trùng email

Do gọi signup nhiều lần, có thể có vài user cùng email `admin@wedding.local`.
Trong danh sách Users, xoá hết các bản ghi trùng, **chỉ giữ lại 1** và
**Confirm email** cho user đó.

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

## Bước 5 — Migrate dữ liệu cũ

Dữ liệu cũ vẫn nằm trên Cloudflare KV. Trước khi deploy bản mới:

1. Vào trang `/admin` trên bản **hiện tại** (production cũ) → bấm **Xuất JSON**
   → có file `khach-moi-YYYY-MM-DD.json`
2. Deploy bản mới
3. Vào `/admin` bản mới → bấm **Nhập JSON** → chọn file đó

`id` được sinh lại khi import → không trùng với dữ liệu cũ.

---

## Bước 6 — Dọn Cloudflare

Sau khi deploy bản mới và xác nhận hoạt động:

**Cloudflare Dashboard → Workers & Pages → wedding-journey → Settings → Functions**

- Xoá **KV namespace binding**: `GUESTS_KV`
- Xoá **Secrets**: `ADMIN_PASSWORD`, `ADMIN_SECRET`

Cloudflare giờ chỉ còn làm hosting static — không còn binding, không còn secret.
