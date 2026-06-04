'use client';

import { useRef, useState } from 'react';
// All icons migrated to Material Symbols Outlined
import { useCanvaStore } from '@/store/canva-store';
import { GRADIENT_PRESETS } from '../types';
import Section from './Section';
import type { ScreenSchema } from '@/core/schema/types';
import { THEME_PRESETS } from '@/core/themes/tokens';

/** Schema background type for updates */
type SchemaBg = NonNullable<ScreenSchema['background']>

export default function BackgroundSection() {
  // ── Store selectors ──────────────────────────────────────────
  const setBgColor = useCanvaStore(s => s.setBgColor);
  const setBgImage = useCanvaStore(s => s.setBgImage);
  const setOverlay = useCanvaStore(s => s.setOverlay);
  const updateScreenBackground = useCanvaStore(s => s.updateScreenBackground);
  const setSchemaThemeId = useCanvaStore(s => s.setSchemaThemeId);

  // ── Derived page data ────────────────────────────────────────
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);

  // ── Local UI state ───────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // ── Derived values from page ─────────────────────────────────
  const isSchemaDriven = !!page?.schema;
  const schemaBg = page?.schema?.background;
  // D-P0B.1: Read schema.themeId first (canonical), fallback to templateData.schemaThemeId (legacy bridge)
  const schemaThemeId = page?.schema?.themeId || (page?.templateData?.schemaThemeId as string) || undefined;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      // P0 fix: schema page → write to schema.background.imageUrl
      // Legacy page → write to page.bgDataUrl
      if (isSchemaDriven) {
        updateScreenBackground({ imageUrl: dataUrl, overlay: schemaBg?.overlay ?? 40 });
      } else {
        setBgImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlSubmit = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (isSchemaDriven) {
      updateScreenBackground({ imageUrl: url, overlay: schemaBg?.overlay ?? 40 });
    }
    setImageUrlInput('');
  };

  const handleRemoveImageUrl = () => {
    if (isSchemaDriven) {
      updateScreenBackground({ imageUrl: undefined });
    }
  };

  const handleBgTypeChange = (type: SchemaBg['type']) => {
    if (isSchemaDriven) {
      updateScreenBackground({ type });
    }
  };

  const handleSchemaOverlayChange = (val: number) => {
    if (isSchemaDriven) {
      updateScreenBackground({ overlay: val });
    }
  };

  const handleSchemaColorChange = (key: 'color1' | 'color2', value: string) => {
    if (isSchemaDriven) {
      updateScreenBackground({ [key]: value });
    }
  };

  // ── Sprint 1G: Background image property handlers ───────────
  const handleImageFitChange = (fit: 'cover' | 'contain') => {
    if (isSchemaDriven) {
      updateScreenBackground({ imageFit: fit });
    }
  };

  const handleImageOpacityChange = (opacity: number) => {
    if (isSchemaDriven) {
      updateScreenBackground({ imageOpacity: opacity });
    }
  };

  const handleImageBlurChange = (blur: number) => {
    if (isSchemaDriven) {
      updateScreenBackground({ imageBlur: blur });
    }
  };

  const handleOverlayTypeChange = (type: 'dark' | 'light' | 'gradient') => {
    if (isSchemaDriven) {
      updateScreenBackground({ overlayType: type });
    }
  };

  // ── Schema-driven page: show schema background controls ──
  if (isSchemaDriven) {
    return (
      <Section
        icon={<span className="material-symbols-outlined" style={{ fontSize: '12px' }}>image</span>}
        title="Background"
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      >
        {/* Theme preset selector */}
        <div className="mb-3">
          <label className="text-[10px] text-silse-on-surface-variant block mb-1">🎨 Tema Warna</label>
          <div className="grid grid-cols-3 gap-1">
            {THEME_PRESETS.map(t => (
              <button
                key={t.id}
                onClick={() => setSchemaThemeId(t.id)}
                className={`py-1.5 px-1 rounded-lg text-[8px] font-bold transition-[background-color,border-color,color] border ${
                  schemaThemeId === t.id || (!schemaThemeId && t.id === 'default')
                    ? 'border-silse-primary bg-silse-primary/20 text-silse-primary'
                    : 'border-silse-outline-variant bg-silse-surface-container-low text-silse-on-surface-variant hover:border-silse-outline-variant'
                }`}
                title={t.name}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Background type selector */}
        <div className="mb-2">
          <label className="text-[10px] text-silse-on-surface-variant block mb-1">Tipe Background</label>
          <div className="flex gap-1">
            {(['solid', 'gradient', 'radial'] as const).map(t => (
              <button
                key={t}
                onClick={() => handleBgTypeChange(t)}
                className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] ${
                  schemaBg?.type === t
                    ? 'bg-silse-primary/20 text-silse-primary border border-silse-primary/40'
                    : 'bg-silse-surface-container-low text-silse-on-surface-variant border border-silse-outline-variant hover:border-silse-outline-variant'
                }`}
              >
                {t === 'solid' ? 'Solid' : t === 'gradient' ? 'Gradient' : 'Radial'}
              </button>
            ))}
          </div>
        </div>

        {/* Color pickers based on type */}
        <div className="flex gap-2 mb-2">
          {(schemaBg?.type === 'solid' || schemaBg?.type === 'gradient' || schemaBg?.type === 'radial') && (
            <div className="flex-1">
              <label className="text-[10px] text-silse-on-surface-variant block mb-1">
                {schemaBg?.type === 'solid' ? 'Warna' : 'Warna 1'}
              </label>
              <select
                value={schemaBg?.color1 || 'bg'}
                onChange={e => handleSchemaColorChange('color1', e.target.value)}
                className="w-full h-7 rounded-lg border border-silse-outline-variant bg-silse-surface-container-low text-[10px] text-silse-on-surface px-1"
              >
                {COLOR_TOKENS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          {(schemaBg?.type === 'gradient' || schemaBg?.type === 'radial') && (
            <div className="flex-1">
              <label className="text-[10px] text-silse-on-surface-variant block mb-1">Warna 2</label>
              <select
                value={schemaBg?.color2 || 'bg'}
                onChange={e => handleSchemaColorChange('color2', e.target.value)}
                className="w-full h-7 rounded-lg border border-silse-outline-variant bg-silse-surface-container-low text-[10px] text-silse-on-surface px-1"
              >
                {COLOR_TOKENS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ══ Sprint 1G: Background Image Section ══════════════════ */}
        <div className="border-t border-silse-outline-variant/40 pt-2 mt-2">
          <label className="text-[10px] font-bold text-silse-on-surface block mb-1.5">
            🖼️ Gambar Latar
          </label>

          {/* File upload button — P0 fix: writes to schema.background.imageUrl */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 rounded-xl border border-dashed border-silse-outline-variant hover:border-silse-primary/30 bg-silse-surface-container-low hover:bg-silse-surface-container-lowest transition-colors flex flex-col items-center gap-0.5 mb-2"
          >
            <span className="material-symbols-outlined text-silse-on-surface-variant" style={{ fontSize: '14px' }}>upload</span>
            <span className="text-[9px] font-bold text-silse-on-surface-variant">Upload Gambar</span>
          </button>

          {/* Image URL input */}
          <div className="mb-2">
            <div className="flex gap-1">
              <div className="flex-1 flex items-center gap-1 bg-silse-surface-container-low border border-silse-outline-variant rounded-lg px-2 h-7">
                <span className="material-symbols-outlined text-silse-on-surface-variant flex-shrink-0" style={{ fontSize: '10px' }}>link</span>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleImageUrlSubmit()}
                  placeholder="https://..."
                  className="flex-1 bg-transparent text-[10px] text-silse-on-surface outline-none placeholder:text-silse-on-surface-variant/40"
                />
              </div>
              <button
                onClick={handleImageUrlSubmit}
                disabled={!imageUrlInput.trim()}
                className="px-2 h-7 rounded-lg bg-silse-primary/20 text-silse-primary text-[9px] font-bold disabled:opacity-30 hover:bg-silse-primary/30 transition-colors"
              >
                Set
              </button>
            </div>
            {/* Show current image URL */}
            {schemaBg?.imageUrl && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 bg-silse-surface-container-low border border-silse-outline-variant rounded-lg px-2 py-1 overflow-hidden">
                  <span className="text-[8px] text-silse-on-surface-variant truncate block">{schemaBg.imageUrl}</span>
                </div>
                <button
                  onClick={handleRemoveImageUrl}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                  title="Hapus gambar"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>close</span>
                </button>
              </div>
            )}
          </div>

          {/* Sprint 1G: Image controls (only when image is set) */}
          {schemaBg?.imageUrl && (
            <>
              {/* Image fit toggle */}
              <div className="mb-2">
                <label className="text-[10px] text-silse-on-surface-variant block mb-1">Ukuran Gambar</label>
                <div className="flex gap-1">
                  {(['cover', 'contain'] as const).map(fit => (
                    <button
                      key={fit}
                      onClick={() => handleImageFitChange(fit)}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] ${
                        (schemaBg?.imageFit ?? 'cover') === fit
                          ? 'bg-silse-primary/20 text-silse-primary border border-silse-primary/40'
                          : 'bg-silse-surface-container-low text-silse-on-surface-variant border border-silse-outline-variant hover:border-silse-outline-variant'
                      }`}
                    >
                      {fit === 'cover' ? 'Penuh (Cover)' : 'Proporsional (Contain)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image opacity slider */}
              <div className="mb-2">
                <label className="text-[10px] text-silse-on-surface-variant block mb-1">
                  Transparansi: {100 - (schemaBg?.imageOpacity ?? 100)}%
                </label>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={schemaBg?.imageOpacity ?? 100}
                  onChange={e => handleImageOpacityChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Image blur slider */}
              <div className="mb-2">
                <label className="text-[10px] text-silse-on-surface-variant block mb-1">
                  Blur: {schemaBg?.imageBlur ?? 0}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={schemaBg?.imageBlur ?? 0}
                  onChange={e => handleImageBlurChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* ══ Sprint 1G: Overlay/scrim controls ════════════════ */}
              <div className="border-t border-silse-outline-variant/40 pt-2 mt-2">
                <label className="text-[10px] font-bold text-silse-on-surface block mb-1.5">
                  🔲 Overlay / Scrim
                </label>

                {/* Overlay type toggle */}
                <div className="mb-2">
                  <label className="text-[10px] text-silse-on-surface-variant block mb-1">Tipe Overlay</label>
                  <div className="flex gap-1">
                    {([
                      { value: 'dark' as const, label: 'Gelap' },
                      { value: 'light' as const, label: 'Terang' },
                      { value: 'gradient' as const, label: 'Gradien' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleOverlayTypeChange(opt.value)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] ${
                          (schemaBg?.overlayType ?? 'dark') === opt.value
                            ? 'bg-silse-primary/20 text-silse-primary border border-silse-primary/40'
                            : 'bg-silse-surface-container-low text-silse-on-surface-variant border border-silse-outline-variant hover:border-silse-outline-variant'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overlay opacity slider */}
                <div className="mb-2">
                  <label className="text-[10px] text-silse-on-surface-variant block mb-1">
                    Intensitas Overlay: {schemaBg?.overlay ?? 40}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={schemaBg?.overlay ?? 40}
                    onChange={e => handleSchemaOverlayChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Section>
    );
  }

  // ── Non-schema (legacy) page: show original controls ──
  return (
    <Section
      icon={<span className="material-symbols-outlined" style={{ fontSize: '12px' }}>image</span>}
      title="Background"
      collapsed={collapsed}
      onToggle={() => setCollapsed(c => !c)}
    >
      {/* Upload area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2.5 rounded-xl border border-dashed border-silse-outline-variant hover:border-amber-500/30 bg-silse-surface-container-low hover:bg-silse-surface-container-lowest transition-colors flex flex-col items-center gap-1"
      >
        <span className="material-symbols-outlined text-silse-on-surface-variant" style={{ fontSize: '16px' }}>upload</span>
        <span className="text-[9px] font-bold text-silse-on-surface-variant">Upload PNG Canva</span>
        <span className="text-[7px] text-silse-on-surface-variant">Warna otomatis dari gambar</span>
      </button>

      {/* Preview thumbnail */}
      {page?.bgDataUrl && (
        <div className="mt-2 rounded-xl overflow-hidden border border-silse-outline-variant">
          <img src={page.bgDataUrl} alt="BG Preview" className="w-full h-14 object-cover" />
        </div>
      )}

      {/* Overlay slider */}
      <div className="mt-2">
        <label className="text-[10px] text-silse-on-surface-variant block mb-1">Overlay gelap: {page?.overlay || 20}%</label>
        <input
          type="range"
          min={0}
          max={60}
          value={page?.overlay || 20}
          onChange={e => setOverlay(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* BG Color */}
      <div className="mt-2">
        <label className="text-[10px] text-silse-on-surface-variant block mb-1">Warna BG</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={page?.bgColor?.startsWith('#') ? page.bgColor : '#ffffff'}
            onChange={e => setBgColor(e.target.value)}
            className="w-full h-7 rounded-lg border border-silse-outline-variant cursor-pointer bg-silse-surface-container-low flex-1"
          />
          {page?.bgColor && !page.bgColor.startsWith('#') && (
            <div className="w-7 h-7 rounded-lg border border-silse-outline-variant flex-shrink-0"
              style={{ background: page.bgColor }}
              title="Gradient aktif — klik warna untuk override"
            />
          )}
        </div>
      </div>

      {/* Gradient Presets — moved from LeftPanel Tab Template */}
      <div className="mt-3">
        <label className="text-[10px] text-silse-on-surface-variant block mb-1.5">Gradient Presets</label>
        <div className="grid grid-cols-5 gap-1">
          {GRADIENT_PRESETS.map(g => (
            <button
              key={g.id}
              onClick={() => setBgColor(g.css)}
              className={`w-full aspect-square rounded-lg border transition-[transform,background-color,border-color] hover:scale-[1.05] ${
                page?.bgColor === g.css
                  ? 'border-amber-400 ring-1 ring-amber-400/50'
                  : 'border-silse-outline-variant hover:border-silse-outline-variant'
              }`}
              style={{ background: g.css }}
              title={g.name}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── Color token options for schema background ──────────────
const COLOR_TOKENS = [
  { key: 'bg', label: 'Default (bg)' },
  { key: 'bg2', label: 'BG Secondary' },
  { key: 'y', label: '🟡 Kuning' },
  { key: 'c', label: '🔵 Cyan' },
  { key: 'g', label: '🟢 Hijau' },
  { key: 'p', label: '🟣 Ungu' },
  { key: 'r', label: '🔴 Merah' },
  { key: 'o', label: '🟠 Oranye' },
  { key: 'text', label: 'Teks' },
  { key: 'muted', label: 'Muted' },
];
