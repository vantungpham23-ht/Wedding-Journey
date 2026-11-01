/**
 * Tên cặp đôi — dùng chung cho toàn bộ site.
 *
 * ── VÌ SAO CÓ FILE NÀY ──
 * Tên cặp đôi xuất hiện ở nhiều nơi (thiệp mời, admin, metadata,
 * tin nhắn gửi khách...). Nếu mỗi nơi tự viết thì dễ lệch — và cũng
 * khó đổi nếu cần.
 *
 * Vì vậy: MỌI nơi đều import từ đây. Sửa 1 chỗ là cả site đổi.
 */

/** Tên chú rể */
export const GROOM_NAME = "Tùng Phạm";

/** Tên cô dâu */
export const BRIDE_NAME = "Thuý Hằng";

/** Tên cặp đôi — dùng làm chủ ngữ trong lời mời */
export const COUPLE_NAME = `${GROOM_NAME} & ${BRIDE_NAME}`;
