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
 * Tagline tiếng Anh — dùng ở góc phải trên cùng (header cố định).
 *
 * ── VÌ SAO ĐỔI TỪ NGÀY SANG TAGLINE? ──
 * Trước đây góc phải trên hiện "27.12.2026 · tức 19.11.2026 âm lịch".
 * Vấn đề:
 *   1. Dài, chiếm nhiều chỗ trên màn hình hẹp (đặc biệt mobile).
 *   2. Lặp lại ngày ở mọi section → thông tin lặp, không có giá trị gì.
 *   3. "tức 19.11.2026 âm lịch" đọc hơi rối khi nằm cạnh ngày dương.
 *
 * → Thay bằng 1 câu ngắn về tình yêu/hạnh phúc → header có chất
 *   "lời chúc" thay vì là 1 dòng metadata thừa.
 *   Ngày vẫn hiện đầy đủ ở màn hình reveal + các section chi tiết.
 */
export const WEDDING_TAGLINE_EN = "Two Hearts, One Forever";
