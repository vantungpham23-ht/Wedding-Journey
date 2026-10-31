"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ease } from "@/components/animation";
import { buildInviteLink, buildInviteText, buildInviteSentence, deriveWeWord, COUPLE_REL, RELATIONS, WE_WORDS } from "@/lib/invite";
import { WEDDING_DATE_DISPLAY, WEDDING_DATE_LUNAR_TEXT } from "@/lib/weddingDate";
import { newGuestId, normalizeGuest, normalizeGuestList, type Guest } from "@/lib/guests";
import { apiCall, hasSession } from "@/lib/guestsSupabase";
import { supabase } from "@/lib/supabase";

/**
 * ADMIN — Quản lý danh sách khách mời
 *
 * ── LƯU TRỮ DỮ LIỆU ──
 * Dữ liệu nằm trên Supabase (bảng `guests`, Row Level Security):
 *   - GET    /api/guests        → lấy danh sách
 *   - POST   /api/guests        → thêm khách
 *   - PUT    /api/guests?id=xx  → sửa khách
 *   - DELETE /api/guests?id=xx  → xoá khách
 *
 * Lớp `lib/guestsSupabase.ts` mô phỏng đúng hợp đồng trên, nên UI gọi
 * thống nhất qua `api()` — không còn Cloudflare Pages Functions.
 *
 * → Danh sách dùng được trên MỌI thiết bị, không mất khi xoá cache.
 *
 * ── ĐĂNG NHẬP ──
 * POST /api/auth với mật khẩu → Supabase xác thực, trả session token
 * lưu trong localStorage. Mỗi request sau tự đính kèm token, RLS kiểm tra.
 * Nếu session hết hạn → API trả 401 → hiện lại màn đăng nhập.
 */

/** Trạng thái đăng nhập */
type AuthState = "checking" | "unauthenticated" | "authenticated";

/** Trạng thái lưu dữ liệu */
type SaveState = "idle" | "saving" | "saved" | "error";

/** Key lưu danh sách khách trong localStorage (chế độ dự phòng) */
const LOCAL_KEY = "wedding:guests";

/** Đọc danh sách khách từ localStorage */
function readLocalGuests(): Guest[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return normalizeGuestList(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** Ghi danh sách khách vào localStorage */
function writeLocalGuests(guests: Guest[]): void {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(guests));
  } catch {
    /* hết quota hoặc bị chặn → bỏ qua */
  }
}

export default function AdminPage() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  /**
   * `true` = đang lưu trong localStorage (server chưa cấu hình KV).
   * `false` = đang lưu trên Cloudflare KV.
   */
  const [localMode, setLocalMode] = useState(false);

  /**
   * Bản nháp đang sửa của từng khách.
   *
   * Input dùng `controlled` để giữ đúng những gì người dùng vừa gõ,
   * nhưng KHÔNG gửi API mỗi ký tự. Chỉ khi blur (rời ô) mới commit
   * lên server → tránh spam request và tránh tranh chấp ghi KV.
   *
   * Khoá theo `guestId`, mỗi field chỉ lưu phần đang sửa.
   */
  const [drafts, setDrafts] = useState<Record<string, Partial<Guest>>>({});

  const [name, setName] = useState("");
  const [name2, setName2] = useState("");
  const [note, setNote] = useState("");
  const [table, setTable] = useState("");
  const [rel, setRel] = useState("");
  const [we, setWe] = useState("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [site, setSite] = useState("");

  /** Chặn request khi component unmount (tránh setState sau khi đã ẩn) */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // ------------------------------------------------------------------
  // Gọi API
  //
  // `apiCall` trong `lib/guestsSupabase.ts` mô phỏng đúng hợp đồng của
  // Cloudflare Pages Functions cũ (trả `{ ok, status, data }`) → toàn bộ
  // UI bên dưới không phải sửa dòng nào.
  // ------------------------------------------------------------------
  const api = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const res = await apiCall<T>(path, init);

      // 401 = phiên hết hạn → quay lại màn đăng nhập
      if (res.status === 401) {
        setAuth("unauthenticated");
      }

      return res;
    },
    []
  );

  // ------------------------------------------------------------------
  // Load danh sách
  //
  // Có 2 chế độ lưu trữ:
  //   • "server" — Supabase (nhiều thiết bị, không mất khi xoá cache)
  //   • "local"  — localStorage của trình duyệt (dự phòng khi mạng
  //                lỗi / Supabase project bị pause)
  //
  // Khi API trả lỗi cấu hình (500) hoặc không gọi được server (0),
  // tự động chuyển sang chế độ "local" để trang /admin vẫn dùng được.
  // ------------------------------------------------------------------
  const loadGuests = useCallback(async () => {
    // Chưa có session → không thử gọi API (tiết kiệm 1 request).
    if (!(await hasSession())) {
      if (!alive.current) return;
      setLocalMode(false);
      setAuth("unauthenticated");
      setLoaded(true);
      return;
    }

    const res = await api<{ ok: boolean; guests?: Guest[] }>("/api/guests");
    if (!alive.current) return;

    if (res.status === 401) {
      // Session hết hạn → hiện màn login.
      setLocalMode(false);
      setAuth("unauthenticated");
      setLoaded(true);
      return;
    }

    if (!res.ok) {
      // Server chưa sẵn sàng → chuyển sang lưu local.
      setLocalMode(true);
      setGuests(readLocalGuests());
      setAuth("authenticated");
      setLoaded(true);
      return;
    }

    setLocalMode(false);
    setGuests(Array.isArray(res.data.guests) ? res.data.guests : []);
    setAuth("authenticated");
    setLoaded(true);
  }, [api]);

  useEffect(() => {
    setSite(window.location.origin);
    loadGuests();
  }, [loadGuests]);

  // ------------------------------------------------------------------
  // Realtime — đồng bộ giữa nhiều thiết bị
  //
  // Khi 1 thiết bị thêm/sửa/xoá khách, Supabase đẩy thay đổi qua
  // websocket → các thiết bị khác tự load lại danh sách.
  //
  // Nhờ vậy không còn tình trạng "sửa trên điện thoại, PC vẫn hiện
  // dữ liệu cũ" như khi dùng Cloudflare KV (eventual consistency).
  // ------------------------------------------------------------------
  useEffect(() => {
    if (auth !== "authenticated" || localMode) return;

    const channel = supabase
      .channel("guests-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guests" },
        () => {
          // Có thay đổi ở thiết bị khác → load lại danh sách.
          loadGuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auth, localMode, loadGuests]);

  // ------------------------------------------------------------------
  // Đăng nhập
  // ------------------------------------------------------------------
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await api<{ ok: boolean; error?: string }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (!alive.current) return;

    if (res.ok) {
      setPassword("");
      setAuth("authenticated");
      await loadGuests();
    } else if (res.status >= 500 || res.status === 0) {
      // Không gọi được Supabase (mạng lỗi / project bị pause)
      // → chuyển sang chế độ lưu cục bộ thay vì chặn người dùng.
      setLocalMode(true);
      setGuests(readLocalGuests());
      setPassword("");
      setAuth("authenticated");
      setAuthError("");
    } else {
      setAuthError(
        res.data?.error ??
          (res.status === 429
            ? "Quá nhiều lần thử. Vui lòng thử lại sau."
            : "Đăng nhập không thành công")
      );
    }
  };

  const logout = async () => {
    // ── Chế độ local: không có phiên server, dữ liệu vẫn nằm trong
    //    localStorage của trình duyệt này → giữ nguyên.
    if (localMode) return;

    await api("/api/auth", { method: "DELETE" });
    setGuests([]);
    setAuth("unauthenticated");
    setSaveState("idle");
  };

  // ------------------------------------------------------------------
  // Hiện trạng thái "đã lưu" trong 1.6s rồi tự tắt
  // ------------------------------------------------------------------
  const flashSaved = useCallback(() => {
    setSaveState("saved");
    setTimeout(() => {
      if (alive.current) setSaveState("idle");
    }, 1600);
  }, []);

  // ------------------------------------------------------------------
  // Thêm / sửa / xoá
  // ------------------------------------------------------------------
  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;

    setSaveState("saving");

    // ── Chế độ local (server chưa cấu hình KV) ──
    if (localMode) {
      const guest: Guest = {
        id: newGuestId(),
        name: n,
        name2: name2.trim() || undefined,
        note: note.trim(),
        table: table.trim(),
        rel: rel.trim(),
        we: we.trim(),
        createdAt: Date.now(),
      };
      const next = [guest, ...guests];
      setGuests(next);
      writeLocalGuests(next);
      setName("");
      setName2("");
      setNote("");
      setTable("");
      setRel("");
      setWe("");
      flashSaved();
      return;
    }

    const res = await api<{ ok: boolean; guests?: Guest[] }>("/api/guests", {
      method: "POST",
      body: JSON.stringify({ name: n, name2, note, table, rel, we }),
    });
    if (!alive.current) return;

    if (res.ok && res.data.guests?.length) {
      setGuests((prev) => [...res.data.guests!, ...prev]);
      setName("");
      setName2("");
      setNote("");
      setTable("");
      setRel("");
      setWe("");
      flashSaved();
    } else {
      setSaveState("error");
    }
  };

  /** Sửa khách — ghi xong mới cập nhật UI (tránh ghi đè khi gõ nhanh) */
  const updateGuest = useCallback(
    async (id: string, patch: Partial<Guest>) => {
      // ── Chế độ local ──
      if (localMode) {
        setGuests((prev) => {
          const next = prev.map((g) => (g.id === id ? { ...g, ...patch } : g));
          writeLocalGuests(next);
          return next;
        });
        flashSaved();
        return;
      }

      setSaveState("saving");
      const res = await api<{ ok: boolean; guest?: Guest }>(
        `/api/guests?id=${encodeURIComponent(id)}`,
        { method: "PUT", body: JSON.stringify(patch) }
      );
      if (!alive.current) return;

      if (res.ok && res.data.guest) {
        const saved = res.data.guest;
        setGuests((prev) => prev.map((g) => (g.id === id ? saved : g)));
        flashSaved();
      } else {
        setSaveState("error");
      }
    },
    [api, flashSaved, localMode]
  );

  /**
   * Commit bản nháp của 1 khách lên server.
   *
   * Chỉ gửi những field thực sự khác so với dữ liệu hiện tại, nên
   * blur mà không sửa gì sẽ không tạo request nào.
   */
  const commitDraft = useCallback(
    async (id: string) => {
      const draft = drafts[id];
      if (!draft) return;

      const current = guests.find((g) => g.id === id);
      if (!current) return;

      const patch: Record<string, string> = {};
      let changed = false;
      for (const key of ["name", "name2", "note", "table", "rel", "we"] as const) {
        const next = draft[key];
        if (next === undefined) continue;
        if ((next ?? "") !== (current[key] ?? "")) {
          patch[key] = next ?? "";
          changed = true;
        }
      }

      // Không có gì thay đổi → bỏ bản nháp, không gọi API
      if (!changed) {
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        return;
      }

      await updateGuest(id, patch as Partial<Guest>);

      // Chỉ xoá bản nháp SAU khi server đã lưu xong → tránh giá trị
      // bị nháy về bản cũ trong lúc đang chờ mạng.
      if (alive.current) {
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [drafts, guests, updateGuest]
  );

  /** Ghi 1 field vào bản nháp */
  const setDraft = useCallback(
    (
      id: string,
      key: "name" | "name2" | "note" | "table" | "rel" | "we",
      value: string
    ) => {
      setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
    },
    []
  );

  const removeGuest = useCallback(
    async (id: string) => {
      const snapshot = guests;

      // ── Chế độ local ──
      if (localMode) {
        const next = guests.filter((g) => g.id !== id);
        setGuests(next);
        writeLocalGuests(next);
        flashSaved();
        return;
      }

      // Cập nhật UI ngay cho mượt (optimistic), rollback nếu API lỗi
      setGuests((prev) => prev.filter((g) => g.id !== id));

      const res = await api<{ ok: boolean; guests?: Guest[] }>(
        `/api/guests?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!alive.current) return;

      if (!res.ok) {
        setGuests(snapshot);
        setSaveState("error");
      } else {
        flashSaved();
      }
    },
    [api, flashSaved, guests, localMode]
  );

  const removeAll = async () => {
    if (!confirm("Xoá toàn bộ danh sách?")) return;

    // ── Chế độ local ──
    if (localMode) {
      setGuests([]);
      writeLocalGuests([]);
      flashSaved();
      return;
    }

    const snapshot = guests;
    setGuests([]);
    const res = await api<{ ok: boolean }>("/api/guests", { method: "DELETE" });
    if (!alive.current) return;
    if (!res.ok) {
      setGuests(snapshot);
      setSaveState("error");
    } else {
      flashSaved();
    }
  };

  // ------------------------------------------------------------------
  // Xuất / Nhập
  // ------------------------------------------------------------------
  const linkFor = useCallback(
    (g: Guest) =>
      buildInviteLink(
        { name: g.name, name2: g.name2, note: g.note, rel: g.rel, we: g.we },
        site
      ),
    [site]
  );

  const messageFor = useCallback(
    (g: Guest) =>
      buildInviteText(
        { name: g.name, name2: g.name2, note: g.note, rel: g.rel, we: g.we },
        site
      ),
    [site]
  );

  /**
   * Bản "đang hiển thị" của 1 khách = dữ liệu đã lưu + phần đang sửa.
   *
   * Dùng cho link / tin nhắn / preview → người dùng copy link sẽ nhận
   * được đúng nội dung đang hiện trên màn hình, kể cả khi chưa blur.
   */
  const viewOf = useCallback(
    (g: Guest): Guest => ({ ...g, ...drafts[g.id] }),
    [drafts]
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
      ["Tên", "Tên 2", "Người gửi / Ghi chú", "Bàn", "Xưng", "Chúng tự xưng", "Lời mời", "Link thiệp"],
      ...guests.map((g) => {
        const v = viewOf(g);
        return [
          v.name,
          v.name2 ?? "",
          v.note,
          v.table ?? "",
          v.rel ?? "",
          v.we || deriveWeWord(v.rel),
          buildInviteSentence(v.name, v.rel, v.we, v.name2),
          linkFor(v),
        ];
      }),
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

  /**
   * Nhập JSON — sau khi đọc file, đẩy TỪNG khách lên server qua POST.
   * Server tự sinh id mới nên không bị trùng với dữ liệu đang có.
   */
  const importJson = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        alert("File JSON không hợp lệ");
        return;
      }

      if (!Array.isArray(parsed)) {
        alert("File JSON không hợp lệ");
        return;
      }

      // Chuẩn hoá từng khách, bỏ mục hỏng
      const items = parsed
        .map((g) => normalizeGuest(g))
        .filter((g): g is Guest => g !== null);

      if (!items.length) {
        alert("Không tìm thấy khách hợp lệ trong file");
        return;
      }

      setSaveState("saving");

      // ── Chế độ local ──
      if (localMode) {
        const localItems = items.map((g) => ({ ...g, id: newGuestId() }));
        const next = [...localItems, ...guests];
        setGuests(next);
        writeLocalGuests(next);
        flashSaved();
        return;
      }

      const res = await api<{ ok: boolean; guests?: Guest[] }>("/api/guests", {
        method: "POST",
        body: JSON.stringify(items),
      });
      if (!alive.current) return;

      if (res.ok && res.data.guests?.length) {
        setGuests((prev) => [...res.data.guests!, ...prev]);
        flashSaved();
      } else {
        setSaveState("error");
        alert("Không thể nhập lên server. Kiểm tra kết nối và thử lại.");
      }
    };
    reader.readAsText(file);
  };

  const copyAllLinks = async () => {
    const text = guests.map((g) => `${viewOf(g).name}\t${linkFor(viewOf(g))}`).join("\n");
    await copy(text, "all");
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

  // ==================================================================
  // MÀN ĐĂNG NHẬP
  // ==================================================================
  if (auth === "checking") {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#2d1f15]">
        <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-[#c4a484]/50">
          Đang kiểm tra…
        </p>
      </main>
    );
  }

  if (auth === "unauthenticated") {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#2d1f15] px-4">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="w-full max-w-sm rounded-2xl border border-[#c4a484]/20 bg-[#fdfbf7]/[0.04] p-7 backdrop-blur-sm"
        >
          <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484]">
            Wedding Admin
          </p>
          <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl text-[#fdfbf7]">
            Đăng nhập
          </h1>

          <label className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.3em] text-[#c4a484]/60">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="Nhập mật khẩu quản trị"
            className="w-full rounded-xl border border-[#c4a484]/25 bg-[#fdfbf7]/5 px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-[#c4a484]/60"
          />

          {authError && (
            <p className="mt-3 font-sans text-xs text-red-300/80">{authError}</p>
          )}

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-[#c4a484] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#2d1f15] transition-transform hover:scale-[1.02] active:scale-95"
          >
            Vào
          </button>

          <a
            href="/"
            className="mt-4 block text-center font-sans text-[10px] uppercase tracking-[0.3em] text-[#fdfbf7]/35 transition-colors hover:text-[#c4a484]"
          >
            ← Về trang thiệp
          </a>
        </motion.form>
      </main>
    );
  }

  // ==================================================================
  // MÀN QUẢN LÝ
  // ==================================================================
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
              Mỗi khách nhận một link thiệp riêng có tên của họ.{" "}
              {localMode
                ? "Đang lưu tạm trên trình duyệt này — server chưa cấu hình KV."
                : "Dữ liệu lưu trên máy chủ — dùng được trên mọi thiết bị."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Chế độ lưu */}
            {localMode && (
              <span
                title="Không kết nối được Supabase. Dữ liệu đang lưu trong localStorage của trình duyệt này."
                className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-2 font-sans text-[9px] uppercase tracking-[0.2em] text-amber-200/80"
              >
                Chế độ cục bộ
              </span>
            )}
            {/* Trạng thái lưu */}
            <span
              className={`rounded-full border px-3 py-2 font-sans text-[9px] uppercase tracking-[0.2em] transition-colors ${
                saveState === "error"
                  ? "border-red-400/40 text-red-300/80"
                  : saveState === "saving"
                    ? "border-[#c4a484]/40 text-[#c4a484]/80"
                    : saveState === "saved"
                      ? "border-emerald-400/40 text-emerald-300/80"
                      : "border-transparent text-transparent"
              }`}
            >
              {saveState === "error"
                ? "Lỗi lưu"
                : saveState === "saving"
                  ? "Đang lưu…"
                  : saveState === "saved"
                    ? "✓ Đã lưu"
                    : "·"}
            </span>
            <a
              href="/"
              className="rounded-full border border-[#c4a484]/30 px-5 py-2.5 font-sans text-[10px] uppercase tracking-[0.3em] text-[#c4a484] transition-colors hover:border-[#c4a484]/60 hover:bg-[#c4a484]/10"
            >
              ← Về trang thiệp
            </a>
            {!localMode && (
              <button
                onClick={logout}
                className="rounded-full border border-[#c4a484]/20 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.3em] text-[#fdfbf7]/40 transition-colors hover:border-[#c4a484]/50 hover:text-[#c4a484]"
              >
                Thoát
              </button>
            )}
          </div>
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
              placeholder={
                rel === COUPLE_REL ? "Tên anh (vd: Nguyễn Văn Minh)" : "Tên khách (vd: Nguyễn Văn Minh)"
              }
              className="rounded-xl border border-[#c4a484]/25 bg-[#fdfbf7]/5 px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-[#c4a484]/60"
            />
            {/* Tên người thứ hai — chỉ hiện khi mời cặp anh chị */}
            {rel === COUPLE_REL && (
              <input
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder="Tên chị (vd: Nguyễn Thị Hân)"
                className="rounded-xl border border-[#c4a484]/25 bg-[#fdfbf7]/5 px-4 py-3 font-sans text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-[#c4a484]/60"
              />
            )}
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
              disabled={saveState === "saving"}
              className="rounded-xl bg-[#c4a484] px-7 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#2d1f15] transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
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
                {buildInviteSentence(name || "[Tên khách]", rel, we, name2)}
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
              onClick={removeAll}
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
                      value={drafts[g.id]?.name ?? g.name}
                      onChange={(e) => setDraft(g.id, "name", e.target.value)}
                      onBlur={() => commitDraft(g.id)}
                      className="w-full bg-transparent font-[family-name:var(--font-playfair)] text-lg text-[#fdfbf7] outline-none sm:text-xl"
                    />
                    <input
                      value={drafts[g.id]?.note ?? g.note ?? ""}
                      placeholder="Thêm ghi chú / người gửi…"
                      onChange={(e) => setDraft(g.id, "note", e.target.value)}
                      onBlur={() => commitDraft(g.id)}
                      className="mt-1 w-full bg-transparent font-sans text-xs text-[#c4a484]/80 outline-none placeholder:text-[#fdfbf7]/25"
                    />
                    {/* Tên người thứ hai — chỉ hiện khi khách là cặp anh chị */}
                    {(drafts[g.id]?.rel ?? g.rel) === COUPLE_REL && (
                      <input
                        value={drafts[g.id]?.name2 ?? g.name2 ?? ""}
                        placeholder="Tên chị…"
                        onChange={(e) => setDraft(g.id, "name2", e.target.value)}
                        onBlur={() => commitDraft(g.id)}
                        className="mt-1 w-full bg-transparent font-[family-name:var(--font-playfair)] text-base text-[#fdfbf7]/90 outline-none placeholder:text-[#fdfbf7]/25"
                      />
                    )}
                    {/* Preview câu mời — dùng bản nháp nếu đang sửa */}
                    {(drafts[g.id]?.name ?? g.name).trim() && (
                      <p className="mt-1.5 truncate font-[family-name:var(--font-playfair)] text-[11px] italic text-[#fdfbf7]/40">
                        {buildInviteSentence(
                          drafts[g.id]?.name ?? g.name,
                          drafts[g.id]?.rel ?? g.rel,
                          drafts[g.id]?.we ?? g.we,
                          drafts[g.id]?.name2 ?? g.name2
                        )}
                      </p>
                    )}
                  </div>

                  {/* Bàn */}
                  <input
                    value={drafts[g.id]?.table ?? g.table ?? ""}
                    placeholder="Bàn"
                    onChange={(e) => setDraft(g.id, "table", e.target.value)}
                    onBlur={() => commitDraft(g.id)}
                    className="w-full rounded-lg border border-[#c4a484]/20 bg-[#fdfbf7]/5 px-3 py-2 font-sans text-xs text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/25 focus:border-[#c4a484]/50 lg:w-20"
                  />

                  {/* Danh xưng */}
                  <select
                    value={drafts[g.id]?.rel ?? g.rel ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft(g.id, "rel", v);
                      setDraft(g.id, "we", deriveWeWord(v));
                    }}
                    onBlur={() => commitDraft(g.id)}
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
                    value={drafts[g.id]?.we ?? g.we ?? ""}
                    onChange={(e) => setDraft(g.id, "we", e.target.value)}
                    onBlur={() => commitDraft(g.id)}
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
                      href={linkFor(viewOf(g))}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Mở thiệp của khách này"
                      className="block truncate rounded-lg bg-black/25 px-3 py-2 font-mono text-[11px] text-[#c4a484]/85 transition-colors hover:bg-black/40 hover:text-[#c4a484]"
                    >
                      {linkFor(viewOf(g))}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      onClick={() => copy(linkFor(viewOf(g)), `link-${g.id}`)}
                      className="rounded-lg border border-[#c4a484]/30 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.15em] text-[#c4a484] transition-colors hover:bg-[#c4a484]/15"
                    >
                      {copied === `link-${g.id}` ? "✓" : "Link"}
                    </button>
                    <button
                      onClick={() => copy(messageFor(viewOf(g)), `msg-${g.id}`)}
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
              Mời <b className="text-[#c4a484]">cặp anh chị</b> → chọn xưng{" "}
              <i>&ldquo;Anh chị (cặp)&rdquo;</i>, sẽ hiện thêm ô nhập tên chị. Lời mời
              thành <i>&ldquo;Kính mời Anh Phú &amp; Chị Hân tới dự hôn lễ của chúng em&rdquo;</i>.
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
              <b className="text-[#c4a484]">Sao lưu JSON</b> định kỳ — dùng để nhập lại
              nếu cần.
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
            <p className="mb-2 mt-3 font-sans text-[10px] uppercase tracking-[0.3em] text-[#c4a484]/70">
              Mẫu link — cặp anh chị
            </p>
            <code className="block break-all font-mono text-xs text-[#fdfbf7]/70">
              {site || "https://..."}
              /?to=Nguyễn%20Văn%20Phú&amp;to2=Nguyễn%20Thị%20Hân&amp;rel=anh%20chị
            </code>
          </div>
        </motion.section>

        <p className="mt-10 text-center font-sans text-[10px] uppercase tracking-[0.3em] text-[#fdfbf7]/25">
          Tùng &amp; Hằng · {WEDDING_DATE_DISPLAY} · {WEDDING_DATE_LUNAR_TEXT}
        </p>
      </div>
    </main>
  );
}
