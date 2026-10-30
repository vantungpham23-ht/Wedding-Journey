/**
 * Kiểu Guest + helper đọc/ghi danh sách khách trong KV.
 *
 * Dùng chung giữa backend (`functions/`) và frontend (`app/admin/`)
 * để đảm bảo cấu trúc dữ liệu luôn giống nhau.
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

/** Key lưu danh sách khách trong KV */
export const GUESTS_KEY = "guests:list";

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

/**
 * Đọc danh sách khách từ KV.
 * Trả về mảng rỗng nếu chưa có dữ liệu hoặc dữ liệu hỏng.
 */
export async function readGuests(
  kv: { get(key: string, type?: "text"): Promise<string | null> }
): Promise<Guest[]> {
  try {
    const raw = await kv.get(GUESTS_KEY, "text");
    if (!raw) return [];
    return normalizeGuestList(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** Ghi danh sách khách vào KV */
export async function writeGuests(
  kv: { put(key: string, value: string): Promise<void> },
  guests: Guest[]
): Promise<void> {
  const safe = normalizeGuestList(guests).slice(0, MAX_GUESTS);
  await kv.put(GUESTS_KEY, JSON.stringify(safe));
}
