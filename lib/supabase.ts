import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client — nguồn dữ liệu duy nhất cho danh sách khách mời.
 *
 * ── TẠI SAO HARDCODE URL + ANON KEY? ──
 * Trước đây dữ liệu nằm trên Cloudflare KV và cần bind `GUESTS_KV`
 * + set 2 secret trong Dashboard. Hai bước đó nằm ở account khác
 * nên rất dễ lệch → dữ liệu "không đồng bộ".
 *
 * Với Supabase:
 *   - `anon` key là public (ai xem source cũng thấy) — KHÔNG phải bí mật.
 *   - An toàn nhờ Row Level Security: bảng `guests` chỉ mở cho
 *     những tài khoản đã đăng nhập (và chỉ đúng tài khoản admin).
 *   - Vì vậy cố ý KHÔNG dùng biến môi trường → không phải set env var
 *     trong Cloudflare Dashboard → xoá hẳn nguồn rắc rối cấu hình.
 *
 * ── THÔNG TIN ĐĂNG NHẬP ──
 * Email và mật khẩu KHÔNG nằm trong code. Người dùng nhập ở form
 * đăng nhập → `signInWithPassword` đối chiếu ở phía Supabase.
 */

const SUPABASE_URL = "https://qlqfyyzevlleksuepsxh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscWZ5eXpldmxsZWtzdWVwc3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0Mjc4MDEsImV4cCI6MjEwOTAwMzgwMX0.ubqjs0p4ZREG8m8y3VXt8ZE8rPaSydlnC5s-bZITe9w";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Lưu session vào localStorage → không bị logout khi F5 / đóng tab.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
