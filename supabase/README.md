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
3. Tạo policy `guests_authenticated_all` — **chỉ tài khoản đã đăng nhập** được đọc/ghi
4. Bật realtime (để mọi thiết bị tự đồng bộ) + dọn user trùng email

---

## Bước 2 — Tạo tài khoản admin

Trang `/admin` có form **email + mật khẩu**. Bạn tự quyết định email nào,
nên cần tạo user trong Supabase:

**Authentication → Users → Add user → Create new user**

1. **Email**: email bạn muốn dùng (vd. email của bạn)
2. **Password**: mật khẩu bạn muốn đặt
3. ✅ Tick **Auto Confirm User** ← **quan trọng**, nếu không sẽ không đăng nhập được
4. Bấm **Create user**

> 💡 Dùng **email thật** sẽ tiện hơn vì:
> - Không cần confirm email thủ công
> - Nếu sau này bật "Reset password" thì Supabase gửi mail được
>
> Email `.local` (vd. `admin@wedding.local`) **không nhận được mail** → phải
> confirm thủ công trong Dashboard.

### Nếu bị lỗi "Invalid login credentials" dù mật khẩu đúng

Khi signup mà user chưa confirm, Supabase vẫn tạo user **MỚI** dù email đã
tồn tại → nhiều row trùng email → `signInWithPassword` không biết user nào
cần soát mật khẩu → báo sai.

**Cách sửa:** chạy script ở Bước 1 (phần 6 trong `schema.sql`) — nó tự xoá
user trùng, giữ lại đúng 1 và **confirm email** cho user đó.

Hoặc làm thủ công: **Authentication → Users** → xoá các bản ghi trùng email,
**chỉ giữ lại 1** → bấm **⋮** → **Confirm email**.

### Tắt signup công khai (khuyến nghị)

Form đăng nhập cho phép nhập email tự do, nên policy RLS chỉ chặn được
anonymous. Để **chỉ tài khoản admin** truy cập được bảng `guests`:

**Authentication → Sign In / Providers → Email → bỏ "Allow new users to sign up"**

> Sau khi tắt signup, khi đăng nhập sai sẽ báo "Invalid login credentials" —
> đúng như mong đợi.
>
> Muốn siết chặt hơn nữa → sửa policy trong `schema.sql` thành:
> ```sql
> using ((select auth.jwt() ->> 'email') = 'email-của-bạn')
> ```

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
