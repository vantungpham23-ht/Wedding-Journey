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


-- ---------------------------------------------------------------------
-- 6. Kiểm tra (chạy từng lệnh sau khi script)
--
-- RLS đang chặn anonymous:
--   curl "https://<ref>.supabase.co/rest/v1/guests?select=id" \
--        -H "apikey: <anon key>"
--   → kết quả: []
--
-- Realtime đã bật:
--   select * from pg_publication_tables where tablename = 'guests';
--   → kết quả: 1 dòng
-- ---------------------------------------------------------------------
