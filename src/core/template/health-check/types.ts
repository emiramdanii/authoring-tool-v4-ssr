// ═══════════════════════════════════════════════════════════════════
// TEMPLATE HEALTH CHECK — Types & Constants
// ═══════════════════════════════════════════════════════════════════
// Template berantakan harus dicek dengan validator, bukan perasaan.
// Mulai dari overlap, overflow, font kecil, placeholder, dan page
// yang terlalu padat.
//
// Skor 100 = siap pakai. Di bawah 60 = jangan dipakai.
// ═══════════════════════════════════════════════════════════════════

// ── Issue Types ──────────────────────────────────────────────────

export type TemplateIssueType =
  | 'overlap'                // Elemen saling menimpa
  | 'overflow'               // Konten keluar safe area
  | 'font-too-small'         // Font terlalu kecil untuk media siswa
  | 'too-many-blocks'        // Terlalu banyak block per page (1 page 1 fokus)
  | 'too-many-colors'        // Warna tidak konsisten / liar
  | 'missing-navigation'     // Navigasi tidak jelas
  | 'broken-score'           // Score tidak sinkron dengan completion
  | 'broken-completion'      // Completion tidak sinkron dengan navigation lock
  | 'placeholder-text'       // Template masih punya teks placeholder
  | 'missing-feedback'       // Interaksi tanpa feedback
  | 'export-mismatch'        // Preview vs export berbeda
  | 'empty-content'          // Block kosong tanpa konten
  | 'hardcoded-color'        // Warna hardcoded bukan dari contract
  | 'narrative-incoherent';  // Alur naratif tidak koheren

export type IssueSeverity = 'error' | 'warning' | 'info';

// ── Issue ────────────────────────────────────────────────────────

export interface TemplateHealthIssue {
  /** Index page tempat issue ditemukan */
  pageIndex: number;
  /** Severity: error = wajib diperbaiki, warning = sebaiknya diperbaiki */
  severity: IssueSeverity;
  /** Kategori issue */
  type: TemplateIssueType;
  /** Pesan yang bisa ditampilkan ke user */
  message: string;
  /** Block type yang bermasalah (opsional) */
  blockType?: string;
  /** Block ID yang bermasalah (opsional) */
  blockId?: string;
  /** Detail teknis tambahan */
  detail?: string;
  /** Quick fix action yang tersedia */
  quickFix?: TemplateQuickFix;
}

// ── Quick Fix Actions ────────────────────────────────────────────

export type TemplateQuickFix =
  | 'split-page'             // Pecah halaman
  | 'enlarge-font'           // Perbesar font
  | 'remove-placeholder'     // Hapus placeholder text
  | 'change-variant'         // Pilih variasi lain
  | 'fix-navigation'         // Perbaiki navigasi
  | 'fix-colors'             // Perbaiki warna
  | 'add-feedback'           // Tambah feedback ke interaksi
  | 'fix-score-sync';        // Sinkronkan score dan completion

// ── Health Score ─────────────────────────────────────────────────

export type HealthStatus = 'ready' | 'needs-polish' | 'problematic' | 'unusable';

export interface TemplateHealthResult {
  /** Skor 0-100 */
  score: number;
  /** Status berdasarkan skor */
  status: HealthStatus;
  /** Semua issue yang ditemukan */
  issues: TemplateHealthIssue[];
  /** Breakdown skor per area */
  breakdown: HealthScoreBreakdown;
  /** Ringkasan per page */
  pageSummaries: PageHealthSummary[];
}

export interface HealthScoreBreakdown {
  /** Bobot 20: Tidak overlap */
  noOverlap: { score: number; max: number; issues: number };
  /** Bobot 20: Tidak overflow */
  noOverflow: { score: number; max: number; issues: number };
  /** Bobot 15: Font terbaca */
  fontReadable: { score: number; max: number; issues: number };
  /** Bobot 15: 1 page 1 fokus */
  oneFocusPerPage: { score: number; max: number; issues: number };
  /** Bobot 10: Warna konsisten */
  colorConsistent: { score: number; max: number; issues: number };
  /** Bobot 10: Navigasi jalan */
  navigationWorking: { score: number; max: number; issues: number };
  /** Bobot 10: Interaksi jalan */
  interactionWorking: { score: number; max: number; issues: number };
}

export interface PageHealthSummary {
  /** Index page */
  pageIndex: number;
  /** Label page */
  label: string;
  /** Template type */
  templateType: string;
  /** Jumlah issue error */
  errors: number;
  /** Jumlah issue warning */
  warnings: number;
  /** Apakah page lolos semua cek */
  passed: boolean;
}

// ── Safe Area Constants ──────────────────────────────────────────

/** Canvas size (1280x720 — 16:9 default) */
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

/** Safe area margins — navbar, sidebar, breathing room */
export const SAFE_AREA = {
  top: 72,     // Navbar area
  bottom: 72,  // Bottom nav area
  left: 56,    // Side margin
  right: 56,   // Side margin
} as const;

/** Safe area in percentage for percentage-based layouts */
export const SAFE_AREA_PERCENT = {
  top: (SAFE_AREA.top / CANVAS_HEIGHT) * 100,     // 10%
  bottom: ((CANVAS_HEIGHT - SAFE_AREA.bottom) / CANVAS_HEIGHT) * 100, // 90%
  left: (SAFE_AREA.left / CANVAS_WIDTH) * 100,    // ~4.4%
  right: ((CANVAS_WIDTH - SAFE_AREA.right) / CANVAS_WIDTH) * 100,    // ~95.6%
} as const;

// ── Font Minimum Constants ───────────────────────────────────────

export const FONT_MINIMUMS: Record<string, number> = {
  /** Cover title minimal */
  coverTitle: 48,
  /** Page title / section title minimal */
  pageTitle: 36,
  /** Card title minimal */
  cardTitle: 24,
  /** Body text minimal */
  body: 20,
  /** Caption / small text minimal */
  caption: 16,
  /** Button text minimal */
  button: 18,
};

// ── Max Blocks Per Page Type ─────────────────────────────────────

export const MAX_BLOCKS_PER_PAGE: Record<string, number> = {
  cover: 1,       // 1 cover saja
  tujuan: 2,      // 1 display + 1 deskripsi (3-4 tujuan items OK)
  petunjuk: 2,    // 1 judul + 1 langkah
  motivasi: 2,    // 1 judul + 1 konten
  materi: 3,      // 1 konsep + 1 contoh + 1 visual
  skenario: 2,    // 1 judul + 1 konten
  diskusi: 2,     // 1 judul + 1 pertanyaan
  kuis: 1,        // 1 soal saja
  game: 1,        // 1 game saja
  refleksi: 2,    // 1-2 pertanyaan
  rangkuman: 2,   // 1 ringkasan + 1 visual
  penutup: 2,     // 1 ringkasan + 1 pesan akhir
  hasil: 2,       // 1 judul + 1 konten
  dokumen: 3,     // Tab layout bisa lebih
  hero: 1,        // 1 hero saja
  custom: 4,      // Bebas tapi tetap ada batas
};

// ── Placeholder Patterns ─────────────────────────────────────────

export const PLACEHOLDER_PATTERNS = [
  /tuliskan\s+(di\s+)?sini/i,
  /tulis\s+(di\s+)?sini/i,
  /contoh\s+(di\s+)?sini/i,
  /isi\s+(di\s+)?sini/i,
  /tulis\s+pendapat/i,
  /placeholder/i,
  /lorem\s+ipsum/i,
  /judul\s+materi/i,
  /penjelasan\s+materi/i,
  /poin\s+(pertama|kedua|ketiga|keempat)/i,
  /tipe\s+blok/i,
  /konten\s+belum\s+tersedia/i,
  /definisi\s+baru/i,
  /judul\s+baru/i,
  /masukkan\s+(teks|judul|konten)/i,
  /ketik\s+(di\s+)?sini/i,
  /click\s+(to\s+)?edit/i,
] as const;

// ── Health Status Thresholds ─────────────────────────────────────

export function getHealthStatus(score: number): HealthStatus {
  if (score >= 90) return 'ready';
  if (score >= 75) return 'needs-polish';
  if (score >= 60) return 'problematic';
  return 'unusable';
}

export function getHealthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'ready': return 'Siap Pakai';
    case 'needs-polish': return 'Perlu Polish';
    case 'problematic': return 'Bermasalah';
    case 'unusable': return 'Jangan Dipakai';
  }
}

export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'ready': return '#22c55e';       // green-500
    case 'needs-polish': return '#f59e0b'; // amber-500
    case 'problematic': return '#ef4444';  // red-500
    case 'unusable': return '#dc2626';     // red-600
  }
}
