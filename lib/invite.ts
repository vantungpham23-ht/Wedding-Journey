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
  /** Tên người thứ hai — chỉ dùng khi mời cặp anh chị */
  name2?: string;
  note?: string;
  /** Cách xưng với khách: anh/chị/anh chị/cô/chú/bác/em/bạn */
  rel?: string;
  /** Cách hai vợ chồng tự xưng: chúng mình/chúng em/chúng cháu/... */
  we?: string;
}

// =====================================================================
// CÁCH XƯNG
// =====================================================================

/**
 * Cặp khách mời — mời 2 người: một anh, một chị.
 * Người thứ nhất xưng "Anh", người thứ hai xưng "Chị".
 */
export const COUPLE_REL = "anh chị";

export const RELATIONS = [
  { id: "", label: "— Không xưng —" },
  { id: "anh", label: "Anh" },
  { id: "chị", label: "Chị" },
  { id: COUPLE_REL, label: "Anh chị (cặp)" },
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
  [COUPLE_REL]: "chúng em",
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
  if (!rel || rel === COUPLE_REL) return "";
  const found = RELATIONS.find((r) => r.id === rel);
  return found && found.id ? `${found.label} ` : "";
}

/**
 * Đại từ tự xưng — dùng GIỮA câu (viết thường, không có dấu cách).
 *
 *   "anh"     → "anh"
 *   "anh chị" → "anh chị"
 *   không chọn → "bạn"
 *
 * Khác `honorificPrefix` ở chỗ: viết HOA + kèm dấu cách, dùng đầu câu.
 */
export function subjectWord(rel?: string): string {
  if (!rel) return "bạn";
  if (rel === COUPLE_REL) return "anh chị";
  const found = RELATIONS.find((r) => r.id === rel);
  return found && found.id ? found.label.toLowerCase() : "bạn";
}

/**
 * Tên hiển thị đầy đủ — hỗ trợ mời cặp anh chị.
 *
 *   ("Phú", undefined, "anh")      → "Phú"
 *   ("Phú", "Hân", "anh chị")      → "Anh Phú & Chị Hân"
 *   ("Phú", "Hân", undefined)       → "Phú & Hân"
 */
export function displayName(
  name: string,
  name2?: string,
  rel?: string
): string {
  const a = name.trim();
  const b = (name2 ?? "").trim();
  if (!b) {
    // Cặp nhưng thiếu tên người thứ hai → vẫn giữ chức danh "Anh"
    if (rel === COUPLE_REL && a) return `Anh ${a}`;
    return a;
  }
  if (rel === COUPLE_REL) return `Anh ${a} & Chị ${b}`;
  return `${a} & ${b}`;
}

/** Một đoạn text trong tên hiển thị — để styling từng phần */
export interface NameSegment {
  text: string;
  /** honorific = chức danh, name = tên riêng, plain = ký tự nối */
  kind: "honorific" | "name" | "plain";
}

/**
 * Tách tên khách (hoặc cặp) thành từng đoạn để styling linh hoạt:
 *   ("Phú", "Hân", "anh chị") →
 *     [{ "Anh ", honorific }, { "Phú", name }, { " & Chị ", honorific }, { "Hân", name }]
 */
export function nameSegments(
  name: string,
  name2?: string,
  rel?: string
): NameSegment[] {
  const a = name.trim();
  const b = (name2 ?? "").trim();
  const seg: NameSegment[] = [];

  if (rel === COUPLE_REL) {
    if (a) seg.push({ text: "Anh ", kind: "honorific" }, { text: a, kind: "name" });
    if (b) {
      if (!a) seg.push({ text: "Chị ", kind: "honorific" });
      else seg.push({ text: " & Chị ", kind: "honorific" });
      seg.push({ text: b, kind: "name" });
    }
    return seg;
  }

  const h = honorificPrefix(rel);
  if (h) seg.push({ text: h, kind: "honorific" });
  if (a) seg.push({ text: a, kind: "name" });
  if (b) seg.push({ text: " & ", kind: "plain" }, { text: b, kind: "name" });
  return seg;
}

/**
 * Câu mời hoàn chỉnh:
 *   "Kính mời Anh Châu Pew tới dự hôn lễ của chúng em"
 */
export function buildInviteSentence(
  name: string,
  rel?: string,
  we?: string,
  name2?: string
): string {
  const weWord = (we?.trim() || deriveWeWord(rel)).toLowerCase();
  const who = displayName(name, name2, rel);
  if (!who) return `Kính mời tới dự hôn lễ của ${weWord}`;
  // Cặp anh chị: displayName đã gắn sẵn "Anh "/"Chị " rồi.
  const prefix = rel === COUPLE_REL ? "" : honorificPrefix(rel);
  return `Kính mời ${prefix}${who} tới dự hôn lễ của ${weWord}`;
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
  const name2 = target.name2?.trim();
  if (name2) url.searchParams.set("to2", name2);
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
  const name2 = target.name2?.trim();
  const note = target.note?.trim();
  const link = buildInviteLink(target, origin);
  const weWord = (target.we?.trim() || deriveWeWord(target.rel)).toLowerCase();

  const lines: string[] = [];

  if (name) {
    const who = displayName(name, name2, target.rel);
    const prefix = target.rel === COUPLE_REL ? "" : honorificPrefix(target.rel);
    lines.push(
      `💍 ${prefix}${who}, chúng mình trân trọng mời bạn tới dự hôn lễ của ${weWord}.`
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
  to2: string;
  from: string;
  rel: string;
  we: string;
} {
  const params = new URLSearchParams(search);
  return {
    to: (params.get("to") ?? "").trim(),
    to2: (params.get("to2") ?? "").trim(),
    from: (params.get("from") ?? "").trim(),
    rel: (params.get("rel") ?? "").trim(),
    we: (params.get("we") ?? "").trim(),
  };
}
