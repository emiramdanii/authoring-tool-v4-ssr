// ═══════════════════════════════════════════════════════════════════
// LEGACY COURSE TEMPLATES — Frozen since SILSE v2.1
// ═══════════════════════════════════════════════════════════════════
// Filosofi: experience → template → system
// Semua template di bawah ini DIDAFTARKAN di legacy, BUKAN di pipeline aktif.
// Tersedia untuk referensi masa depan saat experience flow baru siap.
//
// Catatan: Template yang aktif saat ini hanya:
//   - modul-ppkn-vii (presetId: hakikat-norma)
//   - modul-ppkn-vii-macam-norma (presetId: macam-norma)
//   - template-kosong (fallback universal)

import type { CourseTemplate } from '../CourseTemplateRegistry';

export const LEGACY_COURSE_TEMPLATES: CourseTemplate[] = [
  // ── PPKn VII — Perilaku Patuh ──────────────────────────────
  {
    id: 'modul-ppkn-vii-perilaku-patuh',
    name: 'Perilaku Patuh Norma (PPKn VII)',
    description: 'Membangun kesadaran patuh norma melalui skenario interaktif dan diskusi: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '2',
    theme: 'perilaku-patuh',
    presetId: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — Nilai Pancasila ──────────────────────────────
  {
    id: 'modul-ppkn-viii-nilai-pancasila',
    name: 'Nilai-Nilai Pancasila (PPKn VIII)',
    description: 'Mendalami nilai-nilai Pancasila sebagai dasar negara: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'nilai-pancasila',
    presetId: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Nilai Pancasila', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🇮🇩', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — Bhinneka Tunggal Ika ──────────────────────────
  {
    id: 'modul-ppkn-viii-bhinneka',
    name: 'Bhinneka Tunggal Ika (PPKn VIII)',
    description: 'Memahami makna keberagaman dan persatuan Indonesia: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    presetId: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🤝', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — HAM & Kewajiban ──────────────────────────────
  {
    id: 'modul-ppkn-viii-ham',
    name: 'HAM & Kewajiban (PPKn VIII)',
    description: 'Mengenal hak asasi manusia dan kewajiban warga negara: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '2',
    theme: 'ham-hak-kewajiban',
    presetId: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — HAM & Kewajiban', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🕊️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn IX — Demokrasi Pancasila ──────────────────────────────
  {
    id: 'modul-ppkn-ix-demokrasi',
    name: 'Demokrasi Pancasila (PPKn IX)',
    description: 'Memahami prinsip demokrasi Pancasila dan penerapannya: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '9',
    semester: '1',
    theme: 'demokrasi-pancasila',
    presetId: 'demokrasi-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Demokrasi Pancasila', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🏛️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn IX — Globalisasi ──────────────────────────────
  {
    id: 'modul-ppkn-ix-globalisasi',
    name: 'Globalisasi (PPKn IX)',
    description: 'Menganalisis dampak globalisasi terhadap kehidupan berbangsa: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '9',
    semester: '2',
    theme: 'globalisasi',
    presetId: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Globalisasi', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌐', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VII — Misi Penjelajah Pancasila ──────────────────
  {
    id: 'modul-ppkn-vii-misi-pancasila',
    name: 'Misi Penjelajah Pancasila (PPKn VII)',
    description: 'Petualangan interaktif mengeksplorasi nilai Pancasila: Cover → Tujuan → Skenario → Materi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '2',
    theme: 'hakikat-norma',
    presetId: 'misi-penjelajah-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🗺️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — Generic (no preset, uses Level 2/3) ───────
  {
    id: 'modul-ppkn-viii',
    name: 'Modul PPKn Kelas VIII',
    description: 'Alur pembelajaran PPKn SMP kelas VIII dengan skenario interaktif: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VIII — Eksperimen ───────────────────────────────────
  {
    id: 'modul-ipa-viii',
    name: 'Modul IPA Kelas VIII',
    description: 'Alur pembelajaran IPA SMP kelas VIII: Cover → Tujuan → Skenario → Materi ×2 → Eksperimen → Kuis → Rangkuman',
    subject: 'IPA',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Ilmiah', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Eksperimen / Praktikum', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
    ],
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VII — Standar ───────────────────────────────────────
  {
    id: 'modul-ipa-vii',
    name: 'Modul IPA Kelas VII',
    description: 'Alur pembelajaran IPA SMP kelas VII: Cover → Tujuan → Motivasi → Materi ×2 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'IPA',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VII — Standar ───────────────────────────────────────
  {
    id: 'modul-mtk-vii',
    name: 'Modul Matematika Kelas VII',
    description: 'Alur pembelajaran MTK SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Contoh Soal → Latihan → Kuis → Rangkuman → Penutup',
    subject: 'MTK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Contoh Soal & Pembahasan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Latihan Soal', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VIII — Interaktif ───────────────────────────────────
  {
    id: 'modul-mtk-viii',
    name: 'Modul Matematika Kelas VIII',
    description: 'Alur pembelajaran MTK SMP kelas VIII: Cover → Tujuan → Materi ×2 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'MTK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1 — Konsep', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi Soal', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VII — Standar ──────────────────────────────
  {
    id: 'modul-bin-vii',
    name: 'Modul B. Indonesia Kelas VII',
    description: 'Alur pembelajaran Bahasa Indonesia SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'B.Indonesia',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VIII — Interaktif ──────────────────────────
  {
    id: 'modul-bin-viii',
    name: 'Modul B. Indonesia Kelas VIII',
    description: 'Alur pembelajaran Bahasa Indonesia SMP kelas VIII: Cover → Tujuan → Skenario → Materi ×2 → Diskusi → Kuis → Rangkuman → Penutup',
    subject: 'B.Indonesia',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi Kelompok', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'rangkuman', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'summary' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VIII — Interaktif ────────────────────────────
  {
    id: 'modul-bing-viii',
    name: 'Modul B. Inggris Kelas VIII',
    description: 'Alur pembelajaran Bahasa Inggris SMP kelas VIII: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'B.Inggris',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Interactive Scenario', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Reflection', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VII — Standar ────────────────────────────────
  {
    id: 'modul-bing-vii',
    name: 'Modul B. Inggris Kelas VII',
    description: 'Alur pembelajaran Bahasa Inggris SMP kelas VII: Cover → Tujuan → Materi → Diskusi → Kuis → Rangkuman → Penutup',
    subject: 'B.Inggris',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'rangkuman', label: 'Summary', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'summary' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VII — Standar ──────────────────────────────────────
  {
    id: 'modul-seni-vii',
    name: 'Modul Seni Budaya Kelas VII',
    description: 'Alur pembelajaran Seni Budaya SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Praktik → Diskusi → Refleksi → Penutup',
    subject: 'Seni',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'refleksi', label: 'Refleksi Karya', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VIII — Interaktif ──────────────────────────────────
  {
    id: 'modul-seni-viii',
    name: 'Modul Seni Budaya Kelas VIII',
    description: 'Alur pembelajaran Seni Budaya SMP kelas VIII: Cover → Tujuan → Materi → Skenario Kreatif → Diskusi → Refleksi → Penutup',
    subject: 'Seni',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'skenario', label: 'Skenario Kreatif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'diskusi', label: 'Diskusi Karya', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VII — Standar ──────────────────────────────────────
  {
    id: 'modul-pjok-vii',
    name: 'Modul PJOK Kelas VII',
    description: 'Alur pembelajaran PJOK SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Praktik → Kuis → Refleksi → Penutup',
    subject: 'PJOK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Pemanasan / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi Aktivitas', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VIII — Interaktif ──────────────────────────────────
  {
    id: 'modul-pjok-viii',
    name: 'Modul PJOK Kelas VIII',
    description: 'Alur pembelajaran PJOK SMP kelas VIII: Cover → Tujuan → Materi → Skenario Olahraga → Diskusi → Kuis → Penutup',
    subject: 'PJOK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'skenario', label: 'Skenario Olahraga', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK IV (SD) — Gerak Dasar ──────────────────────────────
  {
    id: 'modul-pjok-iv',
    name: 'Modul PJOK Kelas IV SD',
    description: 'Alur pembelajaran PJOK SD kelas IV: Cover → Petunjuk → Tujuan → Materi ×3 → Kuis → Refleksi → Penutup',
    subject: 'PJOK',
    grade: '4',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'petunjuk', label: 'Petunjuk', suggestedBlocks: ['petunjuk'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🏃', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK X (SMA) — Kebugaran ────────────────────────────────
  {
    id: 'modul-pjok-x',
    name: 'Modul PJOK Kelas X SMA',
    description: 'Alur pembelajaran PJOK SMA kelas X: Cover → Tujuan → Materi ×2 → Studi Kasus → Kuis → Refleksi → Rangkuman → Penutup',
    subject: 'PJOK',
    grade: '10',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Prinsip Latihan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Studi Kasus', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '💪', author: 'SILSE', version: '1.0.0' },
  },
];
