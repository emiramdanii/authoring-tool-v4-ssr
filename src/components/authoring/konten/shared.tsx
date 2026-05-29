'use client';

import { navigateToBlock } from '@/hooks/use-schema-navigator';
// All icons migrated to Material Symbols Outlined
// ── Sub-tab type ─────────────────────────────────────────────────
export type KontenTab = 'materi' | 'diskusi' | 'refleksi' | 'skenario' | 'modules' | 'kuis' | 'motivasi' | 'rangkuman';

// ── Block type definitions ──────────────────────────────────────
// SILSE v4: Semantic color tokens mapped to silse-* design system
// Each color maps to a Tailwind silse-* class for TypeBadge rendering
export const BLOCK_TYPES = [
  { id: 'teks',      icon: '📝', label: 'Paragraf Teks',    color: 'silse-on-surface-variant' },
  { id: 'definisi',  icon: '📌', label: 'Kotak Definisi',   color: 'silse-tertiary' },
  { id: 'poin',      icon: '•',  label: 'Poin-Poin',        color: 'silse-secondary' },
  { id: 'tabel',     icon: '📊', label: 'Tabel',            color: 'silse-tertiary-container' },
  { id: 'kutipan',   icon: '💬', label: 'Kutipan / Quote',  color: 'silse-primary' },
  { id: 'gambar',    icon: '🖼️', label: 'Gambar / Upload',  color: 'silse-secondary-container' },
  { id: 'timeline',  icon: '🔄', label: 'Timeline / Alur',  color: 'silse-secondary' },
  { id: 'highlight', icon: '⚡', label: 'Highlight Card',   color: 'silse-tertiary' },
  { id: 'compare',   icon: '⚖️', label: 'Perbandingan',     color: 'silse-tertiary-container' },
  { id: 'infobox',   icon: '💡', label: 'Info / Tips Box',  color: 'silse-primary' },
  { id: 'checklist', icon: '✅', label: 'Checklist',        color: 'silse-primary' },
  { id: 'statistik', icon: '📈', label: 'Statistik Angka',  color: 'silse-secondary-container' },
  { id: 'studi',     icon: '📖', label: 'Studi Kasus',      color: 'silse-error' },
] as const;

// ── Constants ──────────────────────────────────────────────────
// ── Input length limits (security) ───────────────────────────
export const MAX_TITLE = 200;
export const MAX_BODY = 5000;
export const MAX_OPTION = 500;
export const MAX_SHORT_TEXT = 100;

export const INPUT_CLS =
  'w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50 transition-colors';

export const TEXTAREA_CLS = INPUT_CLS + ' resize-none';

// ── Module Type Definitions ───────────────────────────────────
export const MODULE_TYPES = [
  { id: 'skenario', icon: '🎭', label: 'Skenario Interaktif', desc: 'Pilihan bercabang dengan dialog dan konsekuensi', color: 'silse-tertiary' },
  { id: 'video', icon: '🎥', label: 'Video Embed', desc: 'Video dari YouTube, Drive, atau URL lain', color: 'silse-error' },
  { id: 'flashcard', icon: '🃏', label: 'Flashcard', desc: 'Kartu bolak-balik untuk belajar istilah', color: 'silse-secondary' },
  { id: 'infografis', icon: '📊', label: 'Infografis / Kartu Konsep', desc: 'Kartu informasi visual', color: 'silse-tertiary-container' },
  { id: 'studi-kasus', icon: '📰', label: 'Studi Kasus', desc: 'Analisis kasus dengan pertanyaan', color: 'silse-secondary-container' },
  { id: 'debat', icon: '🗣️', label: 'Debat & Polling', desc: 'Mosiperta debat pro dan kontra', color: 'silse-error' },
  { id: 'timeline', icon: '📅', label: 'Timeline', desc: 'Urutan peristiwa berdasarkan waktu', color: 'silse-primary' },
  { id: 'matching', icon: '🔀', label: 'Game Pasangkan', desc: 'Cocokkan istilah dengan definisi', color: 'silse-primary' },
  { id: 'materi', icon: '📖', label: 'Materi Teks', desc: 'Blok konten teks untuk siswa baca', color: 'silse-on-surface-variant' },
  { id: 'hero', icon: '🖼️', label: 'Hero Banner', desc: 'Banner utama dengan gradient', color: 'silse-error' },
  { id: 'kutipan', icon: '💬', label: 'Kutipan Inspiratif', desc: 'Kutipan dengan gaya visual', color: 'silse-primary' },
  { id: 'langkah', icon: '👣', label: 'Langkah-Langkah', desc: 'Tutorial langkah demi langkah', color: 'silse-secondary' },
  { id: 'accordion', icon: '🗂️', label: 'Accordion / FAQ', desc: 'Panel yang bisa dibuka/tutup', color: 'silse-tertiary-container' },
  { id: 'statistik', icon: '📊', label: 'Statistik & Angka', desc: 'Angka kunci dengan visual', color: 'silse-secondary-container' },
  { id: 'polling', icon: '🗳️', label: 'Polling / Voting', desc: 'Voting dan polling interaktif', color: 'silse-primary' },
  { id: 'embed', icon: '🔗', label: 'Embed / iFrame', desc: 'Sematkan konten eksternal', color: 'silse-on-surface-variant' },
  { id: 'tab-icons', icon: '📑', label: 'Tab Interaktif', desc: 'Konten dalam tab bergambar', color: 'silse-tertiary' },
  { id: 'icon-explore', icon: '🔍', label: 'Eksplorasi Ikon', desc: 'Jelajahi konten lewat ikon', color: 'silse-primary' },
  { id: 'comparison', icon: '⚖️', label: 'Perbandingan', desc: 'Bandingkan beberapa kolom', color: 'silse-tertiary-container' },
  { id: 'card-showcase', icon: '🃏', label: 'Card Showcase', desc: 'Tampilkan kartu visual', color: 'silse-secondary-container' },
  { id: 'hotspot-image', icon: '🗺️', label: 'Hotspot Image', desc: 'Gambar dengan titik interaktif', color: 'silse-error' },
] as const;

export const GAME_TYPES = [
  { id: 'truefalse', icon: '✅', label: 'Benar / Salah', desc: 'Pernyataan benar atau salah', color: 'silse-primary' },
  { id: 'memory', icon: '🧠', label: 'Memory Match', desc: 'Cocokkan kartu berpasangan', color: 'silse-tertiary-container' },
  { id: 'roda', icon: '🎡', label: 'Roda Putar', desc: 'Putar roda untuk pilihan acak', color: 'silse-secondary-container' },
  { id: 'sorting', icon: '🔢', label: 'Urutkan / Klasifikasi', desc: 'Kelompokkan item ke kategori', color: 'silse-secondary' },
  { id: 'spinwheel', icon: '🎡', label: 'Roda Pertanyaan', desc: 'Roda putar dengan soal acak', color: 'silse-error' },
  { id: 'teambuzzer', icon: '🏆', label: 'Kuis Tim / Buzzer', desc: 'Kuis kompetisi antar tim', color: 'silse-tertiary' },
  { id: 'wordsearch', icon: '🔍', label: 'Teka-Teki Kata', desc: 'Cari kata tersembunyi', color: 'silse-primary' },
  { id: 'flashcard', icon: '🃏', label: 'Flashcard', desc: 'Kartu belajar bolak-balik', color: 'silse-secondary' },
  { id: 'crossword', icon: '🔤', label: 'Teka Silang', desc: 'Isi kata sesuai petunjuk', color: 'silse-tertiary-container' },
  { id: 'fillblank', icon: '✏️', label: 'Isian', desc: 'Soal isian singkat', color: 'silse-primary' },
  { id: 'dragdrop', icon: '🖐️', label: 'Seret & Letakkan', desc: 'Letakkan item ke target yang benar', color: 'silse-secondary-container' },
  { id: 'matching', icon: '🔀', label: 'Pasangkan', desc: 'Cocokkan pasangan kiri-kanan', color: 'silse-tertiary' },
] as const;

export const ALL_MODULE_TYPES = [...MODULE_TYPES, ...GAME_TYPES];

// ── Helper functions ──────────────────────────────────────────
export function blockTypeInfo(tipe: string) {
  return BLOCK_TYPES.find((b) => b.id === tipe) || { id: 'unknown', icon: '📦', label: tipe, color: 'silse-on-surface-variant' };
}

export function moduleTypeInfo(typeId: string) {
  return ALL_MODULE_TYPES.find((t) => t.id === typeId) || { id: 'unknown', icon: '📦', label: typeId, desc: '', color: 'silse-on-surface-variant' };
}

// ── Module Mini Preview ───────────────────────────────────────
export function modulePreview(mod: import('@/store/authoring/types').Module): string {
  const t = mod.type; // Already typed as string
  switch (t) {
    case 'skenario': {
      const ch = (mod.chapters as unknown[]) || [];
      let pilihan = 0;
      (ch as Record<string, unknown>[]).forEach((c) => { pilihan += ((c.choices as unknown[]) || []).length; });
      return ch.length ? `${ch.length} bab · ${pilihan} pilihan` : 'Belum ada bab';
    }
    case 'video': return mod.url ? `URL tersimpan` : 'Belum ada URL';
    case 'flashcard': {
      const k = (mod.kartu as unknown[]) || [];
      return k.length ? `${k.length} kartu` : 'Belum ada kartu';
    }
    case 'infografis': {
      const k = (mod.kartu as unknown[]) || [];
      return k.length ? `${k.length} kartu · ${(mod.layoutVariant as string) || (mod.layout as string) || 'grid'}` : 'Belum ada kartu';
    }
    case 'studi-kasus': {
      const p = (mod.pertanyaan as unknown[]) || [];
      return p.length ? `${p.length} pertanyaan` : 'Belum ada pertanyaan';
    }
    case 'debat': return (mod.pertanyaan as string) ? 'Mosiperta tersimpan' : 'Belum ada mosiperta';
    case 'timeline': {
      const e = (mod.events as unknown[]) || [];
      return e.length ? `${e.length} peristiwa` : 'Belum ada peristiwa';
    }
    case 'matching': {
      const p = (mod.pasangan as unknown[]) || [];
      return p.length ? `${p.length} pasangan` : 'Belum ada pasangan';
    }
    case 'materi': {
      const b = (mod.blok as unknown[]) || [];
      return b.length ? `${b.length} blok` : 'Belum ada blok';
    }
    case 'truefalse': {
      const s = (mod.soal as unknown[]) || [];
      return s.length ? `${s.length} pernyataan` : 'Belum ada pernyataan';
    }
    case 'memory': {
      const p = (mod.pasangan as unknown[]) || [];
      return p.length ? `${p.length} pasangan` : 'Belum ada pasangan';
    }
    case 'roda': {
      const o = (mod.opsi as unknown[]) || [];
      return o.length ? `${o.length} opsi` : 'Belum ada opsi';
    }
    case 'hero': return (mod.gradient as string) ? `Gradient: ${(mod.gradient as string)}` : '';
    case 'kutipan': return (mod.quote as string) ? 'Kutipan tersimpan' : 'Belum ada kutipan';
    case 'langkah': { const s = (mod.steps as unknown[]) || []; return s.length ? `${s.length} langkah` : 'Belum ada langkah'; }
    case 'accordion': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'statistik': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'polling': { const op = (mod.opsi as unknown[]) || []; return op.length ? `${op.length} opsi · ${(mod.tipe as string) || 'single'}` : 'Belum ada opsi'; }
    case 'embed': return (mod.url as string) ? 'URL tersimpan' : 'Belum ada URL';
    case 'tab-icons': { const tb = (mod.tabs as unknown[]) || []; return tb.length ? `${tb.length} tab` : 'Belum ada tab'; }
    case 'icon-explore': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'comparison': { const b = (mod.baris as unknown[]) || []; return b.length ? `${b.length} baris` : 'Belum ada baris'; }
    case 'card-showcase': { const c = (mod.cards as unknown[]) || []; return c.length ? `${c.length} kartu` : 'Belum ada kartu'; }
    case 'hotspot-image': { const h = (mod.hotspots as unknown[]) || []; return h.length ? `${h.length} hotspot` : 'Belum ada hotspot'; }
    case 'sorting': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'spinwheel': { const s = (mod.soal as unknown[]) || []; return s.length ? `${s.length} soal` : 'Belum ada soal'; }
    case 'teambuzzer': { const s = (mod.soal as unknown[]) || []; return s.length ? `${s.length} soal` : 'Belum ada soal'; }
    case 'wordsearch': { const k = (mod.kata as unknown[]) || []; return k.length ? `${k.length} kata` : 'Belum ada kata'; }
    default: return '';
  }
}

// ── Shared small components ────────────────────────────────────
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-app-secondary mb-1.5">{children}</label>;
}

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-app-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Block type badge ───────────────────────────────────────────
// SILSE v4: Map semantic token names to CSS custom properties for dynamic badges
const SILSE_TOKEN_CSS: Record<string, { bg: string; text: string; border: string }> = {
  'silse-primary':               { bg: 'var(--silse-primary)',               text: 'var(--silse-primary)',               border: 'var(--silse-primary)' },
  'silse-secondary':             { bg: 'var(--silse-secondary)',             text: 'var(--silse-secondary)',             border: 'var(--silse-secondary)' },
  'silse-tertiary':              { bg: 'var(--silse-tertiary)',              text: 'var(--silse-tertiary)',              border: 'var(--silse-tertiary)' },
  'silse-error':                 { bg: 'var(--silse-error)',                 text: 'var(--silse-error)',                 border: 'var(--silse-error)' },
  'silse-primary-container':     { bg: 'var(--silse-primary-container)',     text: 'var(--silse-primary-container)',     border: 'var(--silse-primary-container)' },
  'silse-secondary-container':   { bg: 'var(--silse-secondary-container)',   text: 'var(--silse-secondary-container)',   border: 'var(--silse-secondary-container)' },
  'silse-tertiary-container':    { bg: 'var(--silse-tertiary-container)',    text: 'var(--silse-tertiary-container)',    border: 'var(--silse-tertiary-container)' },
  'silse-on-surface-variant':    { bg: 'var(--silse-on-surface-variant)',    text: 'var(--silse-on-surface-variant)',    border: 'var(--silse-on-surface-variant)' },
};

export function TypeBadge({ tipe }: { tipe: string }) {
  const info = blockTypeInfo(tipe);
  const token = SILSE_TOKEN_CSS[info.color] ?? SILSE_TOKEN_CSS['silse-on-surface-variant'];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border"
      style={{
        backgroundColor: `color-mix(in srgb, ${token.bg} 12%, transparent)`,
        color: token.text,
        borderColor: `color-mix(in srgb, ${token.border} 25%, transparent)`,
      }}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
}

// ── Shared side form for compare editor ──────────────────────────
export function CompareSideForm({
  side, label, data, onUpdate,
}: {
  side: 'kiri' | 'kanan';
  label: string;
  data: { icon?: string; judul?: string; isi?: string };
  onUpdate: (side: 'kiri' | 'kanan', key: string, val: string) => void;
}) {
  return (
    <div className="space-y-2 p-3 bg-app-elevated/50 rounded-lg border border-app-border/50">
      <div className="text-xs font-semibold text-app-secondary mb-1">{label}</div>
      <div>
        <FieldLabel>Ikon</FieldLabel>
        <input className={INPUT_CLS} maxLength={MAX_SHORT_TEXT} placeholder="🎯" value={data.icon || ''} onChange={(e) => onUpdate(side, 'icon', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Judul</FieldLabel>
        <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder={`Judul ${label.toLowerCase()}…`} value={data.judul || ''} onChange={(e) => onUpdate(side, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Isi</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} maxLength={MAX_BODY} placeholder={`Isi ${label.toLowerCase()}…`} value={data.isi || ''} onChange={(e) => onUpdate(side, 'isi', e.target.value)} />
      </div>
    </div>
  );
}

// ── Cross-link: Locate in Canva button ─────────────────────────
/**
 * A small button that navigates from a Konten tab block to the
 * corresponding page in the Canva editor. Uses the schema location
 * (pageId, blockId, blockType) to perform the navigation.
 *
 * This is the key UX feature of the "Schema Navigator" concept —
 * it bridges the Konten editing experience with the Canva visual
 * editor, allowing teachers to see where their content appears.
 */
export function LocateInCanvaButton({
  pageId,
  blockId,
  blockType,
  label = 'Lihat di Canva',
}: {
  pageId: string;
  blockId: string;
  blockType: string;
  label?: string;
}) {
  return (
    <button
      onClick={() => navigateToBlock(pageId, blockId, blockType)}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-app-muted hover:text-app-accent rounded-md hover:bg-app-accent/10 transition-colors"
      title="Buka halaman ini di editor Canva"
    >
      <span className="material-symbols-outlined" style={ { fontSize: '11px' } }>open_in_new</span>
      {label}
    </button>
  );
}
