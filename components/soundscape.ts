"use client";

/**
 * Soundscape — âm thanh tổng hợp bằng Web Audio API
 * Không cần file nhạc mới, không tốn băng thông, tự động tôn trọng
 * autoplay policy của trình duyệt.
 */

// =====================================================================
// CONTEXT
// =====================================================================
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let pendingChime: (() => void) | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Gọi khi có tương tác người dùng — mở khoá AudioContext. */
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    void c.resume().then(() => {
      if (pendingChime) {
        const fn = pendingChime;
        pendingChime = null;
        // Chờ nhẹ để không chồng lên tiếng "chạm sáp"
        setTimeout(fn, 500);
      }
    });
  }
}

/** Tự động gọi unlock khi user chạm lần đầu. */
export function installAudioUnlock() {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("touchstart", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler, { once: true });
  window.addEventListener("touchstart", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
  return () => {
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("touchstart", handler);
    window.removeEventListener("keydown", handler);
  };
}

// =====================================================================
// HELPERS
// =====================================================================
function noiseBuffer(c: AudioContext, duration: number) {
  const len = Math.max(1, Math.floor(c.sampleRate * duration));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function env(
  g: GainNode,
  t: number,
  peak: number,
  attack: number,
  decay: number
) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

// =====================================================================
// LAYER 1 — "Chạm sáp": tiếng ấn con dấu (trầm + tiếng nứt)
// =====================================================================
export function playWaxThunk() {
  const c = getCtx();
  if (!c || !master) return;
  unlockAudio();
  const t = c.currentTime;

  // Thân âm trầm
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(165, t);
  osc.frequency.exponentialRampToValueAtTime(52, t + 0.28);
  env(g, t, 0.55, 0.012, 0.42);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.6);

  // Vết nứt sáp
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.3);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(320, t + 0.2);
  const ng = c.createGain();
  env(ng, t, 0.4, 0.006, 0.2);
  src.connect(lp).connect(ng).connect(master);
  src.start(t);
  src.stop(t + 0.35);
}

// =====================================================================
// LAYER 2 — "Mở thiệp": tiếng giấy vân nhẹ
// =====================================================================
export function playPaperRustle(duration = 1.5) {
  const c = getCtx();
  if (!c || !master) return;
  unlockAudio();
  const t = c.currentTime;

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, duration + 0.2);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1500, t);
  bp.frequency.linearRampToValueAtTime(3600, t + duration * 0.5);
  bp.frequency.linearRampToValueAtTime(1200, t + duration);
  bp.Q.value = 0.8;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.16, t + duration * 0.35);
  g.gain.linearRampToValueAtTime(0.0001, t + duration);

  src.connect(bp).connect(g).connect(master);
  src.start(t);
  src.stop(t + duration + 0.1);
}

// =====================================================================
// LAYER 3 — Chuông: khoảnh khắc tên hiện xong
// =====================================================================
export function playChime() {
  const c = getCtx();
  if (!c || !master) return;

  if (c.state === "suspended") {
    // Chưa có tương tác — chờ lần chạm đầu tiên rồi mới kêu
    pendingChime = () => playChime();
    unlockAudio();
    return;
  }

  const t = c.currentTime;
  const partials: [number, number, number][] = [
    [880, 0.16, 2.6],
    [1320, 0.085, 2.1],
    [1760, 0.04, 1.6],
  ];

  partials.forEach(([freq, peak, decay], i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const start = t + i * 0.045;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(g).connect(master!);
    osc.start(start);
    osc.stop(start + decay + 0.1);
  });
}

// =====================================================================
// LAYER 4 — Tiếng "shimmer" nhẹ khi hoa nở / section vào
// =====================================================================
export function playShimmer() {
  const c = getCtx();
  if (!c || !master) return;
  if (c.state === "suspended") return;
  const t = c.currentTime;

  for (let i = 0; i < 5; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    const f = 1200 + Math.random() * 2400;
    osc.frequency.setValueAtTime(f, t + i * 0.06);
    osc.frequency.exponentialRampToValueAtTime(f * 1.4, t + i * 0.06 + 0.3);
    g.gain.setValueAtTime(0.0001, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.035, t + i * 0.06 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.42);
    osc.connect(g).connect(master);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.5);
  }
}
