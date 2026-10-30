"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ease } from "@/components/animation";
import { buildInviteLink, buildInviteText, buildInviteSentence, deriveWeWord, honorificPrefix, RELATIONS, WE_WORDS } from "@/lib/invite";

/**
 * ADMIN — Quản lý danh sách khách mời
 *
 * Vì site deploy dạng static export (không có backend), dữ liệu lưu
 * trong localStorage của trình duyệt này. Có thể:
 *   - Thêm / sửa / xoá khách
 *   - Copy link thiệp cá nhân hóa (1 click)
 *   - Copy tin nhắn sẵn để gửi Zalo/Messenger
 *   - Xuất / nhập danh sách JSON
 *   - Tải danh sách CSV (để import vào Google Sheets / Zalo)
 */

interface Guest {
  id: string;
  name: string;
  note: string;
  table?: string;
  /** Cách xưng với khách: anh/chị/cô/chú/bác/em/bạn */
  rel?: string;
  /** Cách hai vợ chồng tự xưng: chúng mình/chúng em/... */
  we?: string;
  createdAt: number;
}

const STORAGE_KEY = "wedding.guests.v1";

const SAMPLE: Guest[] = [
  { id: "s1", name: "Nguyễn Văn Minh", note: "Gia đình Nguyễn", table: "Bàn 1", rel: "anh", we: "", createdAt: Date.now() },
  { id: "s2", name: "Trần Thị Mai", note: "Bạn thân từ Hà Nội", table: "Bàn 2", rel: "chị", we: "", createdAt: Date.now() },
  { id: "s3", name: "Lê Hoàng Nam", note: "Đồng nghiệp", table: "", rel: "bạn", we: "", createdAt: Date.now() },
];

export default function AdminPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [table, setTable] = useState("");
  const [rel, setRel] = useState("");
  const [we, setWe] = useState("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [site, setSite] = useState("");

  // ---- Load dữ liệu ----
  useEffect(() => {
    setSite(window.location.origin);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Guest[];
        setGuests(Array.isArray(parsed) ? parsed : []);
      } else {
        setGuests(SAMPLE);
      }
    } catch {
      setGuests(SAMPLE);
    }
    setLoaded(true);
  }, []);

  // ---- Persist ----
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
    } catch {
      /* storage full / private mode */
    }
  }, [guests, loaded]);

  const linkFor = useCallback(
    (g: Guest) =>
      buildInviteLink(
        { name: g.name, note: g.note, rel: g.rel, we: g.we },
        site
      ),
    [site]
  );

  const messageFor = useCallback(
    (g: Guest) =>
      buildInviteText(
        { name: g.name, note: g.note, rel: g.rel, we: g.we },
        site
      ),
    [site]
  );

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback cho http / browser cũ
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }, []);

  const addGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setGuests((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: n,
        note: note.trim(),
        table: table.trim(),
        rel,
        we: we.trim(),
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setName("");
    setNote("");
    setTable("");
    setRel("");
    setWe("");
  };

  const updateGuest = (id: string, patch: Partial<Guest>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const removeGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.note.toLowerCase().includes(q) ||
        (g.table ?? "").toLowerCase().includes(q)
    );
  }, [guests, query]);

  // ---- Xuất / Nhập ----
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(guests, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khach-moi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = [
      ["Tên", "Người gửi / Ghi chú", "Bàn", "Xưng", "Chúng tự xưng", "Lời mời", "Link thiệp"],
      ...guests.map((g) => [
        g.name,
        g.note,
        g.table ?? "",
        g.rel ?? "",
        g.we || deriveWeWord(g.rel),
        buildInviteSentence(g.name, g.rel, g.we),
        linkFor(g),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khach-moi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Guest[];
        if (Array.isArray(parsed)) {
          setGuests(
            parsed.map((g) => ({
              id: g.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: String(g.name ?? ""),
              note: String(g.note ?? ""),
              table: String(g.table ?? ""),
              rel: String(g.rel ?? ""),
              we: String(g.we ?? ""),
              createdAt: g.createdAt ?? Date.now(),
            }))
          );
        }
      } catch {
        alert("File JSON không hợp lệ");
      }
    };
    reader.readAsText(file);
  };

  const copyAllLinks = async () => {
    const text = guests.map((g) => `${g.name}\t${linkFor(g)}`).join("\n");
    await copy(text, "all");
  };

  return (
    <main className="min-h-screen w-full bg-[#2d1f15] px-4 py-10 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* ===== Header ===== */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484]">
              Wedding Admin
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">
              Quản lý khách mời
            </h1>
            <p className="mt-2 max-w-lg text-sm text-[#fdfbf7]/55">
              Mỗi khách nhận một link thiệp riêng có tên của họ. Dữ liệu lưu
              trong trình duyệt này — hãy xuất JSON để sao lưu.
            </p>
          </div>

          <a
            href="/"
            className="self-start rounded-full border border-[#c4a484]/30 px-5 py-2.5 font-sans text-[10px] uppercase tracking-[0.3em] text-[#c4a484] transition-colors hover:border-[#c4a484]/60 hover:bg-[#c4a484]/10 sm:self-auto"
          >
            ← Về trang thiệp
          </a>
        </motion.header>

        {/* ===== Form thêm khách ===== */}
        <motion.form
          onSubmit={addGuest}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="mb-8 rounded-2xl border border-[#c4a484]/20 bg-[#fdfbf7]/[0.04] p-5 backdrop-blur-sm sm:p-7"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.4fr_0.8fr_auto]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên khách (vd: Nguyễn Văn Minh)"
              className="rounded-xl border border-[#c4a484]/25 bg-[#fdfbf7]/5 px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-[#c4a484]/60"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Người gửi / ghi chú (vd: Gia đình Nguyễn)"
              className="rounded-xl border border-[#c4a484]/25 bg-[#fdfbf7]/5 px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-[#c4a484]/60"
            />
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="Bàn (tuỳ chọn)"
              className="rounded-xl border border-[#c4a484]/25 bg-[#fdfbf7]/5 px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-[#c4a484]/60"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#c4a484] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#2d1f15] transition-transform hover:scale-[1.03] active:scale-95"
            >
              Thêm
            </button>
          </div>

          {/* ===== Chọn cách xưng ===== */}
          <div className="mt-4 flex flex-col gap-3 border-t border-[#c4a484]/15 pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.3em] text-[#c4a484]/60">
                Xưng với khách
              </label>
              <select
                value={rel}
                onChange={(e) => {
                  const v = e.target.value;
                  setRel(v);
                  // Đổi danh xưng → tự cập nhật "chúng X" theo mặc định
                  setWe(deriveWeWord(v));
                }}
                className="w-full rounded-xl border border-[#c4a484]/25 bg-[#2d1f15] px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors focus:border-[#c4a484]/60"
              >
                {RELATIONS.map((r) => (
                  <option key={r.id || "none"} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.3em] text-[#c4a484]/60">
                Chúng tự xưng
              </label>
              <select
                value={we}
                onChange={(e) => setWe(e.target.value)}
                className="w-full rounded-xl border border-[#c4a484]/25 bg-[#2d1f15] px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors focus:border-[#c4a484]/60"
              >
                <option value="">— Tự động theo danh xưng —</option>
                {WE_WORDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview câu mời */}
            <div className="flex-1">
              <label className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.3em] text-[#c4a484]/60">
                Xem trước
              </label>
              <p className="rounded-xl border border-[#c4a484]/15 bg-black/20 px-4 py-3 font-[family-name:var(--font-playfair)] text-sm italic leading-snug text-[#fdfbf7]/75">
                {buildInviteSentence(name || "[Tên khách]", rel, we)}
              </p>
            </div>
          </div>
        </motion.form>

        {/* ===== Toolbar ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên / ghi chú / bàn…"
            className="min-w-[200px] flex-1 rounded-xl border border-[#c4a484]/20 bg-[#fdfbf7]/5 px-4 py-2.5 font-sans text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-[#c4a484]/50"
          />
          <button
            onClick={copyAllLinks}
            disabled={!guests.length}
            className="rounded-xl border border-[#c4a484]/30 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#c4a484] transition-colors hover:bg-[#c4a484]/10 disabled:opacity-30"
          >
            {copied === "all" ? "✓ Đã copy" : "Copy tất cả"}
          </button>
          <button
            onClick={exportCsv}
            disabled={!guests.length}
            className="rounded-xl border border-[#c4a484]/30 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#c4a484] transition-colors hover:bg-[#c4a484]/10 disabled:opacity-30"
          >
            Xuất CSV
          </button>
          <button
            onClick={exportJson}
            disabled={!guests.length}
            className="rounded-xl border border-[#c4a484]/30 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#c4a484] transition-colors hover:bg-[#c4a484]/10 disabled:opacity-30"
          >
            Sao lưu JSON
          </button>
          <label className="cursor-pointer rounded-xl border border-[#c4a484]/30 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#c4a484] transition-colors hover:bg-[#c4a484]/10">
            Nhập JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = "";
              }}
            />
          </label>
          {guests.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Xoá toàn bộ danh sách?")) setGuests([]);
              }}
              className="rounded-xl border border-red-400/30 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.2em] text-red-300/70 transition-colors hover:bg-red-400/10"
            >
              Xoá tất cả
            </button>
          )}
        </motion.div>

        {/* ===== Danh sách ===== */}
        <div className="mb-3 flex items-center justify-between font-sans text-[10px] uppercase tracking-[0.3em] text-[#c4a484]/60">
          <span>
            {filtered.length} khách{filtered.length !== guests.length && ` / ${guests.length}`}
          </span>
          <span className="hidden sm:block">Tên · Ghi chú · Link</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {filtered.map((g, i) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.4, ease, delay: Math.min(i * 0.03, 0.3) }}
                className="group rounded-2xl border border-[#c4a484]/15 bg-[#fdfbf7]/[0.03] p-4 transition-colors hover:border-[#c4a484]/35 sm:p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
                  {/* Tên + ghi chú (editable) */}
                  <div className="min-w-0 flex-1">
                    <input
                      value={g.name}
                      onChange={(e) => updateGuest(g.id, { name: e.target.value })}
                      className="w-full bg-transparent font-[family-name:var(--font-playfair)] text-lg text-[#fdfbf7] outline-none sm:text-xl"
                    />
                    <input
                      value={g.note}
                      onChange={(e) => updateGuest(g.id, { note: e.target.value })}
                      placeholder="Thêm ghi chú / người gửi…"
                      className="mt-1 w-full bg-transparent font-sans text-xs text-[#c4a484]/80 outline-none placeholder:text-[#fdfbf7]/25"
                    />
                    {/* Preview câu mời */}
                    {g.name.trim() && (
                      <p className="mt-1.5 truncate font-[family-name:var(--font-playfair)] text-[11px] italic text-[#fdfbf7]/40">
                        {buildInviteSentence(g.name, g.rel, g.we)}
                      </p>
                    )}
                  </div>

                  {/* Bàn */}
                  <input
                    value={g.table ?? ""}
                    onChange={(e) => updateGuest(g.id, { table: e.target.value })}
                    placeholder="Bàn"
                    className="w-full rounded-lg border border-[#c4a484]/20 bg-[#fdfbf7]/5 px-3 py-2 font-sans text-xs text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/25 focus:border-[#c4a484]/50 lg:w-20"
                  />

                  {/* Danh xưng */}
                  <select
                    value={g.rel ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateGuest(g.id, { rel: v, we: deriveWeWord(v) });
                    }}
                    className="w-full rounded-lg border border-[#c4a484]/20 bg-[#2d1f15] px-2.5 py-2 font-sans text-xs text-[#fdfbf7] outline-none transition-colors focus:border-[#c4a484]/50 lg:w-24"
                    title="Xưng với khách"
                  >
                    {RELATIONS.map((r) => (
                      <option key={r.id || "none"} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  {/* Cách tự xưng */}
                  <select
                    value={g.we ?? ""}
                    onChange={(e) => updateGuest(g.id, { we: e.target.value })}
                    className="w-full rounded-lg border border-[#c4a484]/20 bg-[#2d1f15] px-2.5 py-2 font-sans text-xs text-[#fdfbf7] outline-none transition-colors focus:border-[#c4a484]/50 lg:w-28"
                    title="Chúng tự xưng"
                  >
                    <option value="">— Auto —</option>
                    {WE_WORDS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>

                  {/* Link */}
                  <div className="min-w-0 flex-1">
                    <a
                      href={linkFor(g)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Mở thiệp của khách này"
                      className="block truncate rounded-lg bg-black/25 px-3 py-2 font-mono text-[11px] text-[#c4a484]/85 transition-colors hover:bg-black/40 hover:text-[#c4a484]"
                    >
                      {linkFor(g)}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      onClick={() => copy(linkFor(g), `link-${g.id}`)}
                      className="rounded-lg border border-[#c4a484]/30 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.15em] text-[#c4a484] transition-colors hover:bg-[#c4a484]/15"
                    >
                      {copied === `link-${g.id}` ? "✓" : "Link"}
                    </button>
                    <button
                      onClick={() => copy(messageFor(g), `msg-${g.id}`)}
                      className="rounded-lg border border-[#c4a484]/30 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.15em] text-[#c4a484] transition-colors hover:bg-[#c4a484]/15"
                    >
                      {copied === `msg-${g.id}` ? "✓" : "Tin nhắn"}
                    </button>
                    <button
                      onClick={() => removeGuest(g.id)}
                      aria-label="Xoá khách"
                      className="rounded-lg border border-red-400/25 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.15em] text-red-300/60 transition-colors hover:bg-red-400/15"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!filtered.length && (
          <div className="mt-6 rounded-2xl border border-dashed border-[#c4a484]/25 py-16 text-center">
            <p className="font-[family-name:var(--font-playfair)] text-lg text-[#fdfbf7]/50">
              {guests.length ? "Không tìm thấy khách nào" : "Chưa có khách nào"}
            </p>
            <p className="mt-2 font-sans text-xs text-[#fdfbf7]/35">
              {guests.length
                ? "Thử từ khoá khác."
                : "Thêm khách ở ô bên trên, hoặc nhập từ file JSON đã sao lưu."}
            </p>
          </div>
        )}

        {/* ===== Hướng dẫn ===== */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 rounded-2xl border border-[#c4a484]/15 bg-[#fdfbf7]/[0.03] p-6 sm:p-8"
        >
          <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-lg text-[#fdfbf7]">
            Cách dùng
          </h2>
          <ol className="flex list-decimal flex-col gap-2.5 pl-5 font-sans text-sm leading-relaxed text-[#fdfbf7]/60">
            <li>
              Thêm khách: ghi <b className="text-[#c4a484]">Tên</b> và (tuỳ chọn){" "}
              <b className="text-[#c4a484]">Người gửi / ghi chú</b>.
            </li>
            <li>
              Chọn <b className="text-[#c4a484]">Xưng với khách</b> (anh/chị/cô/chú/bác/em/bạn)
              — câu mời tự đổi thành{" "}
              <i>&ldquo;Kính mời Anh Minh tới dự hôn lễ của chúng em&rdquo;</i>. Có thể đổi{" "}
              <b className="text-[#c4a484]">Chúng tự xưng</b> bằng tay.
            </li>
            <li>
              Bấm <b className="text-[#c4a484]">Tin nhắn</b> để copy sẵn nội dung rồi dán
              vào Zalo / Messenger.
            </li>
            <li>
              Bấm <b className="text-[#c4a484]">Link</b> để copy URL thiệp, hoặc bấm vào ô link
              để xem trước bản thiệp của riêng khách đó.
            </li>
            <li>
              <b className="text-[#c4a484]">Xuất CSV</b> để có danh sách bàn ghế gửi cho
              người phụ trách sắp xếp.
            </li>
            <li>
              <b className="text-[#c4a484]">Sao lưu JSON</b> định kỳ — dữ liệu nằm trong
              trình duyệt này nên xoá cache là mất.
            </li>
          </ol>

          <div className="mt-6 rounded-xl border border-[#c4a484]/20 bg-black/20 p-4">
            <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em] text-[#c4a484]/70">
              Mẫu link
            </p>
            <code className="block break-all font-mono text-xs text-[#fdfbf7]/70">
              {site || "https://..."}
              /?to=Nguyễn%20Văn%20Minh&amp;from=Gia%20đình%20Nguyễn&amp;rel=anh&amp;we=chúng%20em
            </code>
          </div>
        </motion.section>

        <p className="mt-10 text-center font-sans text-[10px] uppercase tracking-[0.3em] text-[#fdfbf7]/25">
          Tùng &amp; Hằng · 27 · 12 · 2026
        </p>
      </div>
    </main>
  );
}
