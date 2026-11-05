/**
 * TIMELINE LOADING 3D — điều khiển duy nhất cho toàn bộ cảnh.
 *
 * ── TRIỂN KHAI ──
 * Cảnh 3D có 6 giai đoạn, mỗi giai đoạn là 1 "chương" của câu chuyện:
 *
 *   0.0s →  0.15s  DARKNESS    — khoảng lặng ngắn trước khi nhẫn xuất hiện
 *   0.15s → 3.55s  RINGS IN    — 2 chiếc nhẫn bay vào từ 2 phía, CHẬM
 *                                 và nhẹ nhàng (3.4s, ease in-out)
 *   3.55s → 5.55s  RINGS ORBIT — 2 nhẫn quấn quít quanh nhau (2.0s)
 *   4.25s → 5.85s  BACKDROP    — wedding backdrop mờ dần hiện ra (nhẫn
 *                                 vẫn còn trên màn hình, ở phía trước)
 *   5.55s → 7.95s  RINGS RISE  — 2 nhẫn bay lên cao, tách ra, trôi ngay
 *                                 trên đầu chú rể + cô dâu, cao hơn cả vòm
 *   5.95s → 7.75s  COUPLE      — chú rể + cô dâu xuất hiện trên sân khấu,
 *                                 đứng yên tự nhiên (tay buông, thở nhẹ)
 *   7.75s → 10.75s BOW         — cúi chào (đoạn cắt từ clip Mixamo),
 *                                 camera ZOOM VÀO 2 nhân vật
 *  10.15s → 12.55s HANDOFF     — camera lùi ra → hiện nút "Mở thiệp mời"
 *
 * ── ⚠ THAY ĐỔI: CẮT "DARKNESS" 0.8s → 0.15s ──
 * Đo được (dev, localhost): nhẫn hiện ở ~2.1s kể từ lúc mở trang.
 * Phân rã:
 *   520ms  parse JS + hydrate React + setup r3f
 *   615ms  tải + init Draco decoder (344KB)
 *   800ms  "darkness" CỐ Ý trong timeline  ← ĐÃ CẮT
 *
 * 800ms "chờ trước khi nhẫn xuất hiện" là khoảng chết thuần túy —
 * người xem chỉ nhìn màn hình tối, không có gì xảy ra. Đã giảm còn
 * 0.15s (vừa đủ để màn hình kịp chuyển từ trắng → nền đen).
 *
 * ⚠ Tất cả mốc sau `ringEnter` dịch sớm đúng 0.65s → TỔNG thời lượng
 *   cảnh giảm từ 13.2s → 12.55s (vẫn đủ dài cho câu chuyện).
 *
 * ⚠ Nhẫn KHÔNG BAO GIỜ biến mất. Sau khi trôi lên trên đầu 2 nhân vật,
 * chúng lơ lửng nhẹ nhàng tới hết cảnh (bay + đảo chậm, không tan).
 *
 * ⚠ BẤT ĐỒNG BỘ NHẸ VỚI HÀNH ĐỘNG: nhân vật đứng thẳng lại ở 10.75s
 *   nhưng camera đã bắt đầu lùi ra từ 10.15s → màn hình nút hiện ra
 *   TRƯỚC khi nhân vật kịp đứng thẳng hẳn. Cố ý: người xem không
 *   phải chờ, và cảnh ngắn lại.
 *
 * Mọi component đọc `t` (giây) từ 1 store duy nhất → không bao giờ
 * lệch nhịp với nhau.
 */

/** Tổng thời lượng loading (giây) */
export const LOADING_DURATION = 12.55;

/** Thời điểm bắt đầu mỗi giai đoạn */
export const PHASE = {
  backdrop: 0.0,
  rings: 0.15,
  orbit: 3.55,
  rise: 5.55,
  float: 7.95,
  couple: 5.95,
  handoff: 10.75,
} as const;

/** Các mốc thời gian con (giây) */
export const T = {
  /**
   * Nhẫn bắt đầu bay vào.
   *
   * ⚠ ĐÃ GIẢM: 0.8 → 0.15 (xem ghi chú bên dưới).
   */
  ringEnter: 0.15,
  /**
   * Nhẫn bay xong, bắt đầu quấn quít.
   *
   * Bay vào kéo dài 3.4s (thay vì 1.6s) + dùng `easeInOutSine` (vào
   * chậm → tăng tốc → dừng mềm) thay vì `easeOutCubic` (vào nhanh
   * ngay lập tức). Kết quả: nhẫn trôi vào khung hình một cách nhẹ
   * nhàng thay vì "bắn" vào.
   */
  ringLock: 3.55,
  /** Nhẫn quấn quít xong → bắt đầu bay lên trên đầu 2 nhân vật */
  ringOrbitEnd: 5.55,
  /** Nhẫn đã trôi tới vị trí lơ lửng, bắt đầu bay lơ lửng nhẹ */
  ringFloat: 7.95,
  /** Backdrop bắt đầu mờ dần hiện ra (nhẫn vẫn ở phía trước) */
  backdropIn: 4.25,
  /** Backdrop mờ dần xong (1.6s sau backdropIn) */
  backdropReady: 5.85,
  /** Nhân vật bắt đầu xuất hiện trên sân khấu */
  coupleIn: 5.95,
  /** Nhân vật đã hiện hoàn toàn, đứng yên chờ */
  coupleStand: 7.15,
  /** Bắt đầu cúi chào */
  coupleBow: 7.75,
  /**
   * Cúi xong, ngẩng lên, đứng yên chào.
   *
   * ⚠ Khoảng này phải ĐỦ DÀI: nếu scrub clip nhanh hơn tốc độ
   * gốc thì nhân vật bị "giật" dù không có bước nhảy tư thế. Đo
   * world-velocity cho thấy hệ số 0.85× (chú rể) / 0.91× (cô dâu)
   * → mượt.
   */
  coupleBowOut: 10.75,
  /**
   * Camera bắt đầu lùi ra (bắt đầu TẠI ĐÂY, không đợi hết cúi).
   *
   * Rút từ 12.8 → 10.8: camera zoom ra ngay khi nhân vật vừa ngẩng
   * lên, nên màn hình nút hiện ra mà không phải chờ nhân vật đứng
   * thẳng hẳn.
   */
  cameraPull: 10.15,
  /** Xong, hiện nút */
  done: 12.55,
} as const;

/**
 * Khoảng cách vị trí 2 nhẫn khi đang bay vào (đơn vị world).
 *
 * ⚠ Không dùng hằng số cứng, vì camera ĐANG tiến vào trong lúc nhẫn
 * bay. Camera ở z = 7.4 lúc nhẫn xuất hiện → nhẫn ở z = 2.0, khoảng
 * cách 5.4. Với fov 42° × 16:9, mép khung ở x ≈ 5.4 × tan(21°) ×
 * 16/9 = 3.68.
 *
 * Nếu đặt nhẫn ở x = 3.0 thì lúc camera tới gần (z = 3.6), khoảng cách
 * chỉ còn 1.6 → mép khung co lại còn 1.09 → nhẫn BỊ LỆCH RA NGOÀI
 * MÀN HÌNH (đo được: x = 98% ở t = 1.6s).
 *
 * → Tính vị trí start ĐỘNG theo camera hiện tại, để nhẫn luôn nằm
 *   sát mép khung hình rồi trượt vào. Xem `ringStartX()`.
 */
export const RING_START_OFFSET = 3.0;

/**
 * Tính X khởi điểm của nhẫn = nằm NGOÀI mép khung hình.
 *
 * ⚠ Vì sao không dùng hằng số cứng?
 *
 * Camera đang tiến vào trong lúc nhẫn bay vào. Nếu start X cố định,
 * khi camera tới gần (z = 3.6) thì mép khung co lại rất nhanh trong khi
 * nhẫn mới vừa bay được một nửa đường → nhẫn bị đẩy ra ngoài màn
 * hình (đo được: x = 110% ở t = 1.8s).
 *
 * Cách sửa: tính X theo CÔNG THỨC TỈ LỆ MÀN HÌNH — tức là giữ nhẫn
 * ở cùng vị trí tương đối trên màn hình, bất kể camera ở đâu:
 *
 *   x(t) = tan(fov/2) · aspect · (camZ(t) − ringZ(t)) · 0.96
 *
 * Nhẫn luôn nằm sát mép khung (96% chiều ngang), rồi cùng trượt vào.
 * Hệ số 0.96 để nhẫn không bị cắt mất ở rìa màn hình khi xuất hiện.
 *
 * @param camZ vị trí Z của camera tại thời điểm hiện tại
 * @param ringZ vị trí Z của nhẫn tại thời điểm hiện tại
 * @param side +1 = nhẫn phải, -1 = nhẫn trái
 */
export function ringStartX(camZ: number, ringZ: number, side: 1 | -1): number {
  const halfH = Math.tan((42 * Math.PI) / 360);
  const halfW = halfH * (16 / 9);
  // Hệ số 0.96 → nhẫn nằm ngay TRONG mép khung (96% chiều ngang).
  // Nhẫn vẫn "trượt vào từ rìa" nhưng không bao giờ bị cắt mất.
  return side * halfW * (camZ - ringZ) * 0.96;
}

/**
 * Camera Z tại thời điểm hiện tại — dùng để tính vị trí nhẫn theo
 * tỉ lệ màn hình (xem `ringStartX`).
 *
 * Camera chạy theo: 8.2 → CAMERA_Z (tiến vào, 0 → 3s) → CAMERA_Z_BOW
 * (zoom vào lúc cúi) → CAMERA_Z_OUT (lùi ra, T.cameraPull → T.done).
 */
export function cameraZAt(t: number): number {
  const inP = easeInOutSine(lerpProgress(t, 0, 3.0));
  const bowP = easeInOutSine(lerpProgress(t, T.coupleBow, T.coupleBow + 1.6));
  const outP = easeInOutSine(lerpProgress(t, T.cameraPull, T.done));
  return (
    8.2 +
    (CAMERA_Z - 8.2) * inP +
    (CAMERA_Z_BOW - CAMERA_Z) * bowP +
    (CAMERA_Z_OUT - CAMERA_Z_BOW) * outP
  );
}

/**
 * Camera Y tại thời điểm hiện tại.
 *
 * Khi zoom vào lúc cúi, camera hạ xuống ngang tầm mặt nhân vật
 * (y ≈ 0.05) để thấy rõ cúi chào, thay vì nhìn từ trên xuống.
 *
 * Công thức: nội suy TUYẾN TÍNH giữa 3 mốc —
 *   sau khi tiến vào (0.20) → lúc cúi (CAMERA_Y_BOW) → lùi ra (0.20)
 */
export function cameraYAt(t: number): number {
  const inP = easeInOutSine(lerpProgress(t, 0, 3.0));
  const bowP = easeInOutSine(lerpProgress(t, T.coupleBow, T.coupleBow + 1.6));
  const outP = easeInOutSine(lerpProgress(t, T.cameraPull, T.done));

  // Y sau khi tiến vào xong
  const baseY = 1.75 - 1.55 * inP;
  // Khi cúi: hạ xuống CAMERA_Y_BOW
  const bowY = baseY + (CAMERA_Y_BOW - baseY) * bowP;
  // Khi lùi ra: trở về Y cũ
  return bowY + (baseY - bowY) * outP;
}

/**
 * Scale của nhẫn (đường kính gốc 1.89).
 *
 * Nhẫn phải nằm ở Z ÂM (sau trục, gần backdrop) thay vì Z dương:
 * khi ở z = +1.35 và camera z = 2.3 thì khoảng cách chỉ 0.95 →
 * nhẫn chiếm 142% chiều cao màn hình, to đến mức mất chi tiết,
 * thành mảng sáng mờ. Đưa về z = -0.6 + camera z = 3.6 thì nhẫn
 * chiếm ~32% chiều cao → thấy rõ vành, đá và đường khắc.
 */
export const RING_SCALE = 0.55;

/** Z của nhẫn khi đang quấn quít (âm = nằm sâu trong khung hình) */
export const RING_Z = -0.6;

/**
 * Z khởi điểm khi nhẫn bay vào (dương = gần camera hơn).
 *
 * Nhẫn bắt đầu ở z = 2.0 (gần camera) rồi bay vào sâu tới z = -0.6.
 * Nhờ vậy lúc vừa xuất hiện nhẫn đã chiếm ~25% chiều cao thay vì
 * 21% — vừa đủ rõ mà vẫn tạo cảm giác bay từ xa vào.
 */
export const RING_START_Z = 2.0;

/**
 * Bán kính quỹ đạo khi 2 nhẫn quấn quít.
 *
 * ⚠ 2 nhẫn quay CÙNG CHIỀU, lệch phase π (luôn ở 2 đầu đối diện),
 * nhưng có 3 khác biệt để KHÔNG BAO GIỜ chồng lấn:
 *
 *   1. Bán kính khác nhau: 0.42 (nhẫn trong) vs 0.50 (nhẫn ngoài)
 *   2. Biên độ Z khác nhau: 0.7 vs 0.4 → khi 2 nhẫn cắt nhau ở cùng
 *      góc, chúng ở 2 ĐỘ SÂU khác nhau → vẫn thấy rõ 2 chiếc
 *   3. Biên độ Y khác nhau tương ứng tỉ lệ với bán kính
 *
 * Nếu 2 nhẫn quay NGƯỢC chiều + cùng bán kính + cùng biên độ Z thì
 * chúng trùng vị trí HOÀN TOÀN vài lần (đo được: khoảng cách tối
 * thiểu chỉ 0.081, tức là chồng lấn hoàn toàn).
 *
 * Với config dưới đây: khoảng cách tối thiểu = 0.645, chênh lệch z
 * tại điểm gần nhất = 0.494 → 2 nhẫn luôn tách biệt rõ rệt.
 */
export const RING_ORBIT_RADIUS = 0.42;
export const RING_ORBIT_RADIUS_OUTER = 0.5;

/** Biên độ trục Z của quỹ đạo (nhẫn trong bay sâu hơn → tách bạch khi cắt) */
export const RING_ORBIT_Z_AMP = 0.7;
export const RING_ORBIT_Z_AMP_OUTER = 0.4;

/** Biên độ trục Y của quỹ đạo */
export const RING_ORBIT_Y_AMP = 0.45;

/** Số vòng quỹ đạo (2 vòng = nhẫn về đúng điểm xuất phát) */
export const RING_ORBIT_TURNS = 2;

/**
 * Vị trí lơ lửng của nhẫn khi đã bay lên trên đầu 2 nhân vật.
 *
 * ── TẠI SAO CHỌN Y = 0.86? ──
 * Đo từ mesh backdrop: đỉnh vòm ở y = 0.585. Đầu nhân vật mới (scale
 * 0.46, chân tại y = -0.40) ở y = 0.372 (chú rể) / 0.353 (cô dâu).
 *
 * Muốn nhẫn nằm "trên đầu cô dâu chú rể, trên cả vòm backdrop" thì
 * phải cao hơn CẢ HAI → y ≥ 0.585. Chọn 0.86 để có khoảng hở
 * rõ ràng, nhìn là "lơ lửng" chứ không dính vào vòm.
 *
 * Trên màn hình (camera z = 3.6): đỉnh vòm ở 31% chiều cao, đầu
 * nhân vật ở ~37%, nhẫn ở 23% → nằm trên cùng, tách bạch.
 *
 * ── X ĐÃ CẬP NHẬT THEO NHÂN VẬT MỚI (đo 2026-11-04) ──
 * Khoảng cách 2 người đã đổi (COUPLE_GAP 0.58 → 0.40) → đầu 2 người
 * không còn ở x = ±0.29 mà ở:
 *
 *   chú rể : bone `mixamorig:Head` world X = -0.224
 *   cô dâu : bone `mixamorig:Head` world X = +0.190
 *
 * Nếu giữ X = ±0.34 thì mỗi nhẫn lệch 0.12-0.15 khỏi đầu người →
 * nhìn như nhẫn bay lơ lửng lệch bên, không "trên đầu".
 *
 * → Chọn **±0.21** = trung bình 2 vị trí đầu (-0.224, +0.190):
 *   mỗi nhẫn nằm ngay trên đầu đúng người, lệch tối đa 0.014.
 *
 * Z = 0.10: cùng mặt phẳng với nhân vật → nhìn như đang lơ lửng
 * ngay trên đầu, không bị "chìm" vào vòm phía sau.
 */
/**
 * X của mỗi nhẫn khi lơ lửng — 2 nhẫn CHẠM VÀO NHAU ở giữa.
 *
 * 2 nhân vật đứng ở x = ±0.20 (COUPLE_GAP = 0.40). Nhẫn bay lên
 * trên đầu mỗi người, rồi KHÉP LẠI về giữa để chạm vào nhau.
 *
 * ⚠ Khoảng cách giữa 2 nhẫn = 2 × RING_HOVER_X. Với nhẫn có
 *   bán kính ngoài r = 0.945 × RING_HOVER_SCALE, 2 nhẫn chạm nhau
 *   khi 2 × RING_HOVER_X ≈ 2r → RING_HOVER_X ≈ r.
 *
 * Với RING_HOVER_SCALE = 0.135 → r = 0.1276 → RING_HOVER_X ≈ 0.128
 * (chọn 0.122 để 2 vành ngoài CHẠM NHẸ, chưa chồng lấn).
 */
export const RING_HOVER_X = 0.122;
export const RING_HOVER_Y = 0.86;
export const RING_HOVER_Z = 0.1;

/**
 * Bán kính NGOÀI của nhẫn ở scale hover (đơn vị world).
 *
 * Đo được từ mesh: nhẫn có bounds ~1.89 (đường kính) → bán kính
 * ngoài = 1.89/2 = 0.945 ở scale gốc.
 *
 * Ở scale hover (RING_HOVER_SCALE) → bán kính ngoài thực tế:
 *   r = 0.945 × RING_HOVER_SCALE
 *
 * 2 nhẫn CHẠM NHAU khi khoảng cách tâm ≤ 2r. Để chạm "nhẹ"
 * (không chồng lấn sâu), dùng gap = 1.92r ≈ 2r (nhẫn áp sát,
 * vành ngoài chạm nhau, phần trong còn lồng vào nhau một chút).
 */
export const RING_OUTER_RADIUS = 0.945;

/**
 * Khoảng cách tâm 2 nhẫn khi lơ lửng — để 2 nhẫn CHẠM VÀO NHAU.
 *
 * ⚠ Nhẫn có bounds 1.89 nhưng hình dạng là VÀNH MỎNG: phần "thân"
 * nằm ở bán kính ~0.8-0.95, phần giữa trống. 2 nhẫn nếu tâm cách
 * quá xa sẽ không bao giờ chạm, quá gần sẽ chồng lấn.
 *
 * Chọn gap = 1.86 × r_hover (r_hover = RING_OUTER_RADIUS × RING_HOVER_SCALE):
 * → 2 vành ngoài của 2 nhẫn gần như chạm nhau, phần trong lồng
 *   vào nhau — trông như "móc vào nhau" chứ không phải chồng lấn.
 */
export const RING_TOUCH_GAP = RING_HOVER_X * 2;

/**
 * Scale của nhẫn khi lơ lửng.
 *
 * Nhẫn to (RING_SCALE = 0.55 → đường kính 1.04) để RÕ RÕ lúc bay
 * vào, nhưng khi trôi lên trên đầu thì phải nhỏ lại — nếu giữ nguyên
 * thì nhẫn rộng hơn cả người (1.04 vs cao 0.78) và che mất vòm.
 *
 * 0.30 → đường kính 0.567 ≈ 18% chiều cao màn hình: vẫn thấy rõ
 * vành/đá, 2 nhẫn cách nhau 0.11 (không chồng lấn).
 */
export const RING_HOVER_SCALE = 0.135;

/**
 * Khoảng cách từ camera tới tâm cảnh.
 *
 * fov 42° (chiều cao) × khung 16:9. Đo bằng phép chiếu:
 *
 *   z = 2.3 → backdrop rộng 60% · cao 66%   ← sân khấu chiếm gần hết
 *   z = 3.0 → backdrop rộng 46% · cao 50%
 *   z = 3.3 → backdrop rộng 42% · cao 46%
 *   z = 3.6 → backdrop rộng 38% · cao 42%   ← ✅ chọn: thoáng, có "không khí"
 *   z = 4.2 → backdrop rộng 33% · cao 36%   ← quá xa, sân khấu nhỏ
 *
 * Chọn z = 3.6: sân khấu + nhân vật nằm gọn giữa khung hình, xung quanh
 * còn nền tối → cảm giác "nhìn từ xa" thay vì dán sát màn hình.
 *
 * Nhẫn ở z = -0.6 → khoảng cách 4.2 → chiếm 32% chiều cao: đủ lớn
 * để thấy rõ vành/đá nhưng không chiếm sân khấu.
 */
export const CAMERA_Z = 3.6;

/**
 * Camera Z khi ZOOM VÀO lúc nhân vật cúi chào.
 *
 * ── VÌ SAO ZOOM? ──
 * Yêu cầu: "lúc cô dâu chú rể cúi chào là màn hình zoom ra và vào
 * màn hình nhấn nút". Zoom vào giữa đoạn cúi tạo cảm giác được
 * kéo vào không gian của nhân vật — cảnh quan trọng nhất được nhấn
 * mạnh, thay vì nhìn 1 sân khấu nhỏ giữa màn hình suốt 15s.
 *
 * ── TÍNH TOÁN ──
 * fov 42° (chiều cao) × 16:9 → chiều cao khung hình tại z:
 *   h(z) = 2·tan(21°)·z = 0.7673·z
 *
 *   z = 3.6 → h = 2.76  (nhân vật cao 0.79 → chiếm 29% chiều cao)
 *   z = 2.6 → h = 2.00  (nhân vật chiếm 40%)
 *   z = 2.2 → h = 1.69  (nhân vật chiếm 47%)  ← ✅ chọn
 *
 * z = 2.2 → 2 nhân vật (rộng ~0.60 + bó váy) chiếm ~40% chiều ngang,
 * vẫn thấy trọn cả vòm backdrop phía sau → vừa zoom vừa không mất
 * bối cảnh sân khấu.
 */
export const CAMERA_Z_BOW = 2.2;

/**
 * Camera Y khi zoom vào lúc cúi.
 *
 * Nhân vật đứng chân tại y = -0.40, đầu ở y ≈ 0.37. Khi cúi, mặt
 * chúc xuống còn y ≈ 0.10-0.15.
 *
 * Chọn y = 0.05 → camera ngang tầm ngực, nhìn thấy rõ cúi chào mà
 * vẫn giữ được vòm backdrop ở phía trên khung hình.
 */
export const CAMERA_Y_BOW = 0.05;

/** Z cuối cùng khi camera lùi ra (mở rộng khung hình thêm một chút) */
export const CAMERA_Z_OUT = 4.3;

/**
 * Nội suy tuyến tính — dùng cho scale/position.
 * @param t thời gian hiện tại (giây)
 * @param t0 thời điểm bắt đầu
 * @param t1 thời điểm kết thúc
 */
export function lerpProgress(t: number, t0: number, t1: number): number {
  if (t1 <= t0) return t >= t1 ? 1 : 0;
  const p = (t - t0) / (t1 - t0);
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

/** Nội suy giá trị từ a → b theo tiến độ 0..1 */
export function mix(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

/** Hàm easing: chậm dần (ease-out cubic) */
export function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

/** Hàm easing: vào nhanh → ra chậm (ease-in-out sine) */
export function easeInOutSine(p: number): number {
  return -(Math.cos(Math.PI * p) - 1) / 2;
}

/**
 * Tính trạng thái của 2 chiếc nhẫn tại thời điểm `t`.
 *
 * Trả về cho mỗi nhẫn: vị trí, rotation, scale, độ mờ.
 * Cả 2 nhẫn dùng chung 1 hàm nhưng lệch phase → nhìn như quấn quít.
 *
 * ── 4 GIAI ĐOẠN ──
 *   1. ENTER  (0.8 → 4.2s)  bay vào từ 2 phía, chậm & nhẹ nhàng
 *   2. ORBIT  (4.2 → 6.2s)  quấn quít quanh nhau
 *   3. RISE   (6.2 → 8.6s)  bay lên, tách ra, tới trên đầu 2 nhân vật
 *   4. FLOAT  (8.6 → hết)  lơ lửng nhẹ trên đầu, KHÔNG biến mất
 */
export interface RingState {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  opacity: number;
}

export function ringStateAt(t: number, side: 1 | -1): RingState {
  // ── Giai đoạn 1: bay vào từ 2 phía (CHẬM, nhẹ nhàng) ──
  // easeInOutSine thay cho easeOutCubic: nhẫn không "bắn" vào khung
  // mà trôi vào, tăng tốc giữa đường rồi dừng mềm.
  const enterP = easeInOutSine(lerpProgress(t, T.ringEnter, T.ringLock));

  // ── Giai đoạn 2: quấn quít (quay vòng quanh nhau) ──
  const orbitP = lerpProgress(t, T.ringLock, T.ringOrbitEnd);
  // 2 nhẫn quay CÙNG CHIỀU, lệch phase π → luôn ở 2 đầu đối diện.
  // Khác biệt bán kính + biên độ Z giữ chúng không chồng lấn.
  const orbitAngle = orbitP * Math.PI * 2 * RING_ORBIT_TURNS;
  // 2 nhẫn ở 2 đầu đối diện của quỹ đạo
  const orbitPhase = side > 0 ? 0 : Math.PI;

  const myRadius =
    side > 0 ? RING_ORBIT_RADIUS : RING_ORBIT_RADIUS_OUTER;
  const myZAmp = side > 0 ? RING_ORBIT_Z_AMP : RING_ORBIT_Z_AMP_OUTER;

  // Vị trí quỹ đạo: 2 nhẫn đối diện nhau, xoay quanh trục Y
  const orbitX = Math.cos(orbitAngle + orbitPhase) * myRadius;
  const orbitY = Math.sin(orbitAngle + orbitPhase) * myRadius * RING_ORBIT_Y_AMP;
  const orbitZ = Math.sin(orbitAngle + orbitPhase) * myRadius * myZAmp;

  // ── Giai đoạn 3: bay lên trên đầu 2 nhân vật ──
  const riseP = easeInOutSine(lerpProgress(t, T.ringOrbitEnd, T.ringFloat));
  // Mỗi nhẫn lên thẳng trên đầu 1 người
  const hoverX = side * RING_HOVER_X;

  // ── Giai đoạn 4: lơ lửng nhẹ nhàng (KHÔNG biến mất) ──
  // Trôi chậm + lên xuống nhẹ (sine) + xoay chậm. Biên độ rất nhỏ
  // để trông như "lơ lửng" chứ không phải "bay lượn".
  //
  // ⚠ Dao động X phải CÙNG CHIỀU cho 2 nhẫn (dùng `side` trong
  //   pha nhưng biên độ rất nhỏ) → chúng giữ nguyên khoảng cách
  //   chạm nhau, không tách ra rồi va vào nhau lung tung.
  const floatP = lerpProgress(t, T.ringFloat, T.done);
  const floatX = hoverX + Math.sin(floatP * Math.PI * 1.6) * 0.018;
  const floatY =
    RING_HOVER_Y + Math.sin(floatP * Math.PI * 2.2 + side * 1.3) * 0.018;
  const floatZ = RING_HOVER_Z + Math.cos(floatP * Math.PI * 1.1) * 0.02;

  // ── Gộp vị trí ──
  // 1. BAY VÀO — dùng CÔNG THỨC TỈ LỆ MÀN HÌNH thay vì nội suy world X:
  //
  //    Ý tưởng: giữ nhẫn ở mép khung hình (102% chiều ngang) rồi
  //    trượt vào. Vì công thức dùng camera + z của nhẫn ở THỜI ĐIỂM
  //    HIỆN TẠI, nhẫn luôn bám mép khung dù camera đang tiến vào.
  //
  //    Vì sao cần: nội suy world X cố định bị camera đẩy ra ngoài
  //    (đo được: x = 110% ở t = 1.8s).
  //
  //    edgeX = mép khung tính theo camera hiện tại
  //    innerX = quỹ đạo (đích)
  //    Nhẫn đi từ edgeX → innerX theo enterP.
  const camZ = cameraZAt(t);
  // Z của nhẫn ở thời điểm hiện tại (dùng để tính mép khung)
  const enterZ = mix(RING_START_Z, orbitZ + RING_Z, enterP);
  const edgeX = ringStartX(camZ, enterZ, side);

  const enterX = mix(edgeX, orbitX, enterP);
  const enterY = mix(0.28, orbitY, enterP);

  // 2. Bay lên: từ quỹ đạo (giữa khung) → trên đầu 2 nhân vật
  //    Dùng easeInOutSine để vừa rời quỹ đạo vừa dừng nhẹ trên đầu.
  const riseX = mix(enterX, hoverX, riseP);
  const riseY = mix(enterY, RING_HOVER_Y, riseP);
  const riseZ = mix(enterZ, RING_HOVER_Z, riseP);

  // 3. Lơ lửng: từ vị trí vừa dừng → dao động nhẹ
  const x = mix(riseX, floatX, easeInOutSine(floatP));
  const y = mix(riseY, floatY, easeInOutSine(floatP));
  const z = mix(riseZ, floatZ, easeInOutSine(floatP));

  // ── Scale ──
  // Giữ nguyên khi bay vào + quấn (rõ nét), nhỏ dần khi bay lên
  // để vừa vặn trên đầu nhân vật.
  const scale = mix(1, RING_HOVER_SCALE / RING_SCALE, riseP);

  // ── Opacity ──
  // Fade-in ngắn lúc xuất hiện (0.3s), sau đó giữ nguyên 100%
  // tới hết cảnh — nhẫn KHÔNG BAO GIỜ tan/biến mất.
  const appearP = lerpProgress(t, T.ringEnter, T.ringEnter + 0.3);
  const fadeIn = easeOutCubic(appearP);
  const opacity = fadeIn;

  // ── Rotation ──
  // Xoay suốt cảnh + thêm góc khi quấn + khi lơ lửng.
  //
  // ⚠ TỐC ĐỘ QUAY khi lơ lửng phải CHẬM: nhẫn đã thu nhỏ nên quay
  //   nhanh sẽ thấy "rung" rất khó chịu (đặc biệt trên Retina).
  //   Dùng hệ số nhân theo giai đoạn: bay vào + quấn quay nhanh
  //   (tạo cảm giác năng lượng), lơ lửng quay RẤT CHẬM (0.28 rad/s
  //   ≈ 1 vòng / 22s → trông như đang thở).
  const spinFast = t * 1.6 * side;
  const spinSlow = t * 0.28 * side;
  // Trộn 2 tốc độ theo riseP: bay lên xong → chuyển sang chậm dần
  const spin = mix(spinFast, spinSlow, riseP);
  const rotX = orbitP * Math.PI * 1.4 + riseP * 0.5;
  const rotY = spin + orbitP * Math.PI * 2.0;
  const rotZ = orbitP * Math.PI * 0.9 * side + floatP * 0.18 * side;

  return {
    x,
    y,
    z,
    rotX,
    rotY,
    rotZ,
    scale,
    opacity,
  };
}
