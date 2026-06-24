// ═══════════════════════════════════════════════════════════════
// V5-METADATA-FINAL — Behavior tests for metadata fixes
// ═══════════════════════════════════════════════════════════════
// Real runtime behavior tests with mock stores.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist-safe shared state
const sharedState = vi.hoisted(() => ({
  pages: [] as any[],
  currentPageIndex: 5,
  meta: {} as Record<string, string>,
  setStateCalls: [] as any[],
  updateMetaCalls: [] as Array<[string, string]>,
}));

vi.mock('@/store/canva-store', () => ({
  useCanvaStore: {
    getState: () => ({
      pages: sharedState.pages,
      currentPageIndex: sharedState.currentPageIndex,
    }),
    setState: (partial: any) => {
      sharedState.setStateCalls.push(partial);
      if (partial.pages) {
        sharedState.pages.length = 0;
        sharedState.pages.push(...partial.pages);
      }
    },
  },
}));

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: {
    getState: () => ({
      meta: sharedState.meta,
      updateMeta: (key: string, value: string) => {
        sharedState.updateMetaCalls.push([key, value]);
        sharedState.meta[key] = value;
      },
    }),
  },
}));

// Import AFTER mocks are set up
import { applyMetadataToCoverBlocks } from '@/components/product-v5/apply-metadata';

function makeCoverBlock(id: string, title: string, badges: Array<{ icon?: string; text: string; color: string }>) {
  return {
    id,
    type: 'cover',
    title,
    subtitle: 'Test Subtitle',
    badges: badges.map((b) => ({ ...b })),
  };
}

function makePage(index: number, templateType: string, blocks: any[]) {
  return {
    id: `page-${index}`,
    label: `Page ${index}`,
    templateType,
    bgColor: '#ffffff',
    overlay: 20,
    elements: [],
    bgDataUrl: null,
    colorPalette: null,
    navConfig: {},
    templateData: {},
    pageMode: 'schema',
    schema: { id: `schema-${index}`, templateType, blocks, themeId: 'modern-interactive', background: { type: 'gradient' } },
  };
}

describe('V5-METADATA-FINAL: applyMetadataToCoverBlocks behavior', () => {
  beforeEach(() => {
    sharedState.pages.length = 0;
    sharedState.setStateCalls.length = 0;
    sharedState.updateMetaCalls.length = 0;
    Object.keys(sharedState.meta).forEach((k) => delete sharedState.meta[k]);
    sharedState.currentPageIndex = 5;

    // Setup: page 0 = cover with badges, page 5 = non-cover, currentPageIndex = 5
    sharedState.pages.push(
      makePage(0, 'cover', [
        makeCoverBlock('cover-1', 'Old Title', [
          { icon: '📚', text: 'Old Modul', color: 'y' },
          { icon: '🏫', text: 'Old SMP', color: 'c' },
          { icon: '👨\u200d🏫', text: 'Old Guru', color: 'g' },
          { icon: '🎯', text: 'CUSTOM BADGE', color: 'p' },
        ]),
      ]),
      makePage(1, 'petunjuk', [{ id: 'p1', type: 'petunjuk', title: 'Petunjuk' }]),
      makePage(2, 'petunjuk', [{ id: 'p2', type: 'petunjuk', title: 'Petunjuk' }]),
      makePage(3, 'petunjuk', [{ id: 'p3', type: 'petunjuk', title: 'Petunjuk' }]),
      makePage(4, 'petunjuk', [{ id: 'p4', type: 'petunjuk', title: 'Petunjuk' }]),
      makePage(5, 'materi', [{ id: 'm1', type: 'def-box', content: 'test' }]),
    );
  });

  it('P1: empty namaSekolah → remove sekolah badge from cover', () => {
    applyMetadataToCoverBlocks({
      namaSekolah: '',
      namaGuru: 'New Guru',
      judulPertemuan: 'New Title',
    });

    expect(sharedState.setStateCalls.length).toBe(1);
    const newPages = sharedState.setStateCalls[0].pages;
    const coverBlock = newPages[0].schema.blocks.find((b: any) => b.type === 'cover');
    const sekolahBadge = coverBlock.badges.find((b: any) => b.icon === '🏫');
    expect(sekolahBadge).toBeUndefined();
  });

  it('P1: empty namaGuru → remove guru badge from cover', () => {
    applyMetadataToCoverBlocks({
      namaGuru: '',
      namaSekolah: 'New SMP',
    });

    const newPages = sharedState.setStateCalls[0].pages;
    const coverBlock = newPages[0].schema.blocks.find((b: any) => b.type === 'cover');
    const guruBadge = coverBlock.badges.find((b: any) => b.icon === '👨\u200d🏫');
    expect(guruBadge).toBeUndefined();
  });

  it('P1: empty judulPertemuan → title cleared to empty string', () => {
    applyMetadataToCoverBlocks({
      judulPertemuan: '',
    });

    const newPages = sharedState.setStateCalls[0].pages;
    const coverBlock = newPages[0].schema.blocks.find((b: any) => b.type === 'cover');
    expect(coverBlock.title).toBe('');
  });

  it('P1: non-empty values → badges updated (not removed)', () => {
    applyMetadataToCoverBlocks({
      namaGuru: 'Prof. New Guru',
      namaSekolah: 'SMPN 5 Jakarta',
      judulPertemuan: 'New Module Title',
    });

    const newPages = sharedState.setStateCalls[0].pages;
    const coverBlock = newPages[0].schema.blocks.find((b: any) => b.type === 'cover');
    expect(coverBlock.title).toBe('New Module Title');
    expect(coverBlock.badges.find((b: any) => b.icon === '👨\u200d🏫')?.text).toBe('Prof. New Guru');
    expect(coverBlock.badges.find((b: any) => b.icon === '🏫')?.text).toBe('SMPN 5 Jakarta');
  });

  it('P1: unknown badge preserved when other fields change', () => {
    applyMetadataToCoverBlocks({
      namaGuru: 'New Guru Name',
    });

    const newPages = sharedState.setStateCalls[0].pages;
    const coverBlock = newPages[0].schema.blocks.find((b: any) => b.type === 'cover');
    const customBadge = coverBlock.badges.find((b: any) => b.text === 'CUSTOM BADGE');
    expect(customBadge).toBeDefined();
  });

  it('P1: unknown badge preserved when fields cleared', () => {
    applyMetadataToCoverBlocks({
      namaGuru: '',
      namaSekolah: '',
      judulPertemuan: '',
    });

    const newPages = sharedState.setStateCalls[0].pages;
    const coverBlock = newPages[0].schema.blocks.find((b: any) => b.type === 'cover');
    const customBadge = coverBlock.badges.find((b: any) => b.text === 'CUSTOM BADGE');
    expect(customBadge).toBeDefined();
  });

  it('currentPageIndex not changed by applyMetadataToCoverBlocks', () => {
    applyMetadataToCoverBlocks({
      namaGuru: 'Test Guru',
    });

    const partial = sharedState.setStateCalls[0];
    expect(partial.currentPageIndex).toBeUndefined();
  });

  it('multi cover blocks across different pages all updated', () => {
    sharedState.pages.push(
      makePage(6, 'cover', [
        makeCoverBlock('cover-2', 'Second Cover', [
          { icon: '🏫', text: 'Second SMP', color: 'c' },
        ]),
      ]),
    );

    applyMetadataToCoverBlocks({
      namaSekolah: 'Updated SMP',
    });

    const newPages = sharedState.setStateCalls[0].pages;
    const cover1 = newPages[0].schema.blocks.find((b: any) => b.type === 'cover');
    expect(cover1.badges.find((b: any) => b.icon === '🏫')?.text).toBe('Updated SMP');
    const cover2 = newPages[6].schema.blocks.find((b: any) => b.type === 'cover');
    expect(cover2.badges.find((b: any) => b.icon === '🏫')?.text).toBe('Updated SMP');
  });
});
