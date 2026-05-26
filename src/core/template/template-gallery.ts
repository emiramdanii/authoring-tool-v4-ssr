// ═══════════════════════════════════════════════════════════════════
// TEMPLATE GALLERY — FROZEN since SILSE v2.1
// ═══════════════════════════════════════════════════════════════════
// ❄️ STATUS: FROZEN — Data di bawah ini TIDAK AKTIF di pipeline utama.
//    Hanya tersedia untuk backward compatibility dan Level 2 fallback.
//
// 🔄 PENGGANTI: Golden Flow — src/core/template/golden/interactive-lesson.ts
//    Filosofi baru: experience → template → system
//    Hanya 1 alur template aktif (hakikat-norma preset).
//
// ⚠️ JANGAN tambahkan template baru di sini.
//    Template baru harus melalui proses: define Visual DNA → build
//    1 golden experience → derive system. Lihat visual-dna.ts.
//
// Original Description:
//   Pre-built lesson templates with mock content. Each template
//   describes a complete SMP lesson that can be instantiated into
//   a full CanvaPage[] using schema generators + createPageFromPreset.
// ═══════════════════════════════════════════════════════════════════

import type { PageTemplateType } from '@/components/canva/types';
import type { CanvaPage } from '@/components/canva/types';
import type { ParseResult } from '@/components/authoring/auto-generate/types';
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';
import {
  genCoverSchema,
  genMateriSchema,
  genKuisSchema,
  genDiskusiSchema,
  genRefleksiSchema,
  genSkenarioSchema,
  genFlashcardSchema,
  genTpSchema,
  genAlurSchema,
  genMotivasiSchema,
  genRangkumanSchema,
  genTujuanDisplaySchema,
  genHasilSchema,
  genPenutupSchema,
  genPetunjukSchema,
} from '@/core/schema/generators';
import { assertDocumentPurity } from '@/core/schema/session-state';
import type { SchemaBlock } from '@/core/schema/types';

// ═══════════════════════════════════════════════════════════════════
// DEEP-CLONE HELPER — Prevent shared references between pages
// ═══════════════════════════════════════════════════════════════════
// When multiple pages use the same template type (e.g. 2x 'materi'),
// schema generators may return blocks that share object references.
// Mutating a block on one page (via canvas editor) would then
// silently corrupt the layout/data of another page.
//
// This helper deep-clones every block so each page owns its own
// independent data — mutations are strictly isolated per page.

function cloneSchemaBlocks(blocks: SchemaBlock[]): SchemaBlock[] {
  return structuredClone(blocks);
}

// ═══════════════════════════════════════════════════════════════════
// LESSON TEMPLATE INTERFACE
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE PATTERN — Re-exported from CourseTemplateRegistry (SINGLE SOURCE OF TRUTH)
// ═══════════════════════════════════════════════════════════════════
// Phase 2b: TemplatePattern + TEMPLATE_PATTERNS now live in
// CourseTemplateRegistry.ts — the ONLY template source of truth.
// This re-export preserves backward compatibility for consumers.

// Import for local use (LessonTemplate.pattern) + re-export for consumers
import type { TemplatePattern } from './CourseTemplateRegistry';
import { TEMPLATE_PATTERNS } from './CourseTemplateRegistry';

export type { TemplatePattern };
export { TEMPLATE_PATTERNS };

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE CUSTOMIZATION — Re-exported from CourseTemplateRegistry (SINGLE SOURCE OF TRUTH)
// ═══════════════════════════════════════════════════════════════════
// Phase 2b: TemplateCustomization interface now lives in
// CourseTemplateRegistry.ts — the ONLY template source of truth.

// Import for local use (getDefaultCustomization return type) + re-export for consumers
import type { TemplateCustomization } from './CourseTemplateRegistry';

export type { TemplateCustomization };

/**
 * Get default customization for a LessonTemplate.
 * Note: CourseTemplateRegistry.getDefaultCustomization() takes CourseTemplate;
 * this wrapper adapts for LessonTemplate's pageTypes field.
 */
export function getDefaultCustomization(template: LessonTemplate): TemplateCustomization {
  return {
    enabledPages: template.pageTypes.map(() => true),
    jumlahKuis: 5,
    variant: 'A',
  };
}

export interface LessonTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  mapel: string;
  kelas: string;
  semester: string;
  icon: string;
  color: string; // tailwind color key (e.g., 'amber', 'emerald', 'sky')
  tags: string[];
  /** Learning flow pattern */
  pattern: TemplatePattern;
  pageTypes: PageTemplateType[];
  estimatedPages: number;
  // Preview content — short descriptions of what each page will contain
  pagePreview: Array<{ type: PageTemplateType; title: string; description: string }>;
  /**
   * Premium preset ID — links to a handcrafted LessonSchema in src/presets/.
   * When set, instantiateTemplate() will load this preset first (Level 1),
   * producing rich, pedagogically-structured content instead of generic
   * generator output.
   *
   * 3-Level Pipeline (same as CourseTemplateRegistry):
   *   Level 1: presetId → handcrafted content (⭐⭐⭐⭐⭐)
   *   Level 2: SUBJECT_MOCK_DATA → generated content (⭐⭐⭐)
   *   Level 3: Empty shell → structural fallback (⭐)
   */
  presetId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// MOCK PARSE RESULT FACTORY
// ═══════════════════════════════════════════════════════════════════
// Creates contextual ParseResult data based on the template's subject.
// This provides realistic definitions, enumerations, etc. so that
// the generators produce meaningful content.

export function createMockParseResult(template: LessonTemplate): ParseResult {
  const subjectData = SUBJECT_MOCK_DATA[template.id] ?? SUBJECT_MOCK_DATA[template.mapel] ?? getDefaultMockData(template);

  return {
    sentences: subjectData.sentences,
    words: subjectData.words,
    topWords: subjectData.topWords,
    wordCount: subjectData.sentences.join(' ').split(/\s+/).length,
    definitions: subjectData.definitions,
    enumerations: subjectData.enumerations,
    functions: subjectData.functions,
    causes: subjectData.causes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SUBJECT-SPECIFIC MOCK DATA
// ═══════════════════════════════════════════════════════════════════

interface MockSubjectData {
  sentences: string[];
  words: string[];
  topWords: string[];
  definitions: { term: string; meaning: string }[];
  enumerations: { subject: string; items: string[] }[];
  functions: { subject: string; desc: string }[];
  causes: { cause: string; effect: string }[];
}

function getDefaultMockData(template: LessonTemplate): MockSubjectData {
  const topic = template.title;
  return {
    sentences: [
      `${topic} merupakan materi penting dalam pembelajaran ${template.mapel}.`,
      `Pemahaman tentang ${topic} membantu peserta didik mengembangkan kemampuan berpikir kritis.`,
    ],
    words: [topic.toLowerCase(), template.mapel.toLowerCase(), 'pembelajaran', 'siswa', 'materi'],
    topWords: [topic.toLowerCase(), template.mapel.toLowerCase(), 'pembelajaran', 'siswa', 'materi'],
    definitions: [
      { term: topic, meaning: `konsep utama dalam pembelajaran ${template.mapel} yang dipelajari di kelas ${template.kelas}` },
    ],
    enumerations: [
      { subject: `Aspek ${topic}`, items: ['Pemahaman konsep', 'Penerapan dalam kehidupan', 'Analisis hubungan'] },
    ],
    functions: [
      { subject: topic, desc: 'membantu peserta didik memahami konsep secara mendalam' },
    ],
    causes: [],
  };
}

const SUBJECT_MOCK_DATA: Record<string, MockSubjectData> = {
  // ── PPKn: Budaya Demokrasi (Kelas 8) ──
  'ppkn-budaya-demokrasi': {
    sentences: [
      'Budaya demokrasi adalah segala hal yang berkaitan dengan penerapan nilai-nilai demokrasi dalam kehidupan sehari-hari.',
      'Demokrasi berasal dari kata demos yang berarti rakyat dan kratos yang berarti pemerintahan.',
      'Prinsip musyawarah merupakan salah satu pilar penting dalam budaya demokrasi di Indonesia.',
    ],
    words: ['demokrasi', 'musyawarah', 'kebebasan', 'persamaan', 'hak', 'kewajiban', 'rakyat', 'pemerintahan'],
    topWords: ['demokrasi', 'musyawarah', 'kebebasan', 'persamaan', 'hak'],
    definitions: [
      { term: 'Budaya demokrasi', meaning: 'segala hal yang berkaitan dengan penerapan nilai-nilai demokrasi dalam kehidupan bermasyarakat dan bernegara' },
      { term: 'Musyawarah', meaning: 'proses diskusi bersama untuk mencapai keputusan yang disepakati bersama' },
      { term: 'Kebebasan berpendapat', meaning: 'hak setiap warga negara untuk menyatakan pendapatnya secara bebas dan bertanggung jawab' },
    ],
    enumerations: [
      { subject: 'Prinsip budaya demokrasi', items: ['Kebebasan berpendapat', 'Persamaan hak', 'Musyawarah mufakat', 'Penghormatan terhadap perbedaan', 'Keadilan sosial'] },
      { subject: 'Contoh budaya demokrasi di sekolah', items: ['Pemilihan ketua kelas secara voting', 'Musyawarah penentuan tata tertib', 'Diskusi kelompok terbuka', 'Menghargai pendapat teman'] },
    ],
    functions: [
      { subject: 'Budaya demokrasi', desc: 'menciptakan kehidupan masyarakat yang damai dan berkeadilan' },
      { subject: 'Musyawarah', desc: 'menjembatani perbedaan pendapat agar tercapai kesepakatan bersama' },
    ],
    causes: [
      { cause: 'Kurangnya budaya musyawarah', effect: 'keputusan yang diambil kurang memihak kepentingan bersama' },
    ],
  },

  // ── PPKn (generic fallback by mapel) ──
  'PPKn': {
    sentences: [
      'Norma adalah aturan atau ketentuan yang mengatur tingkah laku manusia dalam kehidupan bermasyarakat.',
      'Setiap norma memiliki sanksi yang berbeda-beda tergantung jenisnya.',
    ],
    words: ['norma', 'aturan', 'sanksi', 'masyarakat', 'hukum'],
    topWords: ['norma', 'aturan', 'sanksi', 'masyarakat', 'hukum'],
    definitions: [
      { term: 'Norma', meaning: 'aturan atau ketentuan yang mengatur tingkah laku manusia dalam kehidupan bermasyarakat' },
      { term: 'Sanksi', meaning: 'hukuman atau konsekuensi yang diberikan jika melanggar suatu norma' },
    ],
    enumerations: [
      { subject: 'Jenis-jenis norma', items: ['Norma kesopanan', 'Norma kesusilaan', 'Norma hukum', 'Norma agama'] },
    ],
    functions: [
      { subject: 'Norma', desc: 'mengatur tingkah laku manusia agar tertib dan harmonis' },
    ],
    causes: [
      { cause: 'Pelanggaran norma', effect: 'ketidakharmonisan dalam masyarakat' },
    ],
  },

  // ── IPA: Fotosintesis (Kelas 8) ──
  'ipa-fotosintesis': {
    sentences: [
      'Fotosintesis adalah proses pembuatan makanan oleh tumbuhan hijau menggunakan cahaya matahari.',
      'Klorofil pada daun menangkap energi cahaya dan mengubahnya menjadi energi kimia.',
      'Hasil fotosintesis berupa glukosa dan oksigen yang sangat penting bagi kehidupan.',
    ],
    words: ['fotosintesis', 'klorofil', 'glukosa', 'oksigen', 'karbon', 'dioksida', 'cahaya', 'daun'],
    topWords: ['fotosintesis', 'klorofil', 'glukosa', 'oksigen', 'cahaya'],
    definitions: [
      { term: 'Fotosintesis', meaning: 'proses pembuatan makanan (glukosa) oleh tumbuhan hijau menggunakan cahaya matahari, air, dan karbon dioksida' },
      { term: 'Klorofil', meaning: 'pigmen hijau pada daun yang berfungsi menangkap energi cahaya matahari' },
      { term: 'Glukosa', meaning: 'gula sederhana yang dihasilkan dari proses fotosintesis sebagai sumber energi tumbuhan' },
    ],
    enumerations: [
      { subject: 'Faktor yang mempengaruhi fotosintesis', items: ['Intensitas cahaya', 'Konsentrasi CO2', 'Ketersediaan air', 'Suhu lingkungan', 'Luas daun'] },
      { subject: 'Tahapan fotosintesis', items: ['Penyerapan cahaya oleh klorofil', 'Reaksi terang (fotolisis air)', 'Reaksi gelap (siklus Calvin)', 'Pembentukan glukosa'] },
    ],
    functions: [
      { subject: 'Klorofil', desc: 'menangkap energi cahaya matahari untuk proses fotosintesis' },
      { subject: 'Stomata', desc: 'pertukaran gas CO2 dan O2 antara tumbuhan dengan lingkungan' },
    ],
    causes: [
      { cause: 'Kekurangan cahaya matahari', effect: 'proses fotosintesis terhambat dan tumbuhan tidak dapat membuat makanan' },
      { cause: 'Kekurangan air', effect: 'stomata menutup sehingga CO2 tidak masuk dan fotosintesis berkurang' },
    ],
  },

  // ── Matematika: Persamaan Linear (Kelas 8) ──
  'mtk-persamaan-linear': {
    sentences: [
      'Persamaan linear dua variabel (PLDV) adalah persamaan yang memiliki dua variabel dengan pangkat masing-masing variabel adalah satu.',
      'Bentuk umum PLDV adalah ax + by = c, dengan a dan b tidak nol.',
      'Penyelesaian PLDV dapat dilakukan dengan metode substitusi, eliminasi, atau grafik.',
    ],
    words: ['persamaan', 'linear', 'variabel', 'substitusi', 'eliminasi', 'grafik', 'koefisien', 'konstanta'],
    topWords: ['persamaan', 'linear', 'variabel', 'substitusi', 'eliminasi'],
    definitions: [
      { term: 'Persamaan linear dua variabel', meaning: 'persamaan yang memuat dua variabel dengan pangkat masing-masing variabel adalah satu, dalam bentuk ax + by = c' },
      { term: 'Metode substitusi', meaning: 'cara menyelesaikan sistem persamaan linear dengan mengganti salah satu variabel dari suatu persamaan ke persamaan lainnya' },
      { term: 'Metode eliminasi', meaning: 'cara menyelesaikan sistem persamaan linear dengan menghilangkan salah satu variabel' },
    ],
    enumerations: [
      { subject: 'Metode penyelesaian SPLDV', items: ['Metode substitusi', 'Metode eliminasi', 'Metode grafik', 'Metode campuran'] },
      { subject: 'Langkah metode eliminasi', items: ['Samakan koefisien salah satu variabel', 'Jumlahkan atau kurangkan kedua persamaan', 'Selesaikan variabel yang tersisa', 'Substitusi nilai yang diperoleh'] },
    ],
    functions: [
      { subject: 'Metode grafik', desc: 'menunjukkan himpunan penyelesaian sebagai titik potong dua garis pada bidang koordinat' },
    ],
    causes: [],
  },

  // ── Bahasa Indonesia: Teks Deskripsi (Kelas 7) ──
  'bin-teks-deskripsi': {
    sentences: [
      'Teks deskripsi adalah teks yang menggambarkan atau mendeskripsikan suatu objek secara rinci dan jelas.',
      'Teks deskripsi menggunakan panca indera sebagai alat bantu untuk menggambarkan objek.',
      'Struktur teks deskripsi terdiri dari identifikasi dan deskripsi bagian.',
    ],
    words: ['deskripsi', 'teks', 'gambaran', 'panca', 'indera', 'objek', 'identifikasi', 'rinci'],
    topWords: ['deskripsi', 'teks', 'gambaran', 'indera', 'objek'],
    definitions: [
      { term: 'Teks deskripsi', meaning: 'teks yang bertujuan menggambarkan suatu objek, tempat, atau keadaan sehingga pembaca seolah-olah melihat, mendengar, atau merasakan objek tersebut' },
      { term: 'Identifikasi', meaning: 'bagian awal teks deskripsi yang memperkenalkan objek yang akan dideskripsikan' },
      { term: 'Deskripsi bagian', meaning: 'bagian teks yang menggambarkan objek secara rinci sesuai panca indera' },
    ],
    enumerations: [
      { subject: 'Jenis teks deskripsi', items: ['Deskripsi spasial', 'Deskripsi subjektif', 'Deskripsi objektif'] },
      { subject: 'Aspek panca indera dalam deskripsi', items: ['Penglihatan (visual)', 'Pendengaran (auditori)', 'Peraba (taktil)', 'Penciuman (olfaktori)', 'Pengecap (gustatori)'] },
    ],
    functions: [
      { subject: 'Teks deskripsi', desc: 'memperjelas gambaran objek sehingga pembaca dapat membayangkan dengan jelas' },
    ],
    causes: [],
  },

  // ── IPS: Kerajaan Hindu-Buddha (Kelas 7) ──
  'ips-kerajaan-hindu-buddha': {
    sentences: [
      'Kerajaan Hindu-Buddha merupakan kerajaan-kerajaan yang berkembang di Nusantara dengan dipengaruhi agama Hindu dan Buddha dari India.',
      'Kerajaan Kutai merupakan kerajaan Hindu pertama di Nusantara yang dibuktikan dengan prasasti Yupa.',
      'Kerajaan Sriwijaya menjadi pusat pembelajaran Buddha terbesar di Asia Tenggara.',
    ],
    words: ['kerajaan', 'hindu', 'buddha', 'prasasti', 'nusantara', 'sriwijaya', 'majapahit', 'kutai'],
    topWords: ['kerajaan', 'hindu', 'buddha', 'prasasti', 'nusantara'],
    definitions: [
      { term: 'Kerajaan Hindu-Buddha', meaning: 'kerajaan-kerajaan di Nusantara yang menganut dan mengembangkan ajaran Hindu atau Buddha sebagai agama resmi negara' },
      { term: 'Prasasti', meaning: 'tulisan pada batu atau logam yang menjadi bukti sejarah dari suatu kerajaan' },
      { term: 'Sriwijaya', meaning: 'kerajaan maritim Buddha terbesar di Asia Tenggara yang berpusat di Sumatra' },
    ],
    enumerations: [
      { subject: 'Kerajaan Hindu di Nusantara', items: ['Kerajaan Kutai', 'Kerajaan Singasari', 'Kerajaan Majapahit', 'Kerajaan Kediri'] },
      { subject: 'Kerajaan Buddha di Nusantara', items: ['Kerajaan Sriwijaya', 'Kerajaan Mataram Kuno', 'Kerajaan Sailendra'] },
      { subject: 'Bukti peninggalan kerajaan', items: ['Prasasti', 'Candi', 'Kitab', 'Arca dan relief'] },
    ],
    functions: [
      { subject: 'Prasasti', desc: 'memberikan informasi sejarah tentang keberadaan dan kebijakan suatu kerajaan' },
      { subject: 'Candi', desc: 'tempat ibadah dan simbol kekuasaan raja pada masa kerajaan Hindu-Buddha' },
    ],
    causes: [
      { cause: 'Hubungan perdagangan dengan India', effect: 'masuknya pengaruh agama Hindu dan Buddha ke Nusantara' },
    ],
  },

  // ── PPKn: Norma (Kelas 7) ──
  'ppkn-norma': {
    sentences: [
      'Norma adalah aturan atau ketentuan yang mengatur tingkah laku manusia dalam kehidupan bermasyarakat.',
      'Setiap norma memiliki sanksi yang berbeda-beda tergantung jenisnya.',
      'Pelanggaran terhadap norma dapat menimbulkan ketidakharmonisan dalam masyarakat.',
    ],
    words: ['norma', 'aturan', 'sanksi', 'masyarakat', 'hukum', 'kesopanan', 'kesusilaan', 'agama'],
    topWords: ['norma', 'aturan', 'sanksi', 'masyarakat', 'hukum'],
    definitions: [
      { term: 'Norma', meaning: 'aturan atau ketentuan yang mengatur tingkah laku manusia dalam kehidupan bermasyarakat' },
      { term: 'Sanksi', meaning: 'hukuman atau konsekuensi yang diberikan jika melanggar suatu norma' },
      { term: 'Norma kesopanan', meaning: 'norma yang mengatur tingkah laku manusia dalam pergaulan masyarakat' },
    ],
    enumerations: [
      { subject: 'Jenis-jenis norma', items: ['Norma kesopanan', 'Norma kesusilaan', 'Norma hukum', 'Norma agama'] },
    ],
    functions: [
      { subject: 'Norma', desc: 'mengatur tingkah laku manusia agar tertib dan harmonis' },
    ],
    causes: [
      { cause: 'Pelanggaran norma', effect: 'ketidakharmonisan dalam masyarakat' },
    ],
  },

  // ── PPKn VII: Hakikat Norma (Level 2 fallback for modul-ppkn-vii) ──
  'modul-ppkn-vii': {
    sentences: [
      'Norma adalah aturan atau ketentuan yang mengikat warga suatu kelompok masyarakat, dipakai sebagai panduan, tatanan, dan pengendali tingkah laku.',
      'Manusia disebut Zoon Politikon karena selalu hidup berkelompok dan membutuhkan orang lain untuk memenuhi kebutuhannya.',
      'Pelanggaran terhadap norma dapat menimbulkan konflik dan ketidakharmonisan dalam masyarakat.',
    ],
    words: ['norma', 'mengikat', 'panduan', 'tatanan', 'pengendali', 'ketertiban', 'keadilan', 'solidaritas'],
    topWords: ['norma', 'mengikat', 'panduan', 'ketertiban', 'keadilan'],
    definitions: [
      { term: 'Norma', meaning: 'aturan atau ketentuan yang mengikat warga masyarakat, dipakai sebagai panduan, tatanan, dan pengendali tingkah laku yang sesuai dan dapat diterima masyarakat' },
      { term: 'Zoon Politikon', meaning: 'sebutan Aristoteles untuk manusia sebagai makhluk sosial yang selalu hidup berkelompok dan membutuhkan orang lain' },
      { term: 'Fungsi norma', meaning: 'peran norma sebagai pedoman tingkah laku, pencipta ketertiban, pelindung hak, penguat solidaritas, dan penegak keadilan' },
    ],
    enumerations: [
      { subject: 'Sifat norma', items: ['Mengikat', 'Panduan', 'Tatanan', 'Pengendali'] },
      { subject: 'Fungsi norma dalam masyarakat', items: ['Pedoman tingkah laku', 'Menciptakan ketertiban', 'Melindungi hak warga', 'Memperkuat solidaritas', 'Mewujudkan keadilan'] },
      { subject: 'Kebutuhan manusia sebagai makhluk sosial', items: ['Kebutuhan fisik', 'Kebutuhan emosional', 'Kebutuhan pengetahuan', 'Kebutuhan keamanan'] },
    ],
    functions: [
      { subject: 'Norma sebagai pedoman', desc: 'memberi petunjuk tentang cara bertindak yang baik dan benar dalam pergaulan sehari-hari' },
      { subject: 'Norma sebagai ketertiban', desc: 'mencegah kekacauan dan konflik sehingga kehidupan berjalan teratur' },
      { subject: 'Norma sebagai perlindungan hak', desc: 'menjamin setiap anggota masyarakat mendapatkan haknya dan diperlakukan secara adil' },
      { subject: 'Norma sebagai solidaritas', desc: 'mempererat rasa kebersamaan, persatuan, dan kepedulian antaranggota masyarakat' },
      { subject: 'Norma sebagai keadilan', desc: 'memastikan setiap orang diperlakukan setara tanpa diskriminasi' },
    ],
    causes: [
      { cause: 'Pelanggaran norma', effect: 'konflik dan ketidakharmonisan dalam masyarakat' },
      { cause: 'Ketaatan terhadap norma', effect: 'kehidupan yang tertib, adil, aman, dan harmonis' },
    ],
  },

  // ── IPA: Tata Surya (Kelas 9) ──
  'ipa-tata-surya': {
    sentences: [
      'Tata surya adalah sistem tata surya yang terdiri dari matahari sebagai pusat dan planet-planet yang mengorbitnya.',
      'Rotasi bumi menyebabkan terjadinya siang dan malam, sedangkan revolusi bumi menyebabkan pergantian musim.',
      'Matahari adalah bintang terdekat dengan bumi yang menjadi sumber energi utama di tata surya.',
    ],
    words: ['tata surya', 'planet', 'rotasi', 'revolusi', 'matahari', 'bumi', 'orbit', 'gravitasi'],
    topWords: ['tata surya', 'planet', 'rotasi', 'revolusi', 'matahari'],
    definitions: [
      { term: 'Tata surya', meaning: 'sistem yang terdiri dari matahari dan semua benda langit yang mengorbitnya' },
      { term: 'Rotasi', meaning: 'perputaran benda langit pada porosnya' },
      { term: 'Revolusi', meaning: 'perputaran benda langit mengelilingi benda langit lain yang lebih besar' },
    ],
    enumerations: [
      { subject: 'Planet dalam tata surya', items: ['Merkurius', 'Venus', 'Bumi', 'Mars', 'Jupiter', 'Saturnus', 'Uranus', 'Neptunus'] },
      { subject: 'Akibat rotasi bumi', items: ['Pergantian siang dan malam', 'Perbedaan waktu', 'Gerak semu harian matahari'] },
    ],
    functions: [
      { subject: 'Gravitasi matahari', desc: 'menahan planet-planet agar tetap pada orbitnya' },
    ],
    causes: [
      { cause: 'Rotasi bumi', effect: 'terjadinya siang dan malam' },
      { cause: 'Revolusi bumi', effect: 'terjadinya pergantian musim' },
    ],
  },

  // ── MTK: Bangun Ruang (Kelas 8) ──
  'mtk-bangun-ruang': {
    sentences: [
      'Bangun ruang sisi datar adalah bangun ruang yang semua sisinya berbentuk datar.',
      'Kubus memiliki 6 sisi berbentuk persegi yang sama besar, 12 rusuk, dan 8 titik sudut.',
      'Volume balok dapat dihitung dengan rumus panjang kali lebar kali tinggi.',
    ],
    words: ['bangun', 'ruang', 'volume', 'luas', 'permukaan', 'kubus', 'balok', 'prisma', 'limas'],
    topWords: ['bangun', 'ruang', 'volume', 'luas', 'permukaan'],
    definitions: [
      { term: 'Volume', meaning: 'besaran yang menyatakan isi suatu bangun ruang' },
      { term: 'Luas permukaan', meaning: 'jumlah luas seluruh sisi suatu bangun ruang' },
      { term: 'Kubus', meaning: 'bangun ruang sisi datar yang terdiri dari 6 sisi persegi sama besar' },
    ],
    enumerations: [
      { subject: 'Sifat-sifat kubus', items: ['6 sisi persegi sama besar', '12 rusuk sama panjang', '8 titik sudut', '4 diagonal ruang'] },
      { subject: 'Rumus volume', items: ['Kubus: sisi x sisi x sisi', 'Balok: p x l x t', 'Prisma: alas x tinggi', 'Limas: 1/3 x alas x tinggi'] },
    ],
    functions: [],
    causes: [],
  },

  // ── B. Inggris: Descriptive Text (Kelas 8) ──
  'bing-descriptive-text': {
    sentences: [
      'Descriptive text is a text that describes a particular person, place, or thing.',
      'The structure of descriptive text consists of identification and description.',
      'Descriptive text uses simple present tense and adjective to describe the object.',
    ],
    words: ['descriptive', 'text', 'identification', 'description', 'adjective', 'structure', 'describe', 'feature'],
    topWords: ['descriptive', 'text', 'identification', 'description', 'adjective'],
    definitions: [
      { term: 'Descriptive text', meaning: 'teks yang menggambarkan orang, tempat, atau benda secara spesifik' },
      { term: 'Identification', meaning: 'bagian awal yang memperkenalkan objek yang akan dideskripsikan' },
      { term: 'Description', meaning: 'bagian yang berisi penggambaran detail objek' },
    ],
    enumerations: [
      { subject: 'Language features of descriptive text', items: ['Simple present tense', 'Adjectives', 'Relating verbs (is, has)', 'Detailed noun phrases', 'Comparisons'] },
    ],
    functions: [
      { subject: 'Descriptive text', desc: 'memperjelas gambaran objek agar pembaca dapat membayangkannya' },
    ],
    causes: [],
  },

  // ── PJOK: Kebugaran Jasmani (Kelas 8) ──
  'pjok-kebugaran': {
    sentences: [
      'Kebugaran jasmani adalah kemampuan seseorang untuk melakukan pekerjaan sehari-hari secara efisien tanpa merasa kelelahan berlebihan.',
      'Komponen kebugaran jasmani meliputi kekuatan, daya tahan, kelentukan, dan kecepatan.',
      'Latihan kebugaran jasmani harus dilakukan secara rutin dan bertahap untuk mendapatkan hasil yang optimal.',
    ],
    words: ['kebugaran', 'jasmani', 'latihan', 'kekuatan', 'daya tahan', 'kelentukan', 'kecepatan'],
    topWords: ['kebugaran', 'jasmani', 'latihan', 'kekuatan', 'daya tahan'],
    definitions: [
      { term: 'Kebugaran jasmani', meaning: 'kemampuan tubuh untuk melakukan aktivitas tanpa kelelahan berlebihan' },
      { term: 'Daya tahan', meaning: 'kemampuan tubuh untuk melakukan aktivitas dalam waktu lama' },
      { term: 'Kekuatan otot', meaning: 'kemampuan otot untuk menghasilkan tenaga saat berkontraksi' },
    ],
    enumerations: [
      { subject: 'Komponen kebugaran jasmani', items: ['Kekuatan otot', 'Daya tahan kardiovaskular', 'Kelentukan', 'Kecepatan', 'Kelincahan'] },
    ],
    functions: [
      { subject: 'Latihan rutin', desc: 'meningkatkan kemampuan tubuh secara bertahap' },
    ],
    causes: [],
  },

  // ── Seni Budaya: Seni Rupa (Kelas 9) ──
  'seni-seni-rupa': {

    sentences: [
      'Seni rupa adalah cabang seni yang menghasilkan karya yang dapat dilihat dan dirasakan melalui indera penglihatan.',
      'Seni rupa dibedakan menjadi seni rupa dua dimensi dan tiga dimensi.',
      'Unsur-unsur seni rupa meliputi garis, warna, bentuk, ruang, dan tekstur.',
    ],
    words: ['seni', 'rupa', 'garis', 'warna', 'bentuk', 'ruang', 'tekstur', 'dimensi'],
    topWords: ['seni', 'rupa', 'warna', 'bentuk', 'garis'],
    definitions: [
      { term: 'Seni rupa', meaning: 'cabang seni yang berkaitan dengan penciptaan karya visual yang dapat dinikmati melalui indera penglihatan' },
      { term: 'Seni rupa dua dimensi', meaning: 'karya seni rupa yang memiliki panjang dan lebar saja, seperti lukisan dan gambar' },
      { term: 'Seni rupa tiga dimensi', meaning: 'karya seni rupa yang memiliki panjang, lebar, dan kedalaman, seperti patung dan ukiran' },
    ],
    enumerations: [
      { subject: 'Unsur-unsur seni rupa', items: ['Garis', 'Warna', 'Bentuk', 'Ruang', 'Tekstur', 'Gelap terang'] },
      { subject: 'Jenis seni rupa', items: ['Seni lukis', 'Seni patung', 'Seni grafis', 'Seni kriya', 'Seni fotografi'] },
    ],
    functions: [
      { subject: 'Warna dalam seni rupa', desc: 'menciptakan kesan, suasana, dan makna dalam sebuah karya seni' },
    ],
    causes: [],
  },

  // ── IPA: Sistem Peredaran Darah ──
  'ipa-peredaran-darah': {
    sentences: [
      'Sistem peredaran darah adalah sistem transportasi dalam tubuh yang mengangkut oksigen, nutrisi, dan zat sisa.',
      'Jantung adalah organ utama yang memompa darah ke seluruh tubuh.',
      'Peredaran darah besar mengalir dari jantung ke seluruh tubuh dan kembali ke jantung.',
    ],
    words: ['peredaran darah', 'jantung', 'pembuluh', 'arteri', 'vena', 'kapiler', 'darah', 'oksigen'],
    topWords: ['peredaran darah', 'jantung', 'pembuluh', 'darah', 'oksigen'],
    definitions: [
      { term: 'Sistem peredaran darah', meaning: 'sistem yang mengangkut darah dari jantung ke seluruh tubuh dan kembali lagi' },
      { term: 'Jantung', meaning: 'organ berotot yang memompa darah ke seluruh tubuh melalui pembuluh darah' },
      { term: 'Arteri', meaning: 'pembuluh darah yang membawa darah keluar dari jantung' },
    ],
    enumerations: [
      { subject: 'Komponen darah', items: ['Plasma darah', 'Sel darah merah', 'Sel darah putih', 'Keping darah'] },
      { subject: 'Jenis peredaran darah', items: ['Peredaran darah besar', 'Peredaran darah kecil'] },
    ],
    functions: [
      { subject: 'Jantung', desc: 'memompa darah ke seluruh tubuh secara teratur' },
      { subject: 'Hemoglobin', desc: 'mengikat dan mengangkut oksigen dalam darah' },
    ],
    causes: [
      { cause: 'Penyumbatan pembuluh darah', effect: 'serangan jantung atau stroke' },
    ],
  },

  // ── MTK: Bilangan Bulat ──
  'mtk-bilangan-bulat': {
    sentences: [
      'Bilangan bulat adalah himpunan bilangan yang terdiri dari bilangan bulat positif, nol, dan bilangan bulat negatif.',
      'Garis bilangan digunakan untuk menggambarkan letak bilangan bulat secara berurutan.',
      'Operasi hitung bilangan bulat mengikuti aturan tanda yang berlaku.',
    ],
    words: ['bilangan', 'bulat', 'positif', 'negatif', 'nol', 'garis bilangan', 'operasi', 'hitung'],
    topWords: ['bilangan', 'bulat', 'positif', 'negatif', 'hitung'],
    definitions: [
      { term: 'Bilangan bulat', meaning: 'himpunan bilangan yang terdiri dari bilangan bulat negatif, nol, dan bilangan bulat positif' },
      { term: 'Garis bilangan', meaning: 'garis lurus yang digunakan untuk menggambarkan letak bilangan secara berurutan' },
    ],
    enumerations: [
      { subject: 'Jenis bilangan bulat', items: ['Bilangan bulat positif', 'Nol', 'Bilangan bulat negatif'] },
      { subject: 'Operasi hitung bilangan bulat', items: ['Penjumlahan', 'Pengurangan', 'Perkalian', 'Pembagian'] },
    ],
    functions: [],
    causes: [],
  },

  // ── B.Indonesia: Teks Narasi ──
  'bin-teks-narasi': {
    sentences: [
      'Teks narasi adalah teks yang menceritakan suatu peristiwa atau kejadian secara berurutan.',
      'Struktur teks narasi terdiri dari orientasi, komplikasi, dan resolusi.',
      'Teks narasi menggunakan kata hubung waktu untuk menghubungkan peristiwa secara kronologis.',
    ],
    words: ['narasi', 'teks', 'cerita', 'orientasi', 'komplikasi', 'resolusi', 'kronologis', 'peristiwa'],
    topWords: ['narasi', 'teks', 'cerita', 'peristiwa', 'kronologis'],
    definitions: [
      { term: 'Teks narasi', meaning: 'teks yang menceritakan peristiwa atau kejadian secara berurutan berdasarkan urutan waktu' },
      { term: 'Orientasi', meaning: 'bagian awal teks narasi yang memperkenalkan tokoh, latar, dan situasi' },
      { term: 'Komplikasi', meaning: 'bagian yang berisi masalah atau konflik yang dialami tokoh' },
    ],
    enumerations: [
      { subject: 'Struktur teks narasi', items: ['Orientasi', 'Komplikasi', 'Resolusi', 'Koda'] },
      { subject: 'Ciri kebahasaan teks narasi', items: ['Kata hubung waktu', 'Kata kerja material', 'Kata keterangan tempat', 'Kata sifat dan kata keterangan'] },
    ],
    functions: [],
    causes: [],
  },

  // ── IPS: Aktivitas Ekonomi ──
  'ips-aktivitas-ekonomi': {
    sentences: [
      'Aktivitas ekonomi adalah kegiatan yang dilakukan manusia untuk memenuhi kebutuhan hidupnya.',
      'Kegiatan ekonomi meliputi produksi, distribusi, dan konsumsi.',
      'Pelaku ekonomi adalah pihak-pihak yang melakukan kegiatan ekonomi dalam suatu negara.',
    ],
    words: ['ekonomi', 'produksi', 'distribusi', 'konsumsi', 'pelaku', 'rumah tangga', 'perusahaan', 'pemerintah'],
    topWords: ['ekonomi', 'produksi', 'distribusi', 'konsumsi', 'pelaku'],
    definitions: [
      { term: 'Produksi', meaning: 'kegiatan menghasilkan barang atau jasa untuk memenuhi kebutuhan' },
      { term: 'Distribusi', meaning: 'kegiatan menyalurkan barang atau jasa dari produsen ke konsumen' },
      { term: 'Konsumsi', meaning: 'kegiatan menggunakan atau menghabiskan barang atau jasa untuk memenuhi kebutuhan' },
    ],
    enumerations: [
      { subject: 'Jenis pelaku ekonomi', items: ['Rumah tangga', 'Perusahaan', 'Pemerintah', 'Masyarakat luar negeri'] },
      { subject: 'Faktor produksi', items: ['Sumber daya alam', 'Sumber daya manusia', 'Modal', 'Kewirausahaan'] },
    ],
    functions: [
      { subject: 'Distribusi', desc: 'menyalurkan barang dari produsen ke konsumen dengan tepat waktu dan tempat' },
    ],
    causes: [
      { cause: 'Ketidakseimbangan produksi dan konsumsi', effect: 'kelangkaan barang atau penurunan harga' },
    ],
  },

  // ── Informatika: Algoritma Pencarian ──
  'info-algoritma-pencarian': {
    sentences: [
      'Algoritma pencarian adalah metode untuk menemukan data tertentu dalam sekumpulan data.',
      'Linear search memeriksa setiap elemen satu per satu dari awal hingga akhir.',
      'Binary search hanya bekerja pada data yang sudah terurut dan membagi data menjadi dua bagian.',
    ],
    words: ['algoritma', 'pencarian', 'linear', 'binary', 'data', 'terurut', 'kompleksitas', 'efisiensi'],
    topWords: ['algoritma', 'pencarian', 'linear', 'binary', 'data'],
    definitions: [
      { term: 'Linear search', meaning: 'algoritma pencarian yang memeriksa setiap elemen satu per satu dari awal hingga data ditemukan' },
      { term: 'Binary search', meaning: 'algoritma pencarian yang membagi data terurut menjadi dua bagian dan mengeliminasi setengahnya setiap langkah' },
    ],
    enumerations: [
      { subject: 'Langkah linear search', items: ['Mulai dari elemen pertama', 'Bandingkan dengan data yang dicari', 'Jika cocok, kembalikan posisi', 'Jika tidak, lanjut ke elemen berikutnya'] },
      { subject: 'Langkah binary search', items: ['Tentukan titik tengah', 'Bandingkan data tengah dengan target', 'Eliminasi setengah data', 'Ulangi hingga ditemukan'] },
    ],
    functions: [],
    causes: [],
  },
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS — 16 SMP templates
// ═══════════════════════════════════════════════════════════════════

export const LESSON_TEMPLATES: LessonTemplate[] = [
  // ── PPKn: Budaya Demokrasi (Standar) ──
  {
    id: 'ppkn-budaya-demokrasi',
    title: 'Budaya Demokrasi',
    subtitle: 'PPKn Kelas 8 - Semester 1',
    description: 'Memahami prinsip dan penerapan budaya demokrasi dalam kehidupan sehari-hari, termasuk musyawarah dan kebebasan berpendapat.',
    mapel: 'PPKn',
    kelas: '8',
    semester: '1',
    icon: '⚖️',
    color: 'amber',
    tags: ['demokrasi', 'musyawarah', 'kebebasan', 'hak', 'kewajiban'],
    pattern: 'standar',
    presetId: 'demokrasi-pancasila',
    pageTypes: ['cover', 'tujuan', 'motivasi', 'materi', 'diskusi', 'kuis', 'refleksi', 'rangkuman', 'penutup'],
    estimatedPages: 9,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Budaya Demokrasi, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: '4 tujuan bertahap dari menyebutkan hingga menganalisis' },
      { type: 'motivasi', title: 'Motivasi / Apersepsi', description: 'Pertanyaan pemantik tentang demokrasi' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Definisi, prinsip, dan contoh budaya demokrasi' },
      { type: 'diskusi', title: 'Diskusi Kelompok', description: 'Pertanyaan reflektif tentang demokrasi di sekolah' },
      { type: 'kuis', title: 'Kuis Pilihan Ganda', description: '5 soal tentang budaya demokrasi' },
      { type: 'refleksi', title: 'Refleksi Diri', description: 'Hal baru yang dipelajari dan komitmen penerapan' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: definisi, prinsip, dan penerapan' },
      { type: 'penutup', title: 'Penutup', description: 'Ringkasan dan tindak lanjut' },
    ],
  },

  // ── PPKn: Norma (Interaktif) ──
  {
    id: 'ppkn-norma',
    title: 'Norma dalam Kehidupan',
    subtitle: 'PPKn Kelas 7 - Semester 1',
    description: 'Mengenal berbagai norma (kesopanan, kesusilaan, hukum, agama) dan perannya dalam mengatur kehidupan bermasyarakat.',
    mapel: 'PPKn',
    kelas: '7',
    semester: '1',
    icon: '📜',
    color: 'amber',
    tags: ['norma', 'aturan', 'sanksi', 'masyarakat', 'hukum'],
    pattern: 'interaktif',
    presetId: 'norma-golden',
    pageTypes: ['cover', 'petunjuk', 'tujuan', 'motivasi', 'skenario', 'materi', 'materi', 'materi', 'diskusi', 'kuis', 'kuis', 'kuis', 'kuis', 'kuis', 'refleksi', 'rangkuman', 'penutup'],
    estimatedPages: 17,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul Macam-Macam Norma, kelas, dan mapel' },
      { type: 'petunjuk', title: 'Petunjuk', description: 'Petunjuk penggunaan media pembelajaran' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: '4 tujuan bertahap tentang norma' },
      { type: 'motivasi', title: 'Motivasi / Apersepsi', description: 'Pertanyaan pemantik tentang norma sehari-hari' },
      { type: 'skenario', title: 'Skenario Interaktif', description: 'Memilih tindakan berdasarkan norma yang berlaku' },
      { type: 'materi', title: 'Materi 1: Pengertian Norma', description: 'Definisi norma dan sifat-sifatnya' },
      { type: 'materi', title: 'Materi 2: 4 Jenis Norma', description: 'Norma agama, kesusilaan, kesopanan, hukum' },
      { type: 'materi', title: 'Materi 3: Sumber & Sanksi', description: 'Perbedaan sumber dan sanksi tiap norma' },
      { type: 'diskusi', title: 'Diskusi', description: 'Diskusi norma internal vs eksternal' },
      { type: 'kuis', title: 'Kuis 1/5', description: 'Sanksi norma agama' },
      { type: 'kuis', title: 'Kuis 2/5', description: 'Contoh norma kesusilaan' },
      { type: 'kuis', title: 'Kuis 3/5', description: 'Pelanggaran norma hukum' },
      { type: 'kuis', title: 'Kuis 4/5', description: 'Ciri norma kesopanan' },
      { type: 'kuis', title: 'Kuis 5/5', description: 'Bukan ciri norma hukum' },
      { type: 'refleksi', title: 'Refleksi', description: 'Refleksi dan komitmen penerapan norma' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: 4 jenis norma dan perbedaannya' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan ringkasan pertemuan' },
    ],
  },

  // ── IPA: Fotosintesis (Eksperimen) ──
  {
    id: 'ipa-fotosintesis',
    title: 'Fotosintesis',
    subtitle: 'IPA Kelas 8 - Semester 1',
    description: 'Mempelajari proses fotosintesis, faktor-faktor yang mempengaruhinya, dan perannya bagi kehidupan di bumi.',
    mapel: 'IPA',
    kelas: '8',
    semester: '1',
    icon: '🔬',
    color: 'emerald',
    tags: ['fotosintesis', 'klorofil', 'glukosa', 'oksigen', 'tumbuhan'],
    pattern: 'eksperimen',
    pageTypes: ['cover', 'tujuan', 'skenario', 'materi', 'diskusi', 'kuis', 'rangkuman', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Fotosintesis, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menjelaskan proses fotosintesis dan faktor-faktornya' },
      { type: 'skenario', title: 'Skenario Ilmiah', description: 'Cerita interaktif tentang proses fotosintesis' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Definisi, tahapan, dan faktor fotosintesis' },
      { type: 'diskusi', title: 'Praktikum / Diskusi', description: 'Mengamati pengaruh cahaya terhadap tumbuhan' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang proses fotosintesis' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: klorofil, reaksi terang & gelap' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tindak lanjut' },
    ],
  },

  // ── IPA: Sistem Tata Surya (Eksperimen) ──
  {
    id: 'ipa-tata-surya',
    title: 'Sistem Tata Surya',
    subtitle: 'IPA Kelas 9 - Semester 1',
    description: 'Mempelajari anggota tata surya, rotasi dan revolusi bumi, serta pengaruhnya terhadap kehidupan.',
    mapel: 'IPA',
    kelas: '9',
    semester: '1',
    icon: '🪐',
    color: 'emerald',
    tags: ['tata surya', 'planet', 'rotasi', 'revolusi', 'matahari', 'bumi'],
    pattern: 'eksperimen',
    pageTypes: ['cover', 'tujuan', 'skenario', 'materi', 'diskusi', 'kuis', 'rangkuman', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Tata Surya, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menjelaskan anggota dan mekanisme tata surya' },
      { type: 'skenario', title: 'Skenario Antariksa', description: 'Petualangan menjelajahi tata surya' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Planet, rotasi, revolusi, dan fenomena alam' },
      { type: 'diskusi', title: 'Diskusi', description: 'Apa yang terjadi jika bumi tidak berotasi?' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang tata surya' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: rotasi, revolusi, planet' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tugas observasi' },
    ],
  },

  // ── MTK: Persamaan Linear (Standar) ──
  {
    id: 'mtk-persamaan-linear',
    title: 'Persamaan Linear',
    subtitle: 'Matematika Kelas 8 - Semester 1',
    description: 'Mempelajari sistem persamaan linear dua variabel (SPLDV) dan metode penyelesaiannya: substitusi, eliminasi, dan grafik.',
    mapel: 'MTK',
    kelas: '8',
    semester: '1',
    icon: '📐',
    color: 'sky',
    tags: ['persamaan', 'linear', 'variabel', 'substitusi', 'eliminasi', 'grafik'],
    pattern: 'standar',
    pageTypes: ['cover', 'tujuan', 'materi', 'diskusi', 'kuis', 'refleksi', 'penutup'],
    estimatedPages: 7,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi SPLDV, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menyelesaikan SPLDV dengan berbagai metode' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Bentuk umum, metode substitusi, eliminasi, dan grafik' },
      { type: 'diskusi', title: 'Diskusi Kelompok', description: 'Membahas soal SPLDV dalam kehidupan sehari-hari' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang SPLDV' },
      { type: 'refleksi', title: 'Refleksi', description: 'Metode mana yang paling mudah dipahami?' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tindak lanjut' },
    ],
  },

  // ── MTK: Bangun Ruang (Mini) ──
  {
    id: 'mtk-bangun-ruang',
    title: 'Bangun Ruang Sisi Datar',
    subtitle: 'Matematika Kelas 8 - Semester 2',
    description: 'Menghitung luas permukaan dan volume kubus, balok, prisma, dan limas — pertemuan singkat dengan fokus latihan soal.',
    mapel: 'MTK',
    kelas: '8',
    semester: '2',
    icon: '📦',
    color: 'sky',
    tags: ['bangun', 'ruang', 'volume', 'luas', 'kubus', 'balok'],
    pattern: 'mini',
    pageTypes: ['cover', 'materi', 'kuis', 'penutup'],
    estimatedPages: 4,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Bangun Ruang, kelas, dan mapel' },
      { type: 'materi', title: 'Materi Inti', description: 'Rumus luas permukaan dan volume bangun ruang' },
      { type: 'kuis', title: 'Latihan Soal', description: '5 soal hitung volume dan luas permukaan' },
      { type: 'penutup', title: 'Penutup', description: 'Ringkasan rumus dan tugas latihan' },
    ],
  },

  // ── B. Indonesia: Teks Deskripsi (Standar) ──
  {
    id: 'bin-teks-deskripsi',
    title: 'Teks Deskripsi',
    subtitle: 'B. Indonesia Kelas 7 - Semester 1',
    description: 'Mengenal struktur dan ciri kebahasaan teks deskripsi, serta praktik menulis teks deskripsi yang baik.',
    mapel: 'B.Indonesia',
    kelas: '7',
    semester: '1',
    icon: '📖',
    color: 'orange',
    tags: ['deskripsi', 'teks', 'panca indera', 'identifikasi', 'menulis'],
    pattern: 'standar',
    pageTypes: ['cover', 'tujuan', 'motivasi', 'materi', 'diskusi', 'kuis', 'refleksi', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Teks Deskripsi, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Mengidentifikasi struktur dan menulis teks deskripsi' },
      { type: 'motivasi', title: 'Motivasi', description: 'Pertanyaan pemantik tentang menggambarkan objek' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Struktur, jenis, dan ciri kebahasaan teks deskripsi' },
      { type: 'diskusi', title: 'Diskusi', description: 'Menganalisis contoh teks deskripsi bersama kelompok' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang teks deskripsi' },
      { type: 'refleksi', title: 'Refleksi', description: 'Menulis teks deskripsi tentang objek favorit' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tugas menulis' },
    ],
  },

  // ── B. Inggris: Descriptive Text (Standar) ──
  {
    id: 'bing-descriptive-text',
    title: 'Descriptive Text',
    subtitle: 'B. Inggris Kelas 8 - Semester 1',
    description: 'Mempelajari struktur descriptive text (identification + description) dan practice menulis descriptive text dalam Bahasa Inggris.',
    mapel: 'B.Inggris',
    kelas: '8',
    semester: '1',
    icon: '🌍',
    color: 'purple',
    tags: ['descriptive', 'text', 'english', 'writing', 'identification', 'description'],
    pattern: 'standar',
    pageTypes: ['cover', 'tujuan', 'motivasi', 'materi', 'diskusi', 'kuis', 'refleksi', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Descriptive Text — English Class' },
      { type: 'tujuan', title: 'Learning Objectives', description: 'Identify structure and write descriptive text' },
      { type: 'motivasi', title: 'Motivasi', description: 'Pertanyaan pemantik tentang mendeskripsikan benda' },
      { type: 'materi', title: 'Materi', description: 'Structure, language features, and examples' },
      { type: 'diskusi', title: 'Diskusi', description: 'Analyze descriptive text examples in groups' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang descriptive text' },
      { type: 'refleksi', title: 'Refleksi', description: 'Write a descriptive text about your favorite place' },
      { type: 'penutup', title: 'Penutup', description: 'Summary and writing assignment' },
    ],
  },

  // ── IPS: Kerajaan Hindu-Buddha (Interaktif) ──
  {
    id: 'ips-kerajaan-hindu-buddha',
    title: 'Kerajaan Hindu-Buddha',
    subtitle: 'IPS Kelas 7 - Semester 1',
    description: 'Mempelajari sejarah kerajaan Hindu-Buddha di Nusantara, peninggalannya, dan pengaruhnya terhadap kebudayaan Indonesia.',
    mapel: 'IPS',
    kelas: '7',
    semester: '1',
    icon: '🏛️',
    color: 'violet',
    tags: ['kerajaan', 'hindu', 'buddha', 'prasasti', 'nusantara', 'sejarah'],
    pattern: 'interaktif',
    pageTypes: ['cover', 'tujuan', 'skenario', 'materi', 'kuis', 'diskusi', 'rangkuman', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Kerajaan Hindu-Buddha, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menjelaskan sejarah dan peninggalan kerajaan Hindu-Buddha' },
      { type: 'skenario', title: 'Skenario Sejarah', description: 'Menjelajahi kerajaan masa lalu melalui cerita interaktif' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Kerajaan Kutai, Sriwijaya, Majapahit, dan peninggalannya' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang kerajaan Hindu-Buddha' },
      { type: 'diskusi', title: 'Diskusi', description: 'Mengapa peninggalan sejarah perlu dilestarikan?' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: kerajaan, prasasti, candi' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tugas investigasi' },
    ],
  },

  // ── PJOK: Kebugaran Jasmani (Mini) ──
  {
    id: 'pjok-kebugaran',
    title: 'Kebugaran Jasmani',
    subtitle: 'PJOK Kelas 8 - Semester 1',
    description: 'Mengenal komponen kebugaran jasmani dan latihan dasar yang dapat dilakukan secara mandiri — pertemuan singkat.',
    mapel: 'PJOK',
    kelas: '8',
    semester: '1',
    icon: '⚽',
    color: 'cyan',
    tags: ['kebugaran', 'jasmani', 'olahraga', 'latihan', 'kesehatan'],
    pattern: 'mini',
    pageTypes: ['cover', 'materi', 'kuis', 'penutup'],
    estimatedPages: 4,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Kebugaran Jasmani, kelas, dan mapel' },
      { type: 'materi', title: 'Materi Inti', description: 'Komponen kebugaran dan contoh latihan' },
      { type: 'kuis', title: 'Kuis Cepat', description: '3 soal tentang kebugaran jasmani' },
      { type: 'penutup', title: 'Penutup', description: 'Tugas latihan di rumah' },
    ],
  },

  // ── Seni Budaya: Seni Rupa (Standar) ──
  {
    id: 'seni-seni-rupa',
    title: 'Seni Rupa',
    subtitle: 'Seni Budaya Kelas 9 - Semester 1',
    description: 'Memahami unsur-unsur seni rupa dan berlatih menciptakan karya seni rupa dua dan tiga dimensi.',
    mapel: 'Seni',
    kelas: '9',
    semester: '1',
    icon: '🎨',
    color: 'pink',
    tags: ['seni', 'rupa', 'warna', 'garis', 'bentuk', 'dimensi'],
    pattern: 'standar',
    pageTypes: ['cover', 'tujuan', 'materi', 'diskusi', 'kuis', 'refleksi', 'penutup'],
    estimatedPages: 7,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Seni Rupa, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Mengidentifikasi unsur dan membuat karya seni rupa' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Unsur-unsur seni rupa: garis, warna, bentuk, ruang, tekstur' },
      { type: 'diskusi', title: 'Diskusi', description: 'Menganalisis karya seni rupa berdasarkan unsurnya' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang unsur-unsur seni rupa' },
      { type: 'refleksi', title: 'Refleksi', description: 'Membuat karya seni rupa sederhana' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tugas berkarya' },
    ],
  },

  // ── IPA: Sistem Peredaran Darah (Eksperimen) ──
  {
    id: 'ipa-peredaran-darah',
    title: 'Sistem Peredaran Darah',
    subtitle: 'IPA Kelas 8 - Semester 2',
    description: 'Mempelajari organ-organ sistem peredaran darah manusia, jenis peredaran darah, dan gangguan kesehatan yang terkait.',
    mapel: 'IPA',
    kelas: '8',
    semester: '2',
    icon: '🫀',
    color: 'emerald',
    tags: ['peredaran darah', 'jantung', 'pembuluh', 'darah', 'organ'],
    pattern: 'eksperimen',
    pageTypes: ['cover', 'tujuan', 'skenario', 'materi', 'diskusi', 'kuis', 'rangkuman', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Sistem Peredaran Darah' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menjelaskan organ dan mekanisme peredaran darah' },
      { type: 'skenario', title: 'Skenario Ilmiah', description: 'Menelusuri aliran darah dalam tubuh' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Organ, pembuluh darah, dan mekanisme peredaran darah' },
      { type: 'diskusi', title: 'Diskusi', description: 'Apa yang terjadi jika jantung berhenti berdetak?' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang sistem peredaran darah' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: jantung, pembuluh, peredaran besar & kecil' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tugas pengamatan' },
    ],
  },

  // ── MTK: Bilangan Bulat (Standar) ──
  {
    id: 'mtk-bilangan-bulat',
    title: 'Bilangan Bulat',
    subtitle: 'Matematika Kelas 7 - Semester 1',
    description: 'Mengenal bilangan bulat, operasi hitung (penjumlahan, pengurangan, perkalian, pembagian), dan penerapannya dalam kehidupan sehari-hari.',
    mapel: 'MTK',
    kelas: '7',
    semester: '1',
    icon: '🔢',
    color: 'sky',
    tags: ['bilangan', 'bulat', 'operasi', 'hitung', 'negatif', 'positif'],
    pattern: 'standar',
    pageTypes: ['cover', 'tujuan', 'motivasi', 'materi', 'diskusi', 'kuis', 'refleksi', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Bilangan Bulat' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Mengenal dan mengoperasikan bilangan bulat' },
      { type: 'motivasi', title: 'Motivasi', description: 'Mengapa ada bilangan negatif?' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Definisi, garis bilangan, dan operasi hitung' },
      { type: 'diskusi', title: 'Diskusi', description: 'Penerapan bilangan bulat dalam kehidupan' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang bilangan bulat' },
      { type: 'refleksi', title: 'Refleksi', description: 'Kesulitan dalam operasi bilangan bulat' },
      { type: 'penutup', title: 'Penutup', description: 'Ringkasan dan latihan tambahan' },
    ],
  },

  // ── B.Indonesia: Teks Narasi (Interaktif) ──
  {
    id: 'bin-teks-narasi',
    title: 'Teks Narasi',
    subtitle: 'B. Indonesia Kelas 8 - Semester 2',
    description: 'Mengenal struktur dan ciri kebahasaan teks narasi, serta praktik menulis teks narasi yang menarik dan runtut.',
    mapel: 'B.Indonesia',
    kelas: '8',
    semester: '2',
    icon: '✍️',
    color: 'orange',
    tags: ['narasi', 'teks', 'cerita', 'menulis', 'struktur'],
    pattern: 'interaktif',
    pageTypes: ['cover', 'tujuan', 'skenario', 'materi', 'diskusi', 'kuis', 'refleksi', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Teks Narasi' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menganalisis dan menulis teks narasi' },
      { type: 'skenario', title: 'Skenario Kreatif', description: 'Menulis akhir cerita yang berbeda' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Struktur, jenis, dan ciri kebahasaan teks narasi' },
      { type: 'diskusi', title: 'Diskusi', description: 'Menganalisis cerita pendek bersama kelompok' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang teks narasi' },
      { type: 'refleksi', title: 'Refleksi', description: 'Menulis teks narasi berdasarkan pengalaman' },
      { type: 'penutup', title: 'Penutup', description: 'Tugas menulis narasi kreatif' },
    ],
  },

  // ── IPS: Aktivitas Ekonomi (Standar) ──
  {
    id: 'ips-aktivitas-ekonomi',
    title: 'Aktivitas Ekonomi',
    subtitle: 'IPS Kelas 8 - Semester 1',
    description: 'Mempelajari kegiatan ekonomi (produksi, distribusi, konsumsi), pelaku ekonomi, dan peran mereka dalam perekonomian Indonesia.',
    mapel: 'IPS',
    kelas: '8',
    semester: '1',
    icon: '💰',
    color: 'violet',
    tags: ['ekonomi', 'produksi', 'distribusi', 'konsumsi', 'pelaku ekonomi'],
    pattern: 'standar',
    pageTypes: ['cover', 'tujuan', 'motivasi', 'materi', 'diskusi', 'kuis', 'rangkuman', 'penutup'],
    estimatedPages: 8,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Aktivitas Ekonomi' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menjelaskan kegiatan dan pelaku ekonomi' },
      { type: 'motivasi', title: 'Motivasi', description: 'Apa yang kamu lakukan saat membeli makanan?' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Produksi, distribusi, konsumsi, dan pelaku ekonomi' },
      { type: 'diskusi', title: 'Diskusi', description: 'Pelaku ekonomi di lingkungan sekitar' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang aktivitas ekonomi' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: produksi, distribusi, konsumsi' },
      { type: 'penutup', title: 'Penutup', description: 'Tugas observasi aktivitas ekonomi' },
    ],
  },

  // ── Informatika: Algoritma Pencarian (Mini) ──
  {
    id: 'info-algoritma-pencarian',
    title: 'Algoritma Pencarian',
    subtitle: 'Informatika Kelas 9 - Semester 1',
    description: 'Mengenal algoritma pencarian linear dan binary, memahami langkah-langkahnya, dan membandingkan efisiensinya — pertemuan singkat.',
    mapel: 'Informatika',
    kelas: '9',
    semester: '1',
    icon: '🔍',
    color: 'sky',
    tags: ['algoritma', 'pencarian', 'linear', 'binary', 'komputasi'],
    pattern: 'mini',
    pageTypes: ['cover', 'materi', 'kuis', 'penutup'],
    estimatedPages: 4,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Algoritma Pencarian' },
      { type: 'materi', title: 'Materi Inti', description: 'Linear search dan binary search' },
      { type: 'kuis', title: 'Kuis Cepat', description: '3 soal tentang algoritma pencarian' },
      { type: 'penutup', title: 'Penutup', description: 'Latihan implementasi sederhana' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// LOOKUP HELPERS
// ═══════════════════════════════════════════════════════════════════

const _templateMap = new Map<string, LessonTemplate>();
for (const t of LESSON_TEMPLATES) {
  _templateMap.set(t.id, t);
}

export function getLessonTemplate(id: string): LessonTemplate | undefined {
  return _templateMap.get(id);
}

export function getAllLessonTemplates(): LessonTemplate[] {
  return [...LESSON_TEMPLATES];
}

export function getLessonTemplatesByMapel(mapel: string): LessonTemplate[] {
  return LESSON_TEMPLATES.filter(t => t.mapel === mapel);
}

/** Get unique mapel values from all templates */
export function getTemplateMapelList(): string[] {
  const set = new Set(LESSON_TEMPLATES.map(t => t.mapel));
  return Array.from(set);
}

/** Get templates filtered by pattern */
export function getLessonTemplatesByPattern(pattern: TemplatePattern): LessonTemplate[] {
  return LESSON_TEMPLATES.filter(t => t.pattern === pattern);
}

/** Get unique pattern values from all templates */
export function getTemplatePatternList(): TemplatePattern[] {
  const set = new Set(LESSON_TEMPLATES.map(t => t.pattern));
  return Array.from(set);
}

// ═══════════════════════════════════════════════════════════════════
// INSTANTIATE TEMPLATE — Generate full CanvaPage[] from a template
// ═══════════════════════════════════════════════════════════════════
// This is the main entry point. Given a LessonTemplate:
//   1. Creates a mock ParseResult with contextual content
//   2. Uses schema generators to produce real SchemaBlock[] content
//   3. Creates CanvaPage objects via createPageFromPreset
//   4. Populates each page's schema with generated blocks

export function instantiateTemplate(template: LessonTemplate): CanvaPage[] {
  const parsed = createMockParseResult(template);
  const meta = {
    namaBab: template.title,
    kelas: template.kelas,
    mapel: template.mapel,
    durasi: '2 x 40 menit',
    ikon: template.icon,
    judulPertemuan: template.title,
  };
  const opts = { pertemuan: 1, bloomMax: 6, jumlahKuis: 5 };
  const pages: CanvaPage[] = [];
  let pageIndex = 0;

  for (const pageType of template.pageTypes) {
    const page = createPageFromPreset(pageType, pageIndex);

    if (page.schema) {
      const blocks = generateBlocksForPageType(pageType, parsed, meta, opts, 'A');
      if (blocks.length > 0) {
        // Deep-clone to prevent shared references between pages.
        // Without this, editing a block on one page mutates the
        // same object on another page (e.g. 2 materi pages).
        page.schema.blocks = cloneSchemaBlocks(blocks);
      }
    }

    pages.push(page);
    pageIndex++;
  }

  // Dev-mode purity guard
  if (process.env.NODE_ENV !== 'production') {
    for (const p of pages) {
      if (p.schema) {
        assertDocumentPurity(p.schema, `template-gallery page=${p.id}`);
      }
    }
  }

  return pages;
}

// ═══════════════════════════════════════════════════════════════════
// INSTANTIATE TEMPLATE WITH CONFIG — Customization support
// ═══════════════════════════════════════════════════════════════════
// Like instantiateTemplate(), but respects TemplateCustomization:
//   - enabledPages[] — toggle individual pages on/off
//   - jumlahKuis — override number of quiz questions
//   - variant — set preferred variant for all pages
//   - guru / sekolah — inject teacher info into cover

export function instantiateTemplateWithConfig(
  template: LessonTemplate,
  config: TemplateCustomization,
): CanvaPage[] {
  const parsed = createMockParseResult(template);
  const meta = {
    namaBab: template.title,
    kelas: template.kelas,
    mapel: template.mapel,
    durasi: '2 x 40 menit',
    ikon: template.icon,
    judulPertemuan: template.title,
    ...(config.guru ? { guru: config.guru } : {}),
    ...(config.sekolah ? { sekolah: config.sekolah } : {}),
  };
  const opts = { pertemuan: 1, bloomMax: 6, jumlahKuis: config.jumlahKuis };
  const pages: CanvaPage[] = [];
  let pageIndex = 0;

  for (let i = 0; i < template.pageTypes.length; i++) {
    // Skip disabled pages
    if (!config.enabledPages[i]) continue;

    const pageType = template.pageTypes[i];
    const page = createPageFromPreset!(pageType, pageIndex);

    // Set variant on page AND propagate to blocks
    const variant = config.variant || 'A';
    if (page.schema) {
      page.templateVariant = variant;
    }

    if (page.schema) {
      const blocks = generateBlocksForPageType!(pageType, parsed, meta, opts, variant);
      if (blocks.length > 0) {
        // Deep-clone to prevent shared references between pages.
        // Without this, editing a block on one page mutates the
        // same object on another page (e.g. 2 materi pages).
        page.schema.blocks = cloneSchemaBlocks(blocks);
      }
    }

    // Inject teacher info into cover block
    if (pageType === 'cover' && page.schema?.blocks && (config.guru || config.sekolah)) {
      for (const block of page.schema.blocks) {
        if (block.type === 'cover') {
          const cover = block as unknown as Record<string, unknown>;
          const coverMeta = (cover.meta as Record<string, string>) || {};
          if (config.guru) coverMeta.elemen = config.guru;
          if (config.sekolah) coverMeta.fase = config.sekolah;
          cover.meta = coverMeta;
        }
      }
    }

    // Set label from pagePreview if available
    if (template.pagePreview[i]) {
      page.label = template.pagePreview[i]!.title;
    }

    pages.push(page);
    pageIndex++;
  }

  // Dev-mode purity guard
  if (process.env.NODE_ENV !== 'production') {
    for (const p of pages) {
      if (p.schema) {
        assertDocumentPurity(p.schema, `template-gallery-config page=${p.id}`);
      }
    }
  }

  return pages;
}

// ═══════════════════════════════════════════════════════════════════
// INSERT TEMPLATE PAGES — Merge mode: add pages to existing project
// ═══════════════════════════════════════════════════════════════════
// Instead of replacing all pages (instantiateTemplate), this function
// creates new pages from a template and returns them for appending
// to an existing project. This is the "merge" flow:
//
//   1. Teacher has an existing project with some pages
//   2. Teacher picks a template and clicks "Tambahkan ke Project"
//   3. New pages from the template are appended after existing pages
//   4. Existing pages remain untouched
//
// The function also supports partial insertion (only enabled pages).

export interface InsertTemplateResult {
  /** New pages created from the template */
  newPages: CanvaPage[];
  /** Total pages after insertion (for display) */
  totalAfterInsert: number;
}

export function insertTemplatePages(
  template: LessonTemplate,
  existingPageCount: number,
  config?: TemplateCustomization,
): InsertTemplateResult {
  const effectiveConfig = config ?? getDefaultCustomization(template);
  const newPages = instantiateTemplateWithConfig(template, effectiveConfig);

  return {
    newPages,
    totalAfterInsert: existingPageCount + newPages.length,
  };
}

// ── Internal: Generate blocks for a specific page type ──────────

function generateBlocksForPageType(
  pageType: PageTemplateType,
  parsed: ParseResult,
  meta: { namaBab: string; kelas: string; mapel: string; durasi: string; ikon: string; judulPertemuan: string },
  opts: { pertemuan: number; bloomMax: number; jumlahKuis: number },
  variant: import('@/core/schema/types/base').BlockVariant = 'A',
): import('@/core/schema/types').SchemaBlock[] {
  /**
   * Apply variant + layout to generated blocks.
   * Cover/hero blocks get `layout: { position: 'absolute' }` so
   * SceneLayoutEngine uses Phase 2 (intentional absolute) instead of
   * Phase 3 (legacy fallback). Flow blocks keep default (no layout
   * → position='flow').
   */
  const FULL_PAGE_TYPES = new Set(['cover', 'hasil', 'penutup']);
  const applyVariantAndLayout = (blocks: import('@/core/schema/types').SchemaBlock[]): import('@/core/schema/types').SchemaBlock[] => {
    return blocks.map(block => {
      const updated = { ...block, variant };
      // Full-page blocks (cover, hasil, penutup) need absolute positioning
      if (FULL_PAGE_TYPES.has(block.type)) {
        updated.layout = { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' };
      }
      return updated;
    });
  };

  let blocks: import('@/core/schema/types').SchemaBlock[];
  switch (pageType) {
    case 'cover':
      blocks = [genCoverSchema(meta)];
      break;

    case 'tujuan':
      blocks = [genTujuanDisplaySchema(parsed, opts)];
      break;

    case 'motivasi':
      blocks = [genMotivasiSchema(parsed, meta)];
      break;

    case 'materi':
      blocks = genMateriSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
      break;

    case 'skenario':
      blocks = [genSkenarioSchema(parsed, meta)];
      break;

    case 'kuis':
      blocks = [genKuisSchema(parsed, opts.jumlahKuis, opts.pertemuan)];
      break;

    case 'diskusi':
      blocks = [genDiskusiSchema(parsed, [], { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab })];
      break;

    case 'refleksi':
      blocks = [genRefleksiSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab })];
      break;

    case 'rangkuman':
      blocks = [genRangkumanSchema(parsed, meta)];
      break;

    case 'hasil':
      blocks = [genHasilSchema()];
      break;

    case 'penutup':
      blocks = [genPenutupSchema(meta)];
      break;

    case 'petunjuk':
      blocks = [genPetunjukSchema([
        { icon: '📖', judul: 'Baca Materi', isi: 'Pelajari materi yang disajikan di setiap halaman' },
        { icon: '✍️', judul: 'Kerjakan Latihan', isi: 'Jawab pertanyaan dan kerjakan kuis yang tersedia' },
        { icon: '🤔', judul: 'Refleksi', isi: 'Renungkan apa yang sudah dipelajari' },
      ])];
      break;

    case 'dokumen':
      blocks = [genTpSchema(parsed, opts), genAlurSchema(parsed, opts, meta)];
      break;

    default:
      blocks = [];
  }

  return applyVariantAndLayout(blocks);
}
