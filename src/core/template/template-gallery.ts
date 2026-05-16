// ═══════════════════════════════════════════════════════════════════
// TEMPLATE GALLERY — Pre-built lesson templates with mock content
// ═══════════════════════════════════════════════════════════════════
// Each template describes a complete SMP lesson that can be
// instantiated into a full CanvaPage[] with real content using
// the existing schema generators (genCoverSchema, genMateriSchema,
// etc.) and createPageFromPreset.
//
// Design Principles:
//   1. Templates are DATA, not code — just metadata + mock ParseResult
//   2. instantiateTemplate() uses existing generators — no duplication
//   3. Mock ParseResult provides contextual content per subject
//   4. Schema-first: SchemaBlock[] is the single source of truth
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

// ═══════════════════════════════════════════════════════════════════
// LESSON TEMPLATE INTERFACE
// ═══════════════════════════════════════════════════════════════════

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
  pageTypes: PageTemplateType[];
  estimatedPages: number;
  // Preview content — short descriptions of what each page will contain
  pagePreview: Array<{ type: PageTemplateType; title: string; description: string }>;
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
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS — 6 SMP templates
// ═══════════════════════════════════════════════════════════════════

export const LESSON_TEMPLATES: LessonTemplate[] = [
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
    pageTypes: ['cover', 'tujuan', 'skenario', 'materi', 'kuis', 'rangkuman', 'penutup'],
    estimatedPages: 7,
    pagePreview: [
      { type: 'cover', title: 'Sampul', description: 'Judul materi Fotosintesis, kelas, dan mapel' },
      { type: 'tujuan', title: 'Tujuan Pembelajaran', description: 'Menjelaskan proses fotosintesis dan faktor-faktornya' },
      { type: 'skenario', title: 'Skenario Ilmiah', description: 'Cerita interaktif tentang proses fotosintesis' },
      { type: 'materi', title: 'Materi Pembelajaran', description: 'Definisi, tahapan, dan faktor fotosintesis' },
      { type: 'kuis', title: 'Kuis', description: '5 soal tentang proses fotosintesis' },
      { type: 'rangkuman', title: 'Rangkuman', description: 'Konsep kunci: klorofil, reaksi terang & gelap' },
      { type: 'penutup', title: 'Penutup', description: 'Penutup dan tindak lanjut' },
    ],
  },
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
      const blocks = generateBlocksForPageType(pageType, parsed, meta, opts);
      if (blocks.length > 0) {
        page.schema.blocks = blocks;
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

// ── Internal: Generate blocks for a specific page type ──────────

function generateBlocksForPageType(
  pageType: PageTemplateType,
  parsed: ParseResult,
  meta: { namaBab: string; kelas: string; mapel: string; durasi: string; ikon: string; judulPertemuan: string },
  opts: { pertemuan: number; bloomMax: number; jumlahKuis: number },
): import('@/core/schema/types').SchemaBlock[] {
  switch (pageType) {
    case 'cover':
      return [genCoverSchema(meta)];

    case 'tujuan':
      return [genTujuanDisplaySchema(parsed, opts)];

    case 'motivasi':
      return [genMotivasiSchema(parsed, meta)];

    case 'materi':
      return genMateriSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });

    case 'skenario':
      return [genSkenarioSchema(parsed, meta)];

    case 'kuis':
      return [genKuisSchema(parsed, opts.jumlahKuis, opts.pertemuan)];

    case 'diskusi':
      return [genDiskusiSchema(parsed, [], { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab })];

    case 'refleksi':
      return [genRefleksiSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab })];

    case 'rangkuman':
      return [genRangkumanSchema(parsed, meta)];

    case 'hasil':
      return [genHasilSchema()];

    case 'penutup':
      return [genPenutupSchema(meta)];

    case 'petunjuk':
      return [genPetunjukSchema([
        { icon: '📖', judul: 'Baca Materi', isi: 'Pelajari materi yang disajikan di setiap halaman' },
        { icon: '✍️', judul: 'Kerjakan Latihan', isi: 'Jawab pertanyaan dan kerjakan kuis yang tersedia' },
        { icon: '🤔', judul: 'Refleksi', isi: 'Renungkan apa yang sudah dipelajari' },
      ])];

    case 'dokumen': {
      const blocks: import('@/core/schema/types').SchemaBlock[] = [];
      blocks.push(genTpSchema(parsed, opts));
      blocks.push(genAlurSchema(parsed, opts, meta));
      return blocks;
    }

    default:
      return [];
  }
}
