"use client";

/**
 * SOUNDSCORE CẢNH LOADING 3D — nhạc nền + hiệu ứng đồng bộ timeline.
 *
 * ── VÌ SAO TỔNG HỢP (SYNTHESIZE) THAY VÌ FILE MP3? ──
 * ⚠ Mục tiêu của đợt tối ưu này là GIẢM THỜI GIAN CHỜ trên mobile.
 *   Một file MP3 13 giây sẽ là 200-400KB (thậm chí 1MB nếu 320kbps)
 *   → cộng thêm vào hàng đợi tải, đẩy nhẫn xuất hiện chậm hơn.
 *
 *   → Tổng hợp bằng Web Audio API: **0 byte tải thêm**, tiếng vẫn
 *     đầy đủ, và có thể đồng bộ chính xác theo frame của timeline.
 *
 * ── CẤU TRÚC ──
 *   • AMBIENCE  — 1 drone tổng hợp (2 osc + LFO) chạy suốt cảnh,
 *                  tự động fade out khi cảnh kết thúc.
 *   • CUES      — các mốc âm thanh gắn với mốc timeline:
 *                    0.8s  nhẫn bay vào    → "whoosh" kim loại
 *                    4.2s  nhẫn quấn quít  → chuông ngân nhẹ
 *                    4.9s  backdrop hiện   → hơi thở ấm (pad mở ra)
 *                    6.6s  nhân vật xuất hiện → shimmer
 *                    8.4s  cúi chào       → nhip nhẹ
 *                   11.4s  bàn tay chạm    → chuông kết (resolve)
 *
 * ── AUTOPLAY POLICY ──
 * Trình duyệt chặn AudioContext cho tới khi user tương tác.
 *   → Dùng `onAudioReady()` để bắt đầu ambience đúng lúc context
 *     chuyển sang "running".
 *   → Nếu user KHÔNG tương tác, cảnh vẫn chạy bình thường (chỉ
 *     không có tiếng) — không được chặn người xem.
 */

import {
  createNoiseBuffer,
  getAudioContext,
  getMasterGain,
  isMuted,
  onAudioReady,
  unlockAudio,
} from "../soundscape";
// =====================================================================
// TYPES
// =====================================================================

/** 1 mốc âm thanh gắn với timeline của cảnh loading */
interface Cue {
  /** Thời điểm trong timeline (giây) */
  at: number;
  /** Hàm phát âm */
  play: () => void;
}

// =====================================================================
// AMBIENCE — drone nền cho cảnh
// =====================================================================

interface AmbienceNodes {
  /** Gain tổng của ambience */
  gain: GainNode;
  /** 2 osc chính (drone) */
  oscs: OscillatorNode[];
  /** Bộ lọc hạ thấp cho "ấm" */
  filter: BiquadFilterNode;
  /** LFO điều chỉnh filter → nhịp thở */
  lfo: OscillatorNode;
}

let ambience: AmbienceNodes | null = null;
let ambienceGain: GainNode | null = null;

/** Ambient noise (gió nhẹ) — tạo 1 lần, dùng lại */
let airNoise: AudioBuffer | null = null;

/** Unsubscribe của `onAudioReady` — để huỷ khi scene unmount */
let unsubscribeAudioReady: (() => void) | null = null;

/**
 * Khởi động ambience — 1 lần duy nhất.
 *
 * Gọi khi AudioContext đã "running" (qua `onAudioReady`).
 *
 * ⚠ Nếu ambience đã tồn tại (remount trong React StrictMode) → chỉ
 *   fade gain lên lại, KHÔNG tạo node mới. Nếu không, gain vẫn còn
 *   ở giá trị 0.0001 sau `stopSoundScore()` → cảnh remount sẽ im lặng.
 */
function startAmbience() {
  const c = getAudioContext();
  const master = getMaster();
  if (!c || !master) return;

  const t = c.currentTime;

  // ── Đã có ambience → chỉ fade lên lại ──
  if (ambience && ambienceGain) {
    ambienceGain.gain.cancelScheduledValues(t);
    ambienceGain.gain.setValueAtTime(
      Math.max(ambienceGain.gain.value, 0.0001),
      t
    );
    ambienceGain.gain.exponentialRampToValueAtTime(0.16, t + 1.2);
    return;
  }

  // ── Tầng 1: drone 2 osc (quint + octave) ──
  // Trầm ấm, tạo cảm giác "không gian sân khấu chờ đợi".
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.16, t + 2.4);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(420, t);
  filter.Q.value = 0.6;

  const oscs: OscillatorNode[] = [];
  // A2 = 110Hz (nền), E3 = 164.81Hz (quint) → hợp âm Ấm
  for (const [freq, type, detune] of [
    [55, "sine", 0],
    [82.41, "sine", 4],
    [110, "triangle", -6],
  ] as const) {
    const osc = c.createOscillator();
    const og = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.setValueAtTime(detune, t);
    og.gain.value = freq === 55 ? 0.5 : freq === 82.41 ? 0.32 : 0.22;
    osc.connect(og).connect(filter);
    osc.start(t);
    oscs.push(osc);
  }

  // ── Tầng 2: LFO mở/đóng filter → nhịp thở rất chậm ──
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.055, t); // ~18s/chu kỳ
  lfoGain.gain.value = 160;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start(t);

  // ── Tầng 3: gió rất nhẹ (noise lọc band thấp) ──
  const src = c.createBufferSource();
  src.buffer = getAirNoise(c);
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(340, t);
  bp.Q.value = 0.5;
  const ng = c.createGain();
  ng.gain.value = 0.035;
  src.connect(bp).connect(ng).connect(gain);
  src.start(t);

  filter.connect(gain).connect(master);

  ambience = { gain, oscs, filter, lfo };
  ambienceGain = gain;
}

/**
 * Noise buffer dùng lại cho gió.
 *
 * ⚠ Buffer 4s × 44.1kHz × 4 byte ≈ 700KB RAM. Tạo 1 lần, dùng lại
 *   cho toàn bộ cảnh (loop) → không tốn thêm khi phát cue.
 */
function getAirNoise(c: AudioContext): AudioBuffer {
  if (!airNoise) {
    airNoise = createNoiseBuffer(c, 4);
  }
  return airNoise;
}
// =====================================================================
// CUE HELPERS — hiệu ứng đồng bộ timeline
// =====================================================================

/**
 * "Whoosh" kim loại — tiếng gió khi nhẫn bay qua.
 *
 * Dùng noise bandpass với tần số quét lên → tạo cảm giác vật thể
 * lướt qua không khí.
 */
function playRingWhoosh() {
  const c = getAudioContext();
  const master = getMaster();
  if (!c || !master) return;

  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = getAirNoise(c);

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.6;
  // Quét tần số lên rồi xuống → "vọng" của kim loại
  bp.frequency.setValueAtTime(600, t);
  bp.frequency.exponentialRampToValueAtTime(3400, t + 0.55);
  bp.frequency.exponentialRampToValueAtTime(900, t + 1.5);

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

  src.connect(bp).connect(g).connect(master);
  src.start(t);
  src.stop(t + 1.7);
}

/**
 * Chuông ngân nhẹ — 2 nhẫn chạm/quấn vào nhau.
 *
 * Dùng bộ partial hài hòa (như `playChime` nhưng nhẹ hơn, trầm hơn).
 */
function playRingLockChime() {
  const c = getAudioContext();
  const master = getMaster();
  if (!c || !master) return;

  const t = c.currentTime;
  // G5, D6, G6 — hợp âm chuông ngân quen thuộc
  const partials: [number, number, number][] = [
    [783.99, 0.075, 2.2],
    [1174.66, 0.042, 1.8],
    [1567.98, 0.022, 1.3],
  ];

  partials.forEach(([freq, peak, decay], i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const start = t + i * 0.05;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + decay + 0.1);
  });
}

/**
 * Pad mở ra — backdrop hiện.
 *
 * Filter của ambience mở rộng + thêm 1 tầng harmonic ấm.
 */
function playBackdropReveal() {
  const c = getAudioContext();
  if (!c || !ambience) return;

  const t = c.currentTime;
  // Mở filter từ 420 → 900Hz trong 1.6s → "không gian mở ra"
  ambience.filter.frequency.cancelScheduledValues(t);
  ambience.filter.frequency.setValueAtTime(ambience.filter.frequency.value, t);
  ambience.filter.frequency.exponentialRampToValueAtTime(900, t + 1.6);
}

/**
 * Shimmer — nhân vật xuất hiện (ánh sáng chạm da).
 */
function playCharacterShimmer() {
  const c = getAudioContext();
  const master = getMaster();
  if (!c || !master) return;

  const t = c.currentTime;
  for (let i = 0; i < 7; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    const f = 1400 + i * 320 + Math.random() * 200;
    osc.frequency.setValueAtTime(f, t + i * 0.075);
    osc.frequency.exponentialRampToValueAtTime(f * 1.35, t + i * 0.075 + 0.35);
    g.gain.setValueAtTime(0.0001, t + i * 0.075);
    g.gain.exponentialRampToValueAtTime(0.028, t + i * 0.075 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.075 + 0.55);
    osc.connect(g).connect(master);
    osc.start(t + i * 0.075);
    osc.stop(t + i * 0.075 + 0.65);
  }
}

/**
 * Nhịp nhẹ — cúi chào.
 *
 * Trải (heartbeat) rất nhẹ + hơi thở, đồng bộ với nhịp cúi.
 */
function playBowBeat() {
  const c = getAudioContext();
  const master = getMaster();
  if (!c || !master) return;

  const t = c.currentTime;
  // 2 nhịp (lub-dub) cách nhau 0.22s
  for (const [offset, peak] of [
    [0, 0.11],
    [0.22, 0.065],
  ] as const) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    const start = t + offset;
    osc.frequency.setValueAtTime(92, start);
    osc.frequency.exponentialRampToValueAtTime(46, start + 0.24);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + 0.5);
  }
}

/**
 * Chuông kết — bàn tay chạm nhau / mở thiệp.
 *
 * Resolve của cảnh → hợp âm ấm, dứt khoát.
 */
function playResolveChime() {
  const c = getAudioContext();
  const master = getMaster();
  if (!c || !master) return;

  const t = c.currentTime;
  // Cmaj7 ngân dài — ấm, viên mãn
  const partials: [number, number, number][] = [
    [523.25, 0.1, 3.4],
    [659.25, 0.075, 3.0],
    [783.99, 0.06, 2.6],
    [987.77, 0.035, 2.2],
  ];

  partials.forEach(([freq, peak, decay], i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const start = t + i * 0.06;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + decay + 0.1);
  });
}

// =====================================================================
// CUE TABLE — ánh xạ mốc timeline → âm thanh
// =====================================================================

/**
 * ⚠ Mốc thời gian lấy từ `components/loading3d/timeline.ts`:
 *   ringEnter 0.15 · ringLock 3.55 · backdropIn 4.25
 *   coupleIn 5.95 · coupleBow 7.75 · handoff 10.75
 */
const CUES: Cue[] = [
  { at: 0.15, play: playRingWhoosh },
  { at: 3.55, play: playRingLockChime },
  { at: 4.25, play: playBackdropReveal },
  { at: 5.95, play: playCharacterShimmer },
  { at: 7.75, play: playBowBeat },
  { at: 10.75, play: playResolveChime },
];

// =====================================================================
// PUBLIC API
// =====================================================================

let soundScoreStarted = false;
let soundScoreStopped = false;
let cueIndex = 0;

/**
 * Khởi động soundscore của cảnh loading.
 *
 * Gọi 1 lần khi scene bắt đầu chạy. Nếu AudioContext bị chặn bởi
 * autoplay policy → tự động bắt đầu khi user tương tác lần đầu.
 */
export function startSoundScore() {
  if (soundScoreStarted) return;
  soundScoreStarted = true;
  soundScoreStopped = false;

  // Nếu context chạy rồi → chơi ngay. Nếu chưa → chờ user tương tác.
  unsubscribeAudioReady = onAudioReady(() => {
    if (soundScoreStopped) return;
    startAmbience();
  });

  // Thử mở khoá ngay (thường thành công nếu user đã tương tác).
  unlockAudio();
}

/**
 * Dừng soundscore + fade out ambience.
 *
 * Gọi khi cảnh loading kết thúc (chuyển sang intro screen).
 */
export function stopSoundScore() {
  soundScoreStopped = true;
  if (unsubscribeAudioReady) {
    unsubscribeAudioReady();
    unsubscribeAudioReady = null;
  }

  const c = getAudioContext();
  if (!c || !ambienceGain) return;

  const t = c.currentTime;
  // Fade out mượt trong 1.4s → không bị cắt đột ngột
  ambienceGain.gain.cancelScheduledValues(t);
  ambienceGain.gain.setValueAtTime(
    Math.max(ambienceGain.gain.value, 0.0001),
    t
  );
  ambienceGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
}

/**
 * Báo cho soundscore biết timeline đang ở giây thứ `t`.
 *
 * Hàm này được gọi MỖI FRAME từ `TimelineDriver`. Soundscore tự
 * so sánh với các mốc đã định nghĩa và phát đúng 1 lần khi tới mốc.
 *
 * ⚠ Dùng `clock.time` (đã bị reset về 0 khi scene bắt đầu) nên
 *   mọi cue luôn khớp chính xác với hình ảnh, không bị lệch.
 */
export function updateSoundScore(t: number) {
  if (!soundScoreStarted || soundScoreStopped) return;

  // Phát các mốc đã đi qua (phòng khi frame bị drop).
  //
  // ⚠ Vẫn TIẾN `cueIndex` khi đang muted — nếu không, khi user bật
  //   tiếng giữa cảnh, tất cả cue đã qua sẽ phát đồng loạt (bùng nổ
  //   âm thanh). Bật tiếng giữa cảnh là trường hợp hiếm nhưng vẫn
  //   phải xử lý đúng.
  while (cueIndex < CUES.length && t >= CUES[cueIndex].at) {
    const cue = CUES[cueIndex];
    cueIndex++;
    if (isMuted()) continue;
    try {
      cue.play();
      // ── DEBUG (chỉ dev) ──
      if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
        const dbg = (window as unknown as { __soundCues?: number[] })
          .__soundCues;
        if (dbg) dbg.push(cue.at);
      }
    } catch {
      /* lỗi 1 cue không được chặn cảnh */
    }
  }
}

/**
 * Reset soundscore về trạng thái ban đầu (dùng khi remount scene).
 */
export function resetSoundScore() {
  soundScoreStarted = false;
  soundScoreStopped = false;
  cueIndex = 0;

  // ── DEBUG (chỉ dev) ──
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    (window as unknown as { __soundCues?: number[] }).__soundCues = [];
  }
}

// =====================================================================
// ACCESSORS — dùng chung context với `soundscape.ts`
// =====================================================================

/**
 * Lấy AudioContext dùng chung.
 *
 * ⚠ `soundscape.ts` giữ context ở module scope → mọi sound trong web
 *   dùng CHUNG 1 AudioContext (1 user gesture, 1 nhóm node). Điều này
 *   tiết kiệm bộ nhớ đáng kể trên mobile so với mỗi module 1 context.
 */
function getCtx(): AudioContext | null {
  return getAudioContext();
}

function getMaster(): GainNode | null {
  return getMasterGain();
}
