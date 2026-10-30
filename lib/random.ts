/**
 * PRNG có seed cố định (mulberry32).
 *
 * Vì sao cần: `Math.random()` cho giá trị khác nhau ở server và client →
 * React hydration mismatch (style lệch). Dùng seeded PRNG thì cả 2 bên
 * render ra KẾT QUẢ GIỐNG HỆT NHAU.
 *
 * Chỉ dùng cho giá trị render ra DOM. Không dùng cho logic/ID ngẫu nhiên
 * cần duy nhất (khi đó hãy sinh trong useEffect để chỉ chạy client).
 */

export function createRandom(seed: number) {
  let a = seed >>> 0;
  return function random(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed cố định cho các effect hạt (particle/petal) */
export const PARTICLE_SEED = 20261227;
