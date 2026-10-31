-- =====================================================================
-- Wedding Journey — Supabase schema
--
-- Chạy 1 lần trong: Supabase Dashboard → SQL Editor → New query → Run
--
-- Ghi chú: script này IDEMPOTENT (chạy lại nhiều lần vẫn OK).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Bảng danh sách khách
--
-- Tên cột dùng snake_case. `table` là TỪ KHOÁ SQL nên đặt là `table_name`
-- để khỏi phải nháy kép mỗi lần truy vấn.
-- ---------------------------------------------------------------------
create table if not exists public.guests (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  name2       text not null default '',
  note        text not null default '',
  table_name  text not null default '',
  rel         text not null default '',
  we          text not null default '',
  created_at  bigint not null default 0
);

comment on column public.guests.table_name is
  'Bàn khách. Tên cột đổi từ `table` vì `table` là từ khoá SQL.';


-- ---------------------------------------------------------------------
-- 2. Row Level Security
--
-- Bảng chỉ mở cho vai trò `authenticated` (đã đăng nhập).
-- Anonymous (chưa đăng nhập) → không đọc, không ghi.
-- ---------------------------------------------------------------------
alter table public.guests enable row level security;

-- Gỡ policy cũ nếu có (để script chạy lại được)
drop policy if exists "guests_authenticated_all" on public.guests;
drop policy if exists "guests_admin_only"      on public.guests;


-- ---------------------------------------------------------------------
-- 3. Policy: CHỈ tài khoản admin được đọc/ghi
--
-- Vì sao không dùng policy "authenticated_all"?
--   → Vì Supabase mặc định MỞ signup công khai. Nếu policy chỉ kiểm tra
--     `authenticated` thì bất kỳ ai đăng ký 1 tài khoản mới cũng đọc/ghi
--     được bảng `guests` (tên + bàn của khách mời).
--
-- Cách đúng: khoá theo CHÍNH email admin. Kể cả khi ai đó đăng ký thêm
-- tài khoản, họ vẫn không chạm được vào bảng.
--
-- Lưu ý: email trong JWT là claim `email` (Supabase luôn kèm mặc định).
-- ---------------------------------------------------------------------
create policy "guests_admin_only"
  on public.guests
  for all
  to authenticated
  using (
    (select auth.jwt() ->> 'email') = 'admin@wedding.local'
  )
  with check (
    (select auth.jwt() ->> 'email') = 'admin@wedding.local'
  );


-- ---------------------------------------------------------------------
-- 4. Realtime — để mọi thiết bị tự đồng bộ
--
-- Bật để trang /admin nhận thay đổi qua websocket: sửa trên điện thoại
-- → PC tự cập nhật, không cần F5.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guests'
  ) then
    alter publication supabase_realtime add table public.guests;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 5. Index — sort danh sách theo thời gian thêm mới
-- ---------------------------------------------------------------------
create index if not exists guests_created_at_idx
  on public.guests (created_at desc);


-- =====================================================================
-- 6. TÀI KHOẢN ADMIN — xoá user trùng & xác nhận email
--
-- VÌ SAO CẦN ĐOẠN NÀY?
--   Khi signup mà user chưa confirm, GoTrue vẫn tạo user MỚI dù email
--   đã tồn tại. Gọi signup nhiều lần → nhiều row trùng email.
--   Khi đó `signInWithPassword` không biết user nào cần soát mật khẩu
--   → báo "Invalid login credentials" dù mật khẩu đúng.
--
--   → Xoá hết user trùng, giữ lại ĐÚNG 1, và confirm email cho nó.
--
-- ⚠️  `auth.users` là bảng của Supabase Auth — chỉ chạy được trong
--     SQL Editor của project (không chạy được qua anon key).
-- =====================================================================

do $$
declare
  keep_id uuid;
begin
  -- Giữ lại user ĐÃ có identity + confirmed; nếu không có thì giữ user
  -- tạo gần nhất. Xoá các bản ghi trùng còn lại.
  select id into keep_id
  from auth.users
  where email = 'admin@wedding.local'
  order by (email_confirmed_at is not null) desc, created_at desc
  limit 1;

  if keep_id is not null then
    -- Xoá các bản ghi trùng email (giữ lại keep_id)
    delete from auth.users
    where email = 'admin@wedding.local'
      and id <> keep_id;

    -- Xác nhận email → cho phép đăng nhập bằng mật khẩu ngay
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = keep_id;

    -- Đảm bảo user có identity (bản ghi trong auth.identities)
    if not exists (
      select 1 from auth.identities where user_id = keep_id
    ) then
      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        keep_id,
        keep_id,
        keep_id,
        jsonb_build_object(
          'sub', keep_id::text,
          'email', 'admin@wedding.local',
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(), now(), now()
      );
    end if;

    raise notice 'Admin user: % (đã confirm, đã xoá bản ghi trùng)', keep_id;
  else
    raise notice 'Chưa có user admin@wedding.local — hãy tạo trong Authentication → Users';
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 7. Kiểm tra (chạy từng lệnh sau khi script)
--
-- RLS đang chặn anonymous:
--   curl "https://<ref>.supabase.co/rest/v1/guests?select=id" \
--        -H "apikey: <anon key>"
--   → kết quả: []
--
-- Realtime đã bật:
--   select * from pg_publication_tables where tablename = 'guests';
--   → kết quả: 1 dòng
--
-- Admin user đã sạch & confirmed:
--   select email, email_confirmed_at, created_at
--   from auth.users where email = 'admin@wedding.local';
--   → kết quả: ĐÚNG 1 dòng, email_confirmed_at khác null
-- ---------------------------------------------------------------------
