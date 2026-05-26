// ═══════════════════════════════════════════════════════════════════
// VISUAL DNA — SILSE v2.1 Learning Experience Language
// ═══════════════════════════════════════════════════════════════════
// Filosofi: experience → template → system
// 
// Ini BUKAN sistem baru — ini DOKUMENTASI FORMAL dari Visual DNA
// yang sudah ada dan berjalan di SILSE v2.1. Semua value di bawah
// adalah single source of truth yang sudah terverifikasi bekerja.
//
// Tujuan file ini:
//   1. Menjadi referensi tunggal untuk "bagaimana tampilan SILSE"
//   2. Menjadi panduan saat membangun template/preset baru
//   3. Menjadi kontrak visual antara desainer dan developer
//   4. Mencegah "visual drift" — setiap penambahan harus konsisten
//
// Dikutip dari:
//   - tokens.ts (golden-presentation theme)
//   - education-scene-types.ts (8 Scene Types)
//   - education-scene-atmosphere.ts (Scene Atmospheres)
//   - Referensi HTML: mpi-ppkn-norma-final
// ═══════════════════════════════════════════════════════════════════

// ── 1. TYPOGRAPHY ──────────────────────────────────────────────
// Display: Poppins 800 untuk heading — tegas, modern, bukan "formal kaku"
// Body: Open Sans 400-600 untuk konten — readable, bersahabat
// Hierarchy: h2 (42px) → h3 (26px) → xl (18px) → base (13px)
// Rule: Jangan pernah pakai font di luar Poppins/Open Sans

export const VISUAL_DNA_TYPOGRAPHY = {
  fontFamily: {
    display: "'Poppins', var(--font-fredoka), 'Fredoka', cursive",
    body: "'Open Sans', var(--font-nunito), 'Nunito', sans-serif",
  },
  scale: {
    h2: '2.625rem',    // 42px — judul besar cover
    h3: '1.625rem',    // 26px — section heading
    xl: '1.125rem',    // 18px — subheading
    lg: '1rem',        // 16px — emphasis body
    md: '0.875rem',    // 14px — normal body
    base: '0.8125rem', // 13px — compact body
    sm: '0.75rem',     // 12px — caption
    xs: '0.6875rem',   // 11px — badge/label
  },
  weight: {
    normal: 400,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  rules: [
    'Heading SELALU Poppins extrabold (800) atau bold (700)',
    'Body SELALU Open Sans normal (400) atau semibold (600)',
    'Jangan campur — heading pakai body font atau sebaliknya',
    'Badge/label pakai extrabold uppercase + letter-spacing 0.08em',
  ],
} as const;

// ── 2. COLOR SYSTEM ────────────────────────────────────────────
// Background: Dark navy #0f172a → #1e293b (bukan hitam pekat)
// Card: Glassmorphism rgba(255,255,255,0.06) + border rgba(255,255,255,0.1)
// Primary accent: #fbbf24 (EMAS) — identitas visual SILSE
// Secondary: #2563eb (BIRU) — aksen dingin, penyeimbang
// Rule: Emas dominan di intro/cover, biru di konsep, hijau di practice

export const VISUAL_DNA_COLORS = {
  background: {
    primary: '#0f172a',     // Slate 900 — base canvas
    secondary: '#1e293b',   // Slate 800 — card/section bg
    gradient: 'linear-gradient(180deg, #0f172a, #1e293b)',
  },
  card: {
    fill: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.1)',
    hover: 'rgba(255,255,255,0.1)',
  },
  accent: {
    y: '#fbbf24',  // Emas — primary identity, warmth, prestige
    c: '#2563eb',  // Biru — secondary, trust, knowledge
    r: '#f87171',  // Merah — danger, evaluate, wrong
    p: '#c084fc',  // Ungu — explore, creativity
    g: '#4ade80',  // Hijau — success, practice, correct
    o: '#fb923c',  // Oranye — warm, progress
  },
  text: {
    primary: '#ffffff',
    muted: '#64748b',
  },
  // Norma-specific colors (macam-norma preset)
  norma: {
    agama: '#fbbf24',       // Emas
    kesusilaan: '#f87171',  // Merah
    kesopanan: '#38bdf8',   // Biru muda
    hukum: '#c084fc',       // Ungu
  },
  rules: [
    'Emas (#fbbf24) adalah identitas utama — gunakan di CTA, badge utama, progress',
    'Setiap scene type punya warna dominan: intro=emas, concept=biru, practice=hijau, assessment=oranye',
    'Card SELALU gunakan fill rgba(255,255,255,0.06) — bukan solid putih/abu',
    'Background SELALU dark navy — jangan pernah pakai hitam pekat #000',
    'Glassmorphism: card + border tipis + subtle shadow = kedalaman tanpa berat',
  ],
} as const;

// ── 3. LAYOUT SYSTEM ──────────────────────────────────────────
// Canvas: 16:9 aspect ratio (1280×720 base)
// Safe area: Top 48px (navbar), Bottom 40px (progress), Left/Right 16px
// Block gap: 12px normal, 24px section-open, 8px repetition
// Max width content: 90% of safe area width
// Rule: Satu fokus per scene — jangan tumpuk 5 block di 1 scene

export const VISUAL_DNA_LAYOUT = {
  canvas: {
    ratio: '16:9',
    baseWidth: 1280,
    baseHeight: 720,
  },
  safeArea: {
    top: 48,
    bottom: 40,
    left: 16,
    right: 16,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 36,
  },
  blockGap: {
    normal: 12,
    sectionOpen: 24,
    repetition: 8,
    visualBreak: 20,
  },
  radius: {
    card: 12,
    badge: 20,
    button: 10,
    input: 8,
  },
  rules: [
    'Cover/hero block: absolute positioning, fill entire scene',
    'Flow blocks: positioned by SceneLayoutEngine, NOT CSS flex/grid',
    'Section label: pill badge di top-left, font extrabold uppercase 11px',
    'Max 4 blocks per scene (ideal: 2-3) — lebih dari itu pecah ke scene baru',
    'Whitespace ratio: intro ≥45%, concept ≥30%, reflection ≥50%',
  ],
} as const;

// ── 4. CARD SYSTEM ─────────────────────────────────────────────
// nc-grid: 2×2 grid kartu konsep dengan icon, judul, body, warna
// def-box: Border kiri warna + konten HTML (bold, italic, list)
// flashcard: Q&A flip card — pertanyaan depan, jawaban belakang
// nk-card: Kartu norma dengan icon, nama, sanksi, warna khas
// Rule: Card SELALU punya border-radius 12px + subtle shadow

export const VISUAL_DNA_CARD = {
  base: {
    borderRadius: 12,
    padding: '14px 16px',
    fill: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    shadow: '0 4px 6px rgba(0,0,0,0.2)',
  },
  hover: {
    fill: 'rgba(255,255,255,0.1)',
    transform: 'translateY(-2px)',
    shadow: '0 10px 25px rgba(0,0,0,0.3)',
  },
  active: {
    transform: 'scale(0.96)',
  },
  gridLayout: '2×2',  // nc-grid default
  rules: [
    'Setiap card punya aksen warna — bukan abu-abu polos',
    'Icon di card SELALU emoji 1-2 karakter, bukan SVG/imagenya sendiri',
    'Card body: maksimal 2-3 kalimat — bukan paragraf panjang',
    'Hover effect: translateY(-2px) + shadow lebih besar — WAJIB',
    'Active/pressed: scale(0.96) — feedback haptic visual',
  ],
} as const;

// ── 5. NAVIGATION SYSTEM ──────────────────────────────────────
// Top navbar: logo text + accent color + progress bar
// Progress bar: gradient dari warna scene saat ini
// Section label: pill badge dengan scene color
// Bottom nav: prev/next arrows + scene dots
// Rule: Navbar SELALU tampil kecuali pure cover page

export const VISUAL_DNA_NAVIGATION = {
  topBar: {
    height: 40,
    logoFont: 'display',
    logoWeight: 800,
    logoSize: '0.875rem',
    progressHeight: 3,
    progressGradient: ['y', 'c'] as const,
  },
  sectionLabel: {
    font: 'display',
    weight: 800,
    size: '0.6875rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding: '4px 12px',
    borderRadius: 99,
  },
  rules: [
    'Progress bar SELALU gradient — bukan solid color',
    'Logo text: emoji + judul materi, font Poppins 800',
    'Section label: pill badge, warna sesuai scene type',
    'Navigasi antar scene: panah kiri/kanan + dot indicator',
  ],
} as const;

// ── 6. MOTION SYSTEM ───────────────────────────────────────────
// Entrance: fade-in + slide-up (250ms ease-out)
// Hover: translateY(-2px) + shadow scale (150ms ease)
// Press: scale(0.96) (100ms ease)
// Reveal: progressive (step-by-step) atau on-interaction
// Rule: Motion harus HALUS — 250ms max, ease-out

export const VISUAL_DNA_MOTION = {
  entrance: {
    duration: 250,
    easing: 'ease-out',
    type: 'fade-slide-up',
  },
  hover: {
    duration: 150,
    easing: 'ease',
    transform: 'translateY(-2px)',
  },
  press: {
    duration: 100,
    easing: 'ease',
    transform: 'scale(0.96)',
  },
  reveal: {
    progressive: 'step-by-step, setiap block muncul setelah sebelumnya',
    onInteraction: 'konten tersembunyi muncul setelah klik/tap',
    allVisible: 'semua konten langsung terlihat (ringkasan/penutup)',
  },
  rules: [
    'JANGAN pernah pakai animasi lebih dari 300ms — terasa lambat',
    'Entrance animasi: fade + slide-up, bukan bounce/elastic',
    'Hover SELALU translateY(-2px) — konsisten di seluruh sistem',
    'Reveal strategy: concept=progressive, practice=on-interaction, summary=all-visible',
  ],
} as const;

// ── 7. CONTENT RHYTHM ──────────────────────────────────────────
// Learning flow: Hook → Konsep → Contoh → Aktivitas → Quiz → Refleksi
// Scene intensity curve: 0.7 → 0.4 → 0.5 → 0.8 → 0.5 → 0.2 → 0.6
// Word budget per scene: intro 20-60, concept 60-120, practice 20-60
// Block density: max 3 per scene (ideal 2)
// Rule: Rhythm = breathing — naik-turun, bukan datar terus

export const VISUAL_DNA_RHYTHM = {
  goldenFlow: ['intro', 'concept', 'example', 'practice', 'assessment', 'reflection', 'summary'] as const,
  intensityCurve: {
    intro: 0.7,
    concept: 0.4,
    example: 0.5,
    practice: 0.8,
    discussion: 0.3,
    reflection: 0.2,
    assessment: 0.5,
    summary: 0.6,
  },
  wordBudget: {
    intro: [20, 60],
    concept: [60, 120],
    example: [40, 80],
    practice: [20, 60],
    discussion: [30, 60],
    reflection: [15, 40],
    assessment: [10, 40],
    summary: [30, 70],
  },
  maxBlocksPerScene: {
    intro: 3,
    concept: 4,
    example: 3,
    practice: 3,
    discussion: 2,
    reflection: 2,
    assessment: 2,
    summary: 3,
  },
  rules: [
    'Flow WAJIB dimulai dari intro (hook/curiosity) dan diakhiri summary (closure)',
    'Jangan 3+ scene berturut-turut di intensity yang sama — monoton',
    'Setiap scene fokus pada SATU tujuan pembelajaran — bukan semua sekaligus',
    'Konten refleksi SELALU merujuk kembali ke diskusi sebelumnya (portofolio)',
    'Game/kuis di tengah = reward setelah materi, bukan hukuman',
  ],
} as const;

// ── 8. INTERACTION PATTERNS ────────────────────────────────────
// Skenario: Cerita pilihan ganda dengan konsekuensi visual
// Kuis: Pilihan ganda dengan feedback per soal
// Diskusi: Pertanyaan terbuka + area tulis (jawaban tersimpan)
// Game: Sortir, roda, memory, crossword — 1 game per scene
// Refleksi: 2-3 pertanyaan metakognitif + petunjuk tulis
// Rule: Interaksi harus terasa NATURAL — bukan "klik tombol lalu lihat"

export const VISUAL_DNA_INTERACTION = {
  scenario: {
    structure: 'setup → pilihan → konsekuensi → norma insight',
    choicesPerChapter: 3,
    goodPts: 20,
    midPts: 8,
    badPts: 0,
  },
  quiz: {
    questionsPerScene: 5,
    optionsPerQuestion: 4,
    showFeedbackPerQuestion: true,
    explanationRequired: true,
  },
  discussion: {
    questionsPerScene: 1,
    hasWritingArea: true,
    answersPersist: true, // jawaban muncul lagi di refleksi
  },
  game: {
    oneGamePerScene: true,
    types: ['sortir', 'roda', 'memory', 'crossword', 'fill-blank', 'true-false'] as const,
  },
  reflection: {
    questionsPerScene: 2,
    hasWritingArea: true,
    colors: ['y', 'c'] as const,
    icons: ['🌟', '🔍'] as const,
  },
  rules: [
    'Skenario SELALU punya 3 pilihan: best/good, mid/acceptable, bad/wrong',
    'Kuis SELALU tampilkan explanation setelah jawab — bukan hanya benar/salah',
    'Diskusi jawaban HARUS persist — muncul lagi di Refleksi sebagai portofolio',
    'Game: 1 game per scene — jangan tumpuk 2 game di 1 scene',
    'Refleksi: pertanyaan bersifat metakognitif, bukan hafalan',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════
// VISUAL DNA SUMMARY — Quick reference card
// ═══════════════════════════════════════════════════════════════════
// Untuk siapa? Developer yang membangun template/preset baru.
// 
// Pertanyaan            │ Jawaban dari Visual DNA
// ──────────────────────┼──────────────────────────────────────
// Font heading?         │ Poppins 800
// Font body?            │ Open Sans 400-600
// Background?           │ #0f172a → #1e293b (dark navy)
// Card style?           │ Glass rgba(255,255,255,0.06) + border
// Aksen utama?          │ #fbbf24 (emas)
// Hover effect?         │ translateY(-2px) + shadow
// Max blocks/scene?     │ 3 (ideal), 4 (max concept)
// Flow ideal?           │ Hook→Konsep→Contoh→Aktivitas→Quiz→Refleksi
// Animasi max?          │ 250ms ease-out
// Card radius?          │ 12px
// Badge radius?         │ 20px (pill)
// ═══════════════════════════════════════════════════════════════════

export const VISUAL_DNA_QUICK_REF = {
  headingFont: 'Poppins 800',
  bodyFont: 'Open Sans 400-600',
  background: '#0f172a → #1e293b',
  card: 'rgba(255,255,255,0.06) + border',
  primaryAccent: '#fbbf24 (emas)',
  hover: 'translateY(-2px)',
  maxBlocksPerScene: '3 ideal, 4 max',
  idealFlow: 'Hook → Konsep → Contoh → Aktivitas → Quiz → Refleksi',
  maxAnimation: '250ms ease-out',
  cardRadius: '12px',
  badgeRadius: '20px (pill)',
} as const;
