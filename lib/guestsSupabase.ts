/**
 * Lớp trung gian giữa UI và Supabase.
 *
 * ── MỤC ĐÍCH ──
 * Trang `/admin` trước đây nói chuyện với Cloudflare Pages Functions qua
 * một hàm duy nhất `api(path, init)` trả về `{ ok, status, data }`.
 *
 * File này thay thế đúng hợp đồng đó bằng Supabase, để **UI không phải
 * sửa dòng nào** — chỉ thay nội dung bên trong `api()`.
 *
 * Bảng trong DB dùng tên cột snake_case; app dùng camelCase
 * (`Guest.table` ↔ cột `table_name`, vì `table` là từ khoá SQL).
 */

import { supabase, ADMIN_EMAIL } from "./supabase";
import { newGuestId, normalizeGuest, type Guest } from "./guests";

/** Kết quả chuẩn hoá — giống hệt hàm `api()` cũ */
export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

/** Hàng trong bảng `guests` (tên cột trong DB) */
interface GuestRow {
  id: string;
  name: string | null;
  note: string | null;
  name2: string | null;
  table_name: string | null;
  rel: string | null;
  we: string | null;
  created_at: number | null;
}

/** Các field được phép sửa từ phía client */
const EDITABLE = ["name", "name2", "note", "table", "rel", "we"] as const;

/** DB row → Guest (app dùng camelCase) */
function rowToGuest(r: GuestRow): Guest | null {
  return normalizeGuest({
    id: r.id,
    name: r.name ?? "",
    name2: r.name2 ?? "",
    note: r.note ?? "",
    table: r.table_name ?? "",
    rel: r.rel ?? "",
    we: r.we ?? "",
    createdAt: r.created_at ?? Date.now(),
  });
}

/**
 * Guest → DB row.
 *
 * `id` luôn được sinh lại ở phía client (không dùng id có sẵn) → không
 * bao giờ trùng id khi import dữ liệu cũ, và không phụ thuộc default
 * của cột trong DB.
 */
function guestToRow(g: Partial<Guest>): Record<string, unknown> {
  return {
    id: newGuestId(),
    name: (g.name ?? "").toString(),
    name2: (g.name2 ?? "").toString(),
    note: (g.note ?? "").toString(),
    table_name: (g.table ?? "").toString(),
    rel: (g.rel ?? "").toString(),
    we: (g.we ?? "").toString(),
    created_at: g.createdAt ?? Date.now(),
  };
}

/** Lọc patch chỉ còn các field hợp lệ, bỏ `id` / `createdAt` */
function patchToRow(patch: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (patch[key] === undefined) continue;
    row[key === "table" ? "table_name" : key] = String(patch[key] ?? "");
  }
  return row;
}

/** Bọc lỗi Supabase thành shape `{ error: string }` giống API cũ */
function errData(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

/** Thông điệp lỗi tiếng Việt cho các case hay gặp */
function friendlyError(message: string, status: number): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Mật khẩu không đúng";
  }
  if (m.includes("email not confirmed")) {
    return "Tài khoản chưa được xác nhận. Hãy bật Auto Confirm User trong Supabase.";
  }
  if (m.includes("row-level security") || status === 401) {
    return "Phiên đăng nhập không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Không kết nối được tới server";
  }
  return message || "Đã có lỗi xảy ra";
}

// =====================================================================
// AUTH
// =====================================================================

/** Đăng nhập bằng mật khẩu admin */
export async function signIn(
  password: string
): Promise<ApiResult<{ ok: boolean; error?: string }>> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error) {
      // Sai mật khẩu → 401 (không phải 5xx) → UI hiện lại màn đăng nhập.
      const status = /invalid login credentials/i.test(error.message) ? 401 : 400;
      return {
        ok: false,
        status,
        data: errData(friendlyError(error.message, status)),
      };
    }

    return { ok: true, status: 200, data: { ok: true } };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: errData(friendlyError(String(e), 0)),
    };
  }
}

/** Đăng xuất — xoá session trên Supabase */
export async function signOut(): Promise<ApiResult<{ ok: boolean }>> {
  try {
    await supabase.auth.signOut();
    return { ok: true, status: 200, data: { ok: true } };
  } catch (e) {
    return { ok: false, status: 0, data: errData(String(e)) };
  }
}

/** Có phiên đăng nhập hợp lệ không */
export async function hasSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

// =====================================================================
// GUESTS CRUD
// =====================================================================

/** GET — lấy toàn bộ danh sách (mới nhất trước) */
export async function fetchGuests(): Promise<
  ApiResult<{ ok: boolean; guests?: Guest[]; error?: string }>
> {
  try {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      return { ok: false, status: 401, data: errData(friendlyError(error.message, 401)) };
    }

    const guests = (data as GuestRow[]).map(rowToGuest).filter((g): g is Guest => g !== null);
    return { ok: true, status: 200, data: { ok: true, guests } };
  } catch (e) {
    return { ok: false, status: 0, data: errData(friendlyError(String(e), 0)) };
  }
}

/** POST — thêm 1 hoặc nhiều khách */
export async function insertGuests(
  payload: unknown
): Promise<ApiResult<{ ok: boolean; guests?: Guest[]; error?: string }>> {
  try {
    const items = Array.isArray(payload) ? payload : [payload];

    const rows = items
      .map((it) => normalizeGuest(it))
      .filter((g): g is Guest => g !== null)
      .map((g) => guestToRow(g));

    if (!rows.length) {
      return { ok: false, status: 400, data: errData("Không có khách hợp lệ để thêm") };
    }

    const { data, error } = await supabase.from("guests").insert(rows).select("*");

    if (error) {
      return { ok: false, status: 400, data: errData(friendlyError(error.message, 400)) };
    }

    const guests = (data as GuestRow[]).map(rowToGuest).filter((g): g is Guest => g !== null);
    return { ok: true, status: 200, data: { ok: true, guests } };
  } catch (e) {
    return { ok: false, status: 0, data: errData(friendlyError(String(e), 0)) };
  }
}

/** PUT — sửa khách theo id */
export async function updateGuest(
  id: string,
  patch: Record<string, unknown>
): Promise<ApiResult<{ ok: boolean; guest?: Guest; error?: string }>> {
  try {
    const row = patchToRow(patch);
    if (!Object.keys(row).length) {
      return { ok: false, status: 400, data: errData("Không có gì để cập nhật") };
    }

    const { data, error } = await supabase
      .from("guests")
      .update(row)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return { ok: false, status: 400, data: errData(friendlyError(error.message, 400)) };
    }
    if (!data) {
      return { ok: false, status: 404, data: errData("Không tìm thấy khách") };
    }

    const guest = rowToGuest(data as GuestRow);
    return { ok: true, status: 200, data: { ok: true, guest: guest ?? undefined } };
  } catch (e) {
    return { ok: false, status: 0, data: errData(friendlyError(String(e), 0)) };
  }
}

/**
 * DELETE — xoá khách theo id, hoặc xoá toàn bộ nếu không có id.
 *
 * Lưu ý: xoá toàn bộ dùng `.neq("id", "")` (không dùng `.delete()` trần)
 * vì PostgREST cần một bộ lọc để tránh xoá nhầm toàn bảng.
 */
export async function deleteGuests(
  id?: string
): Promise<ApiResult<{ ok: boolean; guests?: Guest[]; error?: string }>> {
  try {
    // PostgREST cần một bộ lọc để tránh xoá nhầm toàn bảng.
    // → xoá toàn bộ dùng `.neq("id", "")`.
    const { data, error } = id
      ? await supabase.from("guests").delete().eq("id", id).select("*")
      : await supabase.from("guests").delete().neq("id", "").select("*");

    if (error) {
      return { ok: false, status: 400, data: errData(friendlyError(error.message, 400)) };
    }

    const guests = (data as GuestRow[]).map(rowToGuest).filter((g): g is Guest => g !== null);
    return { ok: true, status: 200, data: { ok: true, guests } };
  } catch (e) {
    return { ok: false, status: 0, data: errData(friendlyError(String(e), 0)) };
  }
}

// =====================================================================
// ROUTER — giống hệt `api(path, init)` cũ
// =====================================================================

/**
 * Điểm vào duy nhất mà UI gọi.
 *
 * Ánh xạ:
 *   GET    /api/guests        → fetchGuests()
 *   POST   /api/guests        → insertGuests(body)
 *   PUT    /api/guests?id=xx  → updateGuest(id, body)
 *   DELETE /api/guests?id=xx  → deleteGuests(id)
 *   DELETE /api/guests        → deleteGuests() (xoá tất cả)
 *   POST   /api/auth          → signIn(body.password)
 *   DELETE /api/auth          → signOut()
 */
export async function apiCall<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  const method = (init?.method ?? "GET").toUpperCase();
  const url = new URL(path, "https://local.invalid");
  const id = url.searchParams.get("id") ?? undefined;

  let body: unknown = undefined;
  if (init?.body && typeof init.body === "string") {
    try {
      body = JSON.parse(init.body);
    } catch {
      return { ok: false, status: 400, data: errData("Body không hợp lệ") as T };
    }
  }

  if (path === "/api/auth") {
    if (method === "POST") {
      const password = (body as { password?: unknown } | undefined)?.password;
      return (await signIn(typeof password === "string" ? password : "")) as ApiResult<T>;
    }
    if (method === "DELETE") {
      return (await signOut()) as ApiResult<T>;
    }
    return { ok: false, status: 405, data: errData("Method không được hỗ trợ") as T };
  }

  if (path === "/api/guests") {
    if (method === "GET") return (await fetchGuests()) as ApiResult<T>;
    if (method === "POST") return (await insertGuests(body)) as ApiResult<T>;
    if (method === "PUT") {
      if (!id) return { ok: false, status: 400, data: errData("Thiếu tham số id") as T };
      const patch = (body ?? {}) as Record<string, unknown>;
      return (await updateGuest(id, patch)) as ApiResult<T>;
    }
    if (method === "DELETE") return (await deleteGuests(id)) as ApiResult<T>;
  }

  return { ok: false, status: 405, data: errData("Method không được hỗ trợ") as T };
}
