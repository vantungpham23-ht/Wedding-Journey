/**
 * /api/guests — CRUD danh sách khách mời
 *
 *   GET    /api/guests        → lấy toàn bộ danh sách
 *   POST   /api/guests        → thêm 1 khách
 *   PUT    /api/guests?id=xx  → sửa khách theo id
 *   DELETE /api/guests?id=xx  → xoá khách theo id
 *   DELETE /api/guests        → xoá toàn bộ
 *
 * Mọi method đều yêu cầu cookie phiên hợp lệ, nếu không → 401.
 *
 * ── GHI CHÚ VỀ KV ──
 * KV có tính chất "eventual consistency": ghi xong đọc lại có thể thấy
 * dữ liệu cũ trong vài giây. Ở đây mỗi lần ghi đều đọc toàn bộ danh
 * sách, thay đổi 1 phần tử, rồi ghi lại cả mảng — nên nếu có 2 thao
 * tác chạy gần nhau thì thao tác sau có thể ghi đè thao tác trước.
 * Với danh sách khách cưới (vài chục–vài trăm người, 1 người thao
 * tác) thì không có vấn đề.
 */

import type { PagesFunction } from "../_lib/types";
import { isAuthenticated, unauthorized } from "../_lib/auth";
import {
  newGuestId,
  normalizeGuest,
  normalizeGuestList,
  readGuests,
  writeGuests,
} from "../../lib/guests";

/** Kiểm tra đã đăng nhập chưa */
async function requireAuth(ctx: Parameters<PagesFunction>[0]): Promise<Response | null> {
  const secret = ctx.env.ADMIN_SECRET ?? "";
  if (!secret) {
    return Response.json(
      { ok: false, error: "Server chưa cấu hình ADMIN_SECRET" },
      { status: 500 }
    );
  }
  const ok = await isAuthenticated(ctx, secret);
  if (!ok) return unauthorized();
  return null;
}

/** GET — lấy toàn bộ danh sách */
export const onRequestGet: PagesFunction = async (ctx) => {
  const denied = await requireAuth(ctx);
  if (denied) return denied;

  const kv = ctx.env.GUESTS_KV;
  if (!kv) {
    return Response.json(
      { ok: false, error: "Server chưa bind GUESTS_KV" },
      { status: 500 }
    );
  }

  const guests = await readGuests(kv);
  return Response.json({ ok: true, guests });
};

/** POST — thêm 1 khách */
export const onRequestPost: PagesFunction = async (ctx) => {
  const denied = await requireAuth(ctx);
  if (denied) return denied;

  const kv = ctx.env.GUESTS_KV;
  if (!kv) {
    return Response.json(
      { ok: false, error: "Server chưa bind GUESTS_KV" },
      { status: 500 }
    );
  }

  let payload: unknown;
  try {
    payload = await ctx.request.json();
  } catch {
    return Response.json({ ok: false, error: "Body không hợp lệ" }, { status: 400 });
  }

  // Chấp nhận cả 1 object lẫn 1 mảng (tiện cho import hàng loạt)
  const items = Array.isArray(payload) ? payload : [payload];

  const current = await readGuests(kv);
  const added: ReturnType<typeof normalizeGuest>[] = [];

  for (const item of items) {
    const g = normalizeGuest(item);
    if (!g) continue;
    // Server chủ động sinh id mới khi thêm (tránh trùng id do client gửi)
    const guest: NonNullable<typeof g> = {
      ...g,
      id: newGuestId(),
      createdAt: g.createdAt || Date.now(),
    };
    current.unshift(guest);
    added.push(guest);
  }

  if (!added.length) {
    return Response.json(
      { ok: false, error: "Không có khách hợp lệ để thêm" },
      { status: 400 }
    );
  }

  await writeGuests(kv, current);
  return Response.json({ ok: true, guests: added });
};

/** PUT — sửa khách theo id (?id=xxx) */
export const onRequestPut: PagesFunction = async (ctx) => {
  const denied = await requireAuth(ctx);
  if (denied) return denied;

  const kv = ctx.env.GUESTS_KV;
  if (!kv) {
    return Response.json(
      { ok: false, error: "Server chưa bind GUESTS_KV" },
      { status: 500 }
    );
  }

  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) {
    return Response.json({ ok: false, error: "Thiếu tham số id" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = ((await ctx.request.json()) ?? {}) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Body không hợp lệ" }, { status: 400 });
  }

  const current = await readGuests(kv);
  const index = current.findIndex((g) => g.id === id);
  if (index === -1) {
    return Response.json({ ok: false, error: "Không tìm thấy khách" }, { status: 404 });
  }

  // Chỉ cho sửa các field an toàn — không cho đổi id/createdAt từ client
  const merged = normalizeGuest({
    ...current[index],
    name: payload.name ?? current[index].name,
    name2: payload.name2 ?? current[index].name2,
    note: payload.note ?? current[index].note,
    table: payload.table ?? current[index].table,
    rel: payload.rel ?? current[index].rel,
    we: payload.we ?? current[index].we,
  });

  if (!merged) {
    return Response.json({ ok: false, error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  current[index] = { ...merged, id: current[index].id, createdAt: current[index].createdAt };
  await writeGuests(kv, current);
  return Response.json({ ok: true, guest: current[index] });
};

/**
 * DELETE — xoá khách theo id, hoặc xoá toàn bộ nếu không có id.
 */
export const onRequestDelete: PagesFunction = async (ctx) => {
  const denied = await requireAuth(ctx);
  if (denied) return denied;

  const kv = ctx.env.GUESTS_KV;
  if (!kv) {
    return Response.json(
      { ok: false, error: "Server chưa bind GUESTS_KV" },
      { status: 500 }
    );
  }

  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id")?.trim();

  // Không có id → xoá toàn bộ
  if (!id) {
    await writeGuests(kv, []);
    return Response.json({ ok: true, guests: [] });
  }

  const current = await readGuests(kv);
  const next = current.filter((g) => g.id !== id);
  if (next.length === current.length) {
    return Response.json({ ok: false, error: "Không tìm thấy khách" }, { status: 404 });
  }

  await writeGuests(kv, next);
  return Response.json({ ok: true, guests: next });
};

/** Method khác → 405 */
export const onRequest: PagesFunction = async () => {
  return Response.json(
    { ok: false, error: "Method không được hỗ trợ" },
    { status: 405 }
  );
};
