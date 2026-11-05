"use client";

/**
 * Đồng hồ thời gian của scene loading 3D.
 *
 * ── VÌ SAO KHÔNG DÙNG useState / useSyncExternalStore? ──
 * Timeline đổi giá trị 60 lần/giây. Nếu lưu trong React state thì
 * mỗi frame đều re-render toàn bộ cây component → lag.
 *
 * Thay vào đó: 1 object mutable đơn giản.
 *   - Driver (`TimelineDriver`) cập nhật `clock.time` trong `useFrame`
 *   - Các component khác đọc `clock.time` bên trong `useFrame` của họ
 *
 * Kết quả: KHÔNG có React re-render nào trong suốt animation.
 * Chỉ khi scene kết thúc mới báo lên 1 lần qua callback `onDone`.
 *
 * ── ASSET GATE 2 GIAI ĐOẠN ──
 * ⚠ VẤN ĐỀ GỐC: bản đầu chờ **CẢ 5 model** (~15MB) mới chạy timeline.
 *   Trên mạng di động, 15MB mất 10-20 giây → người dùng nhìn màn
 *   hình đen rồi mới thấy cảnh. Cực kỳ khó chịu.
 *
 *   Giải pháp: chia làm 2 chặng.
 *
 *   CHẶNG 1 — "HERO" (chặn timeline, ~1MB):
 *     Chỉ 2 chiếc nhẫn. Đây là thứ khách xem ĐẦU TIÊN. Tải xong
 *     → timeline chạy ngay → nhẫn bay vào.
 *
 *   CHẶNG 2 — "FULL" (tải nền, ~14MB):
 *     Backdrop + chú rể + cô dâu. Timeline vẫn chạy, nhân vật sẽ
 *     tự xuất hiện khi sẵn sàng (đã có sẵn cơ chế fade ở `Character`).
 *
 *   → Tổng thời gian chờ giảm từ ~15-20s xuống ~1-2s.
 */

/** Trạng thái đồng hồ — mutable, không gây re-render */
export const clock = {
  /** Thời gian hiện tại (giây) */
  time: 0,
  /** Đang chạy hay không */
  running: false,
  /** Đã đánh dấu hoàn tất (để tránh gọi onDone nhiều lần) */
  finished: false,
};

/** Reset đồng hồ về 0 */
export function resetClock() {
  clock.time = 0;
  clock.running = false;
  clock.finished = false;
}

/**
 * Theo dõi trạng thái tải của các model 3D.
 *
 * ── HAI CHẶNG ──
 * `hero`  : model nhẹ, quyết định khi nào bắt đầu cảnh (chặn user)
 * `full`  : model nặng, tải nền trong lúc cảnh đang chạy
 *
 * Dùng Set path để không đếm trùng (React StrictMode mount 2 lần
 * trong dev, hoặc 1 model dùng ở nhiều chỗ).
 */
export const assetTracker = {
  /** Các path đã tải xong — chặng HERO */
  loaded: new Set<string>(),
  /** Các path đã tải xong — chặng FULL */
  loadedFull: new Set<string>(),

  /**
   * Model CHẶN timeline (khách thấy ngay).
   *
   * Chỉ 2 chiếc nhẫn — tổng ~1MB. Tải xong → cảnh bắt đầu ngay.
   */
  hero: ["bride-ring", "groom-ring"],

  /**
   * Model TẢI NỀN (không chặn).
   *
   * Backdrop + 2 nhân vật — tổng ~14MB. Timeline chạy song song;
   * nhân vật tự fade-in khi sẵn sàng.
   */
  full: ["wedding-backdrop", "groom", "bride"],

  /** Callback được gọi khi chặng HERO xong */
  listeners: new Set<() => void>(),
  /** Callback được gọi khi chặng FULL xong */
  listenersFull: new Set<() => void>(),

  /**
   * Đánh dấu 1 model đã tải xong.
   *
   * @param path đường dẫn đầy đủ ("/models/bride-ring.glb")
   * @param kind "hero" | "full"
   */
  markLoaded(path: string, kind: "hero" | "full") {
    const set = kind === "hero" ? this.loaded : this.loadedFull;
    if (set.has(path)) return;
    set.add(path);

    // Kiểm tra chặng tương ứng đã đủ chưa
    const required = kind === "hero" ? this.hero : this.full;
    const done = required.every((name) =>
      Array.from(set).some((p) => p.includes(name))
    );
    if (!done) return;

    const cbs = kind === "hero" ? this.listeners : this.listenersFull;
    cbs.forEach((cb) => cb());
  },

  /**
   * Đăng ký callback khi chặng HERO xong.
   *
   * ⚠ CÓ TIMEOUT DỰ PHÒNG: nếu 1 model lỗi / mạng chậm, scene
   *   vẫn phải chạy — không được để người xem bị treo vĩnh viễn ở
   *   màn hình đen.
   */
  onAllReady(cb: () => void): () => void {
    if (this.heroReady) {
      cb();
      return () => {};
    }
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  },

  /**
   * Đăng ký callback khi chặng FULL xong.
   *
   * Dùng để báo cho `Character` biết khi nào fade-in nhân vật.
   */
  onFullReady(cb: () => void): () => void {
    if (this.fullReady) {
      cb();
      return () => {};
    }
    this.listenersFull.add(cb);
    return () => {
      this.listenersFull.delete(cb);
    };
  },

  /**
   * Bắt đầu đếm ngược dự phòng — gọi khi scene đã mount.
   *
   * Nếu sau `ms` chặng HERO vẫn chưa xong → chạy cảnh luôn (dù
   * nhẫn chưa sẵn sàng → sẽ hiện khi tải xong).
   */
  startFallbackTimer(onTimeout: () => void, ms = 6000) {
    const timer = setTimeout(() => {
      if (this.heroReady) return;
      this.listeners.forEach((cb) => cb());
    }, ms);
    return () => clearTimeout(timer);
  },

  /** Chặng HERO đã sẵn sàng chưa */
  get heroReady() {
    return this.hero.every((name) =>
      Array.from(this.loaded).some((p) => p.includes(name))
    );
  },

  /** Chặng FULL đã sẵn sàng chưa */
  get fullReady() {
    return this.full.every((name) =>
      Array.from(this.loadedFull).some((p) => p.includes(name))
    );
  },
};
