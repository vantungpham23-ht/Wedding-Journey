/**
 * POST /api/auth — đăng nhập admin
 *
 * Body: `{ password: string }`
 * Trả:  `{ ok: true }` + cookie phiên, hoặc 401 nếu sai mật khẩu.
 *
 * Lưu ý bảo mật:
 *   - So sánh mật khẩu bằng hàm timing-safe (tránh lộ thông tin qua
 *     thời gian phản hồi).
 *   - Cookie `HttpOnly` → JavaScript không đọc được → XSS không lấy
 *     được token.
 *   - `SameSite=Lax` → chống CSRF từ site khác.
 *   - Rate-limit đơn giản theo IP để chống đoán mật khẩu.
 */

import type { PagesFunction } from "../_lib/types";
import {
  buildClearSessionCookie,
  buildSessionCookie,
  createSessionToken,
  timingSafeEqual,
} from "../_lib/auth";

/** Số lần thử sai tối đa trong 15 phút, theo IP */
const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Bộ đếm thử sai trong bộ nhớ của isolate.
 *
 * Hạn chế: đây chỉ là lưới an toàn mỏng, chống việc dò mật khẩu liên
 * tục trong 1 phiên. Muốn chống triệt để thì dùng Cloudflare WAF
 * rate-limit rule, hoặc Cloudflare Access.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export const onRequestPost: PagesFunction = async (ctx) => {
  const { request, env } = ctx;

  const ip = clientIp(request);
  if (!checkRateLimit(ip)) {
    return Response.json(
      { ok: false, error: "Quá nhiều lần thử. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return Response.json({ ok: false, error: "Body không hợp lệ" }, { status: 400 });
  }

  const expected = env.ADMIN_PASSWORD ?? "";
  if (!expected) {
    // Misconfiguration: thiếu secret → từ chối, không lộ thông tin
    return Response.json(
      { ok: false, error: "Server chưa cấu hình ADMIN_PASSWORD" },
      { status: 500 }
    );
  }

  if (!timingSafeEqual(password, expected)) {
    return Response.json(
      { ok: false, error: "Mật khẩu không đúng" },
      { status: 401 }
    );
  }

  // Đúng mật khẩu → xoá bộ đếm thử sai
  attempts.delete(ip);

  const token = await createSessionToken(env.ADMIN_SECRET ?? "");
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": buildSessionCookie(request, token, 60 * 60 * 24 * 30),
      },
    }
  );
};

/** DELETE /api/auth — đăng xuất (xoá cookie phiên) */
export const onRequestDelete: PagesFunction = async (ctx) => {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": buildClearSessionCookie(ctx.request) } }
  );
};
