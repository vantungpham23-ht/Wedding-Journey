/**
 * Kiểu Guest + helper chuẩn hoá dữ liệu khách mời.
 *
 * ── LƯU Ý ──
 * Trước đây file này phục vụ CẢ backend (Cloudflare KV) lẫn frontend.
 * Nay backend đã chuyển sang Supabase (`lib/guestsSupabase.ts`), nên ở
 * đây chỉ giữ lại phần frontend cần dùng:
 *   - `Guest`          — kiểu dữ liệu dùng chung
 *   - `normalizeGuest` — chuẩn hoá khi import JSON / đọc từ Supabase
 *   - `newGuestId`     — sinh id cho chế độ lưu cục bộ (dự phòng)
 */

export interface Guest {
  id: string;
  name: string;
  /** Tên người thứ hai — dùng khi mời cặp anh chị */
  name2?: string;
  note: string;
  table?: string;
  /** Cách xưng với khách: anh/chị/cô/chú/bác/em/bạn */
  rel?: string;
  /** Cách hai vợ chồng tự xưng: chúng mình/chúng em/... */
  we?: string;
  createdAt: number;
}

/** Giới hạn an toàn — chống payload quá lớn */
export const MAX_GUESTS = 5000;
export const MAX_NAME_LEN = 200;
export const MAX_NOTE_LEN = 500;
export const MAX_TABLE_LEN = 50;

/** Sinh id ngẫu nhiên (không phụ thuộc crypto.randomUUID để tương thích mọi runtime) */
export function newGuestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Chuẩn hoá 1 object thành Guest hợp lệ.
 * Trả về `null` nếu dữ liệu không dùng được (thiếu tên).
 */
export function normalizeGuest(raw: unknown): Guest | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;

  const name = String(g.name ?? "").trim().slice(0, MAX_NAME_LEN);
  if (!name) return null;

  const id =
    typeof g.id === "string" && g.id.trim()
      ? g.id.trim().slice(0, 64)
      : newGuestId();

  const createdAt =
    typeof g.createdAt === "number" && Number.isFinite(g.createdAt)
      ? g.createdAt
      : Date.now();

  return {
    id,
    name,
    name2: String(g.name2 ?? "").trim().slice(0, MAX_NAME_LEN),
    note: String(g.note ?? "").trim().slice(0, MAX_NOTE_LEN),
    table: String(g.table ?? "").trim().slice(0, MAX_TABLE_LEN),
    rel: String(g.rel ?? "").trim().slice(0, 20),
    we: String(g.we ?? "").trim().slice(0, 20),
    createdAt,
  };
}

/** Chuẩn hoá cả danh sách, loại bỏ phần tử hỏng, giới hạn số lượng */
export function normalizeGuestList(raw: unknown): Guest[] {
  if (!Array.isArray(raw)) return [];
  const out: Guest[] = [];
  for (const item of raw) {
    const g = normalizeGuest(item);
    if (g) out.push(g);
    if (out.length >= MAX_GUESTS) break;
  }
  return out;
}
