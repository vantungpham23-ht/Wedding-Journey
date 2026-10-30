/**
 * Ngày cưới — dùng chung cho toàn bộ site.
 *
 * ── VÌ SAO CÓ FILE NÀY ──
 * Ngày cưới xuất hiện ở rất nhiều nơi (intro, reveal, thiệp mời,
 * admin, metadata, link share...). Nếu mỗi nơi tự viết ngày thì dễ
 * lệch nhau — và cũng dễ quên mất thông tin ngày âm lịch.
 *
 * Vì vậy: MỌI nơi đều import từ đây. Sửa 1 chỗ là cả site đổi.
 */

/** Ngày cưới theo lịch dương (dd/mm/yyyy) */
export const WEDDING_DATE_SOLAR = "27.12.2026";

/** Ngày cưới theo lịch âm (dd/mm/yyyy âm lịch) */
export const WEDDING_DATE_LUNAR = "19.11.2026";

/**
 * Cụm từ "tức" — dùng trước ngày âm lịch.
 *
 * Về mặt ngữ nghĩa: "tức" ở đây mang nghĩa là "vào ngày ấy" /
 * "tức là" (ví dụ "tức ngày 27 thì có đám hỏi"). Đặt trước ngày âm
 * lịch, câu đọc thành: "tức 19.11.2026 âm lịch" — nghĩa là "vào
 * ngày 19.11.2026 âm lịch".
 *
 * Tách riêng thành hằng số để sau này muốn bỏ/thêm tiếp cũng chỉ
 * sửa 1 chỗ, không phải rà lại cả site.
 */
export const LUNAR_PREFIX = "tức";

/** Ngày cưới dạng "27 · 12 · 2026" — dùng cho tiêu đề lớn */
export const WEDDING_DATE_DISPLAY = "27 · 12 · 2026";

/** Ngày cưới dạng "27.12.2026" — dùng cho dòng phụ, metadata */
export const WEDDING_DATE_SHORT = "27.12.2026";

/** Ngày cưới đầy đủ: "Chủ Nhật · 27 Tháng 12 · 2026" */
export const WEDDING_DATE_FULL = "Chủ Nhật · 27 Tháng 12 · 2026";

/**
 * Ngày âm lịch kèm tiền tố "tức".
 * Ví dụ: "tức 19.11.2026 âm lịch"
 *
 * Dùng cho mọi chỗ hiển thị ngày âm lịch ra ngoài.
 */
export const WEDDING_DATE_LUNAR_TEXT = `${LUNAR_PREFIX} ${WEDDING_DATE_LUNAR} âm lịch`;

/**
 * Ngày cưới kèm ngày âm lịch trong ngoặc.
 * Dùng cho mọi chỗ hiển thị ngày cưới ra ngoài (thiệp, share, admin).
 *
 * Ví dụ: "27.12.2026 (tức 19.11.2026 âm lịch)"
 */
export const WEDDING_DATE_WITH_LUNAR = `${WEDDING_DATE_SHORT} (${LUNAR_PREFIX} ${WEDDING_DATE_LUNAR} âm lịch)`;

/**
 * Ngày cưới dạng hiển thị lớn kèm âm lịch.
 * Ví dụ: "27 · 12 · 2026 (tức 19.11.2026 âm lịch)"
 */
export const WEDDING_DATE_DISPLAY_WITH_LUNAR = `${WEDDING_DATE_DISPLAY} (${LUNAR_PREFIX} ${WEDDING_DATE_LUNAR} âm lịch)`;
