/**
 * Xác thực admin — mật khẩu + cookie phiên ký HMAC.
 *
 * ── THIẾT KẾ PHIÊN ĐĂNG NHẬP ──
 * Không dùng database cho session. Thay vào đó:
 *
 *   1. Admin nhập mật khẩu → so với `ADMIN_PASSWORD`.
 *   2. Nếu đúng, server tạo token = `timestamp.signature`,
 *      trong đó signature = HMAC-SHA256(timestamp, ADMIN_SECRET).
 *   3. Token đưa vào cookie `HttpOnly` (JS không đọc được → XSS không
 *      lấy được token).
 *   4. Mỗi request sau, server verify lại chữ ký + kiểm tra token
 *      chưa quá hạn.
 *
 * Ưu điểm: không cần KV cho session, không cần dọn dẹp, đổi
 * `ADMIN_SECRET` là đá hết phiên cũ ngay lập tức.
 */

import type { EventContext } from "./types";

/** Tên cookie phiên */
export const SESSION_COOKIE = "admin_session";

/** Thời hạn phiên: 30 ngày */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * Tính HMAC-SHA256 bằng Web Crypto API (có sẵn trong Cloudflare Workers).
 * Kết quả trả về dạng hex.
 */
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * So sánh 2 chuỗi an toàn về thời gian (chống timing attack).
 *
 * Luôn so sánh đủ `max(len(a), len(b))` ký tự để thời gian phản hồi
 * không phụ thuộc vào vị trí ký tự khác nhau đầu tiên.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Tạo token phiên hợp lệ.
 * Format: `<timestamp>.<hmac>` — timestamp là số mili giây.
 */
export async function createSessionToken(secret: string): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacHex(secret, ts);
  return `${ts}.${sig}`;
}

/**
 * Kiểm tra token có hợp lệ & còn hạn không.
 *
 * Hạn được suy ra từ timestamp trong chính token: token hết hạn khi
 * `issuedAt + ttl` đã qua. Không cần lưu hạn ở đâu khác.
 */
export async function verifySessionToken(
  token: string | null,
  secret: string,
  ttlSeconds: number
): Promise<boolean> {
  if (!token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const ts = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Token phải có dạng timestamp hợp lệ
  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt)) return false;

  // Kiểm tra hạn: quá TTL thì từ chối
  if (Date.now() > issuedAt + ttlSeconds * 1000) return false;

  const expected = await hmacHex(secret, ts);
  return timingSafeEqual(sig, expected);
}

/** Lấy giá trị 1 cookie từ header `Cookie` */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * Trả về `Set-Cookie` header để thiết lập phiên.
 *
 * `Secure` chỉ được bật khi request đi qua HTTPS — nếu bật luôn thì
 * cookie sẽ không được ghi khi debug local ở `http://localhost`.
 */
export function buildSessionCookie(
  request: Request,
  token: string,
  maxAgeSeconds: number
): string {
  const isHttps = new URL(request.url).protocol === "https:";
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps) parts.push("Secure");
  return parts.join("; ");
}

/** Xoá cookie phiên */
export function buildClearSessionCookie(request: Request): string {
  const isHttps = new URL(request.url).protocol === "https:";
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isHttps) parts.push("Secure");
  return parts.join("; ");
}

/**
 * Kiểm tra request có hợp lệ (đã đăng nhập) không.
 *
 * Hạn phiên suy ra từ timestamp trong token → không cần lưu thêm.
 */
export async function isAuthenticated(
  ctx: EventContext,
  secret: string
): Promise<boolean> {
  const token = readCookie(ctx.request, SESSION_COOKIE);
  return verifySessionToken(token, secret, SESSION_TTL_SECONDS);
}

/** Response 401 chuẩn */
export function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ ok: false, error: message }, { status: 401 });
}
