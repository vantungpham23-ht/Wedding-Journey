/**
 * Kiểu dữ liệu cho Cloudflare Pages Functions.
 *
 * ── VÌ SAO TỰ ĐỊNH NGHĨA MÀ KHÔNG DÙNG @cloudflare/workers-types? ──
 * Thư viện đó khai báo `/// <reference lib="webworker" />` → xung đột
 * với `lib: ["dom"]` trong tsconfig.json của Next.js (cả hai đều định
 * nghĩa `Request`, `Response`, `crypto`).
 *
 * Giải pháp: khai báo đúng những gì mình dùng, đủ nhỏ để không đụng
 * DOM types. `wrangler` vẫn compile TypeScript của Pages Functions bình
 * thường — nó không cần bản khai báo chính thức.
 */

/** Biến môi trường + binding của Pages Functions */
export interface Env {
  /** KV namespace chứa danh sách khách */
  GUESTS_KV: KVNamespaceLike;
  /** Mật khẩu đăng nhập admin (Secret) */
  ADMIN_PASSWORD: string;
  /** Muối ký cookie phiên (Secret) */
  ADMIN_SECRET: string;
}

/**
 * Interface tối giản của Cloudflare KV.
 *
 * Chỉ khai báo 2 method mình dùng (`get` / `put`) thay vì cả interface
 * chính thức — vì interface đầy đủ dài hơn nhiều và không cần thiết.
 */
export interface KVNamespaceLike {
  get(key: string, type?: "text"): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

/** Context của Pages Function */
export interface EventContext<EnvType = Env> {
  request: Request;
  env: EnvType;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

/** Kiểu handler của Pages Function */
export type PagesFunction<EnvType = Env> = (
  ctx: EventContext<EnvType>
) => Response | Promise<Response>;
