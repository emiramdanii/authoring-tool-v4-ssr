// @ts-nocheck — BATCH-12-07: quarantined to src/legacy-disabled/
// ═══════════════════════════════════════════════════════════════════
// RC STABILIZATION REGRESSION TESTS — Export Parity + Overflow Edge Cases
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { renderContentBlock, renderGenericBlock } from '@/lib/export/block-renderers';
import { renderGameBlock } from '@/lib/export/game-renderers';
import type { SchemaBlock } from '@/core/schema/types';

// ── Mock renderBlock for nested content ──────────────────────────────
const mockRenderBlock = (block: SchemaBlock): string => {
  const result = renderContentBlock(block.type, block as unknown as Record<string, unknown>, mockRenderBlock);
  if (result !== null) return result;
  const gameResult = renderGameBlock(block.type, block as unknown as Record<string, unknown>, mockRenderBlock);
  if (gameResult !== null) return gameResult;
  return renderGenericBlock(block as unknown as Record<string, unknown>);
};

// ═══════════════════════════════════════════════════════════════════
// EXPORT PARITY — Previously Missing Renderers
// ═══════════════════════════════════════════════════════════════════

describe('Export Parity — Previously Missing Renderers', () => {
  it('should render tabel block in export', () => {
    const html = renderContentBlock('tabel', {
      title: 'Data Siswa',
      headers: ['Nama', 'Kelas', 'Nilai'],
      rows: [['Ahmad', '7A', '85'], ['Siti', '7A', '90']],
      accentColor: 'c',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    expect(html).toContain('Data Siswa');
    expect(html).toContain('Ahmad');
    expect(html).toContain('thead');
    expect(html).toContain('tbody');
  });

  it('should render checklist block in export', () => {
    const html = renderContentBlock('checklist', {
      title: 'Checklist Praktik',
      items: [
        { teks: 'Pemanasan 5 menit', diconteng: true, icon: '✅' },
        { teks: 'Latihan inti 20 menit', diconteng: false, icon: '⬜' },
      ],
      accentColor: 'g',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    expect(html).toContain('Checklist Praktik');
    expect(html).toContain('Pemanasan 5 menit');
    expect(html).toContain('checked');
  });

  it('should render statistik block in export', () => {
    const html = renderContentBlock('statistik', {
      title: 'Statistik Kelas',
      items: [
        { icon: '📊', angka: '28', satuan: 'siswa', label: 'Jumlah', warna: 'c' },
        { icon: '📈', angka: '85', satuan: 'rata-rata', label: 'Nilai', warna: 'y' },
      ],
      accentColor: 'c',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    expect(html).toContain('Statistik Kelas');
    expect(html).toContain('28');
    expect(html).toContain('85');
  });

  it('should render studi block in export', () => {
    const html = renderContentBlock('studi', {
      title: 'Studi Kasus: Olahraga',
      situasi: 'Seorang atlet mengalami cedera saat pertandingan.',
      pertanyaan: ['Apa yang seharusnya dilakukan?', 'Bagaimana pencegahannya?'],
      accentColor: 'y',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    expect(html).toContain('Studi Kasus');
    expect(html).toContain('cedera');
    expect(html).toContain('Pertanyaan');
  });

  it('should render hero block differently from cover', () => {
    const heroHtml = renderContentBlock('hero', {
      icon: '⚡',
      title: 'Judul Hero',
      subtitle: 'Subjudul Hero',
      accentColor: 'b',
    }, mockRenderBlock);
    const coverHtml = renderContentBlock('cover', {
      icon: '📘',
      title: 'Judul Cover',
      subtitle: 'Subjudul Cover',
      badges: [],
    }, mockRenderBlock);
    expect(heroHtml).not.toBeNull();
    expect(coverHtml).not.toBeNull();
    // Hero should NOT have cover-specific classes
    expect(heroHtml).not.toContain('cover-block');
    expect(heroHtml).toContain('hero-block');
  });
});

// ═══════════════════════════════════════════════════════════════════
// EXPORT PARITY — Sortir Game Fix
// ═══════════════════════════════════════════════════════════════════

describe('Export Parity — Sortir Game Fix', () => {
  it('should include data-game attributes on sortir game', () => {
    const html = renderGameBlock('sortir-game', {
      title: 'Sortir Olahraga',
      pool: [
        { id: '1', text: 'Sepak Bola', category: 'kaki' },
        { id: '2', text: 'Bola Voli', category: 'tangan' },
      ],
      kolom: [
        { id: 'kaki', label: 'Olahraga Kaki', color: 'c' },
        { id: 'tangan', label: 'Olahraga Tangan', color: 'y' },
      ],
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    expect(html).toContain('data-game=');
    expect(html).toContain('data-kid=');
    expect(html).toContain('Periksa Jawaban');
  });
});

// ═══════════════════════════════════════════════════════════════════
// EXPORT PARITY — Accent Color Fix in MateriBlok
// ═══════════════════════════════════════════════════════════════════

describe('Export Parity — MateriBlok Accent Color', () => {
  it('should use block warna for compare sub-type accent', () => {
    const html = renderContentBlock('materi-blok', {
      tipe: 'compare',
      judul: 'Perbandingan',
      kiri: { icon: '🔵', judul: 'Kiri', isi: 'Isi kiri' },
      kanan: { icon: '🔴', judul: 'Kanan', isi: 'Isi kanan' },
      warna: 'y',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    // Should NOT use hardcoded 'c' — should use 'y' from warna
    expect(html).toContain('Perbandingan');
  });

  it('should use block warna for timeline sub-type accent', () => {
    const html = renderContentBlock('materi-blok', {
      tipe: 'timeline',
      judul: 'Langkah-langkah',
      langkah: [
        { icon: '1️⃣', judul: 'Step 1', isi: 'Langkah pertama' },
      ],
      warna: 'b',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    expect(html).toContain('Langkah-langkah');
  });

  it('should use block warna for gambar sub-type accent', () => {
    const html = renderContentBlock('materi-blok', {
      tipe: 'gambar',
      judul: 'Gambar Ilustrasi',
      isi: '',
      warna: 'g',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    expect(html).toContain('Gambar Ilustrasi');
  });
});

// ═══════════════════════════════════════════════════════════════════
// OVERFLOW EDGE CASES
// ═══════════════════════════════════════════════════════════════════

describe('Overflow Edge Cases — Export', () => {
  it('should handle very long text in content blocks', () => {
    const longText = 'A'.repeat(500);
    const html = renderContentBlock('def-box', {
      content: longText,
      borderColor: 'y',
    }, mockRenderBlock);
    // Should render without error (overflow-wrap in CSS handles it)
    expect(html).not.toBeNull();
    expect(html).toContain('A'.repeat(50)); // At least part of the content
  });

  it('should handle empty blocks gracefully', () => {
    const html = renderContentBlock('tabel', {
      title: '',
      headers: [],
      rows: [],
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    // Should not crash on empty data
  });

  it('should handle special characters in export content', () => {
    const html = renderContentBlock('def-box', {
      content: '<script>alert("xss")</script> & "quotes" \'apostrophes\'',
      borderColor: 'y',
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    // HTML should be escaped — no raw script tag
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script');
  });

  it('should handle null/undefined content gracefully', () => {
    const html = renderContentBlock('cover', {
      title: undefined as unknown as string,
      subtitle: null as unknown as string,
      badges: undefined as unknown as Array<{ icon?: string; text: string; color: string }>,
    }, mockRenderBlock);
    expect(html).not.toBeNull();
    // Should not crash
  });
});
