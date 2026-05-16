/**
 * Real PPKn SMP Kelas 8 material for testing the auto-generate pipeline.
 * Source: Adapted from Kurikulum Merdeka PPKn SMP
 *
 * This content is used to verify the parser and generators handle
 * real Indonesian academic text — not just lorem ipsum or synthetic data.
 */

export const PPKN_MATERI_BUDAYA_DEMOKRASI = `
Budaya Demokrasi dalam Kehidupan Bermasyarakat

A. Pengertian Budaya Demokrasi

Budaya demokrasi adalah segala hal yang berkaitan dengan demokrasi yang menjadi kebiasaan yang diakui dan dijadikan pedoman hidup dalam bermasyarakat, berbangsa, dan bernegara. Budaya demokrasi mencakup sikap dan perilaku yang mencerminkan nilai-nilai demokrasi dalam kehidupan sehari-hari.

Beberapa ciri-ciri budaya demokrasi antara lain:
1. Menghargai perbedaan pendapat
2. Mengutamakan musyawarah untuk mufakat
3. Menegakkan keadilan dan kebenaran
4. Menghormati hak asasi manusia
5. Bertanggung jawab atas tindakan yang dilakukan
6. Menjalankan aturan yang berlaku secara konsisten

B. Prinsip-Prinsip Budaya Demokrasi

Prinsip-prinsip budaya demokrasi yang harus dipahami dan diamalkan oleh setiap warga negara meliputi:

1. Kebebasan Berpendapat
Setiap warga negara memiliki hak untuk menyampaikan pendapatnya secara bebas, namun tetap harus menghormati pendapat orang lain. Kebebasan berpendapat bukan berarti bebas tanpa batas, melainkan harus dilakukan secara bertanggung jawab.

2. Persamaan Hak
Setiap warga negara memiliki hak yang sama di hadapan hukum tanpa memandang perbedaan suku, agama, ras, dan golongan. Persamaan hak menjamin tidak adanya diskriminasi dalam kehidupan bermasyarakat.

3. Musyawarah
Setiap keputusan yang menyangkut kepentingan bersama harus diambil melalui musyawarah untuk mufakat. Musyawarah merupakan cara penyelesaian masalah yang paling demokratis.

4. Keadilan
Keadilan harus ditegakkan dalam setiap aspek kehidupan. Setiap warga negara berhak mendapatkan perlakuan yang adil dari negara dan masyarakat.

5. Tanggung Jawab
Setiap warga negara harus bertanggung jawab atas tindakan dan keputusan yang diambilnya. Tanggung jawab merupakan konsekuensi dari kebebasan yang dimiliki.

C. Contoh Penerapan Budaya Demokrasi

Berikut ini beberapa contoh penerapan budaya demokrasi dalam kehidupan sehari-hari:

Di Sekolah:
- Memilih ketua kelas secara langsung oleh seluruh siswa
- Musyawarah kelas untuk menentukan aturan kelas
- Menghargai teman yang berbeda pendapat dalam diskusi
- Mengikuti upacara bendera dengan tertib sebagai wujud tanggung jawab

Di Masyarakat:
- Ikut serta dalam musyawarah RT/RW
- Menghormati keputusan mayoritas
- Menjalankan gotong royong dengan sukarela
- Tidak memaksakan kehendak kepada orang lain

Di Negara:
- Mengikuti pemilihan umum
- Mengawasi jalannya pemerintahan
- Menyampaikan kritik yang membangun
- Mematuhi peraturan perundang-undangan yang berlaku

D. Hambatan dalam Menerapkan Budaya Demokrasi

Beberapa hambatan yang sering ditemui dalam menerapkan budaya demokrasi antara lain:
1. Rendahnya kesadaran masyarakat tentang hak dan kewajibannya
2. Kecenderungan memaksakan kehendak kepada orang lain
3. Kurangnya penghargaan terhadap perbedaan pendapat
4. Praktik korupsi dan penyalahgunaan kekuasaan
5. Ketidakpedulian terhadap masalah sosial di sekitar
`;

/** Tujuan Pembelajaran (TP) for the PPKn Budaya Demokrasi topic */
export const PPKN_TP = [
  { kode: '3.1', teks: 'Menganalisis budaya demokrasi dalam kehidupan bermasyarakat, berbangsa, dan bernegara' },
  { kode: '4.1', teks: 'Menyajikan hasil analisis tentang penerapan budaya demokrasi di lingkungan sekitar' },
];

/** Metadata for the PPKn module */
export const PPKN_META = {
  mataPelajaran: 'Pendidikan Pancasila dan Kewarganegaraan',
  kelas: '8',
  semester: '1',
  tema: 'Budaya Demokrasi',
  guru: 'Bapak/Ibu Guru',
  sekolah: 'SMP Negeri 1 Indonesia',
  tahunAjaran: '2024/2025',
};

/**
 * Convenience: authoring-store compatible meta shape
 * (genMateri, genDiskusi, genRefleksi expect these fields)
 */
export const PPKN_GEN_META = {
  judulPertemuan: 'Budaya Demokrasi dalam Kehidupan Bermasyarakat',
  namaBab: 'Budaya Demokrasi',
};

/**
 * Convenience: TP items compatible with genDiskusi (expects { desc: string }[])
 */
export const PPKN_TP_FOR_DISKUSI = PPKN_TP.map((tp) => ({
  desc: tp.teks,
}));
