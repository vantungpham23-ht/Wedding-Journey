/**
 * Helper tạo link thiệp mời cá nhân hóa.
 *
 * Dùng trong Zalo / Messenger / email để gửi từng khách một link riêng:
 *   https://<domain>/?to=Nguyễn Văn A&from=Gia đình Nguyễn&rel=anh&we=chúng em
 *
 * Link gốc (không có param) vẫn hoạt động bình thường.
 */

import { WEDDING_DATE_WITH_LUNAR } from "./weddingDate";

export interface InviteTarget {
  name: string;
  note?: string;
  /** Cách xưng với khách: anh/chị/cô/chú/bác/em/bạn */
  rel?: string;
  /** Cách hai vợ chồng tự xưng: chúng mình/chúng em/chúng cháu/... */
  we?: string;
}

// =====================================================================
// CÁCH XƯNG
// =====================================================================
export const RELATIONS = [
  { id: "", label: "— Không xưng —" },
  { id: "anh", label: "Anh" },
  { id: "chị", label: "Chị" },
  { id: "cô", label: "Cô" },
  { id: "chú", label: "Chú" },
  { id: "bác", label: "Bác" },
  { id: "em", label: "Em" },
  { id: "bạn", label: "Bạn" },
] as const;

/** Cách hai vợ chồng tự xưng với nhau */
export const WE_WORDS = [
  { id: "chúng mình", label: "chúng mình" },
  { id: "chúng em", label: "chúng em" },
  { id: "chúng cháu", label: "chúng cháu" },
  { id: "chúng con", label: "chúng con" },
  { id: "chúng tôi", label: "chúng tôi" },
] as const;

/** Mặc định "chúng X" theo cách xưng với khách */
const DEFAULT_WE: Record<string, string> = {
  anh: "chúng em",
  chị: "chúng em",
  cô: "chúng cháu",
  chú: "chúng cháu",
  bác: "chúng cháu",
  em: "chúng tôi",
  bạn: "chúng mình",
  "": "chúng mình",
};

/** Tự suy ra cách xưng "chúng X" từ danh xưng với khách */
export function deriveWeWord(rel?: string): string {
  return DEFAULT_WE[rel ?? ""] ?? "chúng mình";
}

/** Danh xưng viết hoa cho câu mời: "anh" → "Anh " */
export function honorificPrefix(rel?: string): string {
  if (!rel) return "";
  const found = RELATIONS.find((r) => r.id === rel);
  return found && found.id ? `${found.label} ` : "";
}

/**
 * Câu mời hoàn chỉnh:
 *   "Kính mời Anh Châu Pew tới dự hôn lễ của chúng em"
 */
export function buildInviteSentence(
  name: string,
  rel?: string,
  we?: string
): string {
  const who = name.trim();
  const weWord = (we?.trim() || deriveWeWord(rel)).toLowerCase();
  if (!who) return `Kính mời tới dự hôn lễ của ${weWord}`;
  return `Kính mời ${honorificPrefix(rel)}${who} tới dự hôn lễ của ${weWord}`;
}

// =====================================================================
// LINK
// =====================================================================
/** Tạo link mời cho một khách, dựa trên origin hiện tại. */
export function buildInviteLink(target: InviteTarget, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    "https://tunghangwedding.life";
  const url = new URL(base);
  const name = target.name.trim();
  if (name) url.searchParams.set("to", name);
  const note = target.note?.trim();
  if (note) url.searchParams.set("from", note);
  const rel = target.rel?.trim();
  if (rel) url.searchParams.set("rel", rel);
  // Chỉ ghi "we" khi khác mặc định → URL gọn hơn
  const we = target.we?.trim();
  if (we && we !== deriveWeWord(rel)) url.searchParams.set("we", we);
  return url.toString();
}

/** Nội dung tin nhắn sẵn để paste vào Zalo / Messenger. */
export function buildInviteText(target: InviteTarget, origin?: string): string {
  const name = target.name.trim();
  const note = target.note?.trim();
  const link = buildInviteLink(target, origin);
  const weWord = (target.we?.trim() || deriveWeWord(target.rel)).toLowerCase();

  const lines: string[] = [];

  if (name) {
    lines.push(
      `💍 ${honorificPrefix(target.rel)}${name}, chúng mình trân trọng mời bạn tới dự hôn lễ của ${weWord}.`
    );
  } else {
    lines.push(`💍 Trân trọng mời bạn tới dự hôn lễ của ${weWord}.`);
  }

  if (note) {
    lines.push("", note);
  }

  lines.push(
    "",
    `Tùng Phạm & Thuý Hằng — ${WEDDING_DATE_WITH_LUNAR}`,
    "Kênh · Cẩm Bình · Hà Tĩnh",
    link
  );

  return lines.join("\n");
}

/** Parse thông tin từ query string. */
export function parseInviteParams(search: string): {
  to: string;
  from: string;
  rel: string;
  we: string;
} {
  const params = new URLSearchParams(search);
  return {
    to: (params.get("to") ?? "").trim(),
    from: (params.get("from") ?? "").trim(),
    rel: (params.get("rel") ?? "").trim(),
    we: (params.get("we") ?? "").trim(),
  };
}
