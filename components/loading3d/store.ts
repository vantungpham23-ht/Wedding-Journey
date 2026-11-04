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
 * ── ASSET GATE ──
 * ⚠ Đồng hồ CHỈ chạy sau khi MỌI model đã tải xong. Trước đây đồng
 *   hồ chạy ngay khi Canvas mount → trong lúc tải model (backdrop
 *   6.9MB + 2 nhân vật ~6.6MB) timeline đã chạy mất mấy giây → khi
 *   model xong, nhân vật hiện ra đột ngột giữa cảnh + GPU phải
 *   compile shader ngay lúc đó → KHỰNG LAG.
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
 * Dùng Set path để không đếm trùng (React StrictMode mount 2 lần
 * trong dev, hoặc 1 model dùng ở nhiều chỗ).
 */
export const assetTracker = {
  /** Các path đã tải xong */
  loaded: new Set<string>(),
  /** Tổng số model cần tải */
  expected: 5,
  /** Callback được gọi khi tất cả model xong */
  listeners: new Set<() => void>(),

  /** Đánh dấu 1 model đã tải xong */
  markLoaded(path: string) {
    if (this.loaded.has(path)) return;
    this.loaded.add(path);
    if (this.loaded.size >= this.expected) {
      this.listeners.forEach((cb) => cb());
    }
  },

  /**
   * Đăng ký callback khi tất cả model xong.
   *
   * ⚠ CÓ TIMEOUT DỰ PHÒNG (8s): nếu 1 model lỗi / mạng chậm, scene
   *   vẫn phải chạy — không được để người xem bị treo vĩnh viễn ở
   *   màn hình đen.
   */
  onAllReady(cb: () => void): () => void {
    if (this.loaded.size >= this.expected) {
      cb();
      return () => {};
    }
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  },

  /** Bắt đầu đếm ngược dự phòng — gọi khi scene đã mount */
  startFallbackTimer(onTimeout: () => void, ms = 8000) {
    if (this.ready) return () => {};
    const timer = setTimeout(() => {
      if (this.ready) return;
      // Cho phép chạy dù chưa đủ model
      this.loaded.add("__fallback__");
      this.listeners.forEach((cb) => cb());
    }, ms);
    return () => clearTimeout(timer);
  },

  /** Đã sẵn sàng chưa */
  get ready() {
    return this.loaded.size >= this.expected;
  },
};
