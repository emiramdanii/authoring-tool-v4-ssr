'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Link, X } from 'lucide-react';
import { GRADIENT_PRESETS } from '../types';
import Section from './Section';
import type { CanvaPage } from '../types';
import type { ScreenSchema } from '@/core/schema/types';

/** Schema background type for updates */
type SchemaBg = NonNullable<ScreenSchema['background']>;

interface BackgroundSectionProps {
  page: CanvaPage | undefined;
  setBgColor: (color: string) => void;
  setBgImage: (dataUrl: string) => void;
  setOverlay: (value: number) => void;
  /** Update schema-driven page background */
  updateScreenBackground: (updates: Partial<SchemaBg>) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function BackgroundSection({
  page,
  setBgColor,
  setBgImage,
  setOverlay,
  updateScreenBackground,
  collapsed,
  onToggle,
}: BackgroundSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Determine if this is a schema-driven page
  const isSchemaDriven = !!page?.schema;
  const schemaBg = page?.schema?.background;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setBgImage(dataUrl);
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

  // ── Schema-driven page: show schema background controls ──
  if (isSchemaDriven) {
    return (
      <Section
        icon={<ImageIcon size={12} />}
        title="Background"
        collapsed={collapsed}
        onToggle={onToggle}
      >
        {/* Background type selector */}
        <div className="mb-2">
          <label className="text-[10px] text-app-muted block mb-1">Tipe Background</label>
          <div className="flex gap-1">
            {(['solid', 'gradient', 'radial'] as const).map(t => (
              <button
                key={t}
                onClick={() => handleBgTypeChange(t)}
                className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                  schemaBg?.type === t
                    ? 'bg-app-accent/20 text-app-accent border border-app-accent/40'
                    : 'bg-app-elevated text-app-muted border border-app-border hover:border-app-border-strong'
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
              <label className="text-[10px] text-app-muted block mb-1">
                {schemaBg?.type === 'solid' ? 'Warna' : 'Warna 1'}
              </label>
              <select
                value={schemaBg?.color1 || 'bg'}
                onChange={e => handleSchemaColorChange('color1', e.target.value)}
                className="w-full h-7 rounded-lg border border-app-border bg-app-elevated text-[10px] text-app-text px-1"
              >
                {COLOR_TOKENS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          {(schemaBg?.type === 'gradient' || schemaBg?.type === 'radial') && (
            <div className="flex-1">
              <label className="text-[10px] text-app-muted block mb-1">Warna 2</label>
              <select
                value={schemaBg?.color2 || 'bg'}
                onChange={e => handleSchemaColorChange('color2', e.target.value)}
                className="w-full h-7 rounded-lg border border-app-border bg-app-elevated text-[10px] text-app-text px-1"
              >
                {COLOR_TOKENS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Image URL input */}
        <div className="mb-2">
          <label className="text-[10px] text-app-muted block mb-1">Gambar URL</label>
          <div className="flex gap-1">
            <div className="flex-1 flex items-center gap-1 bg-app-elevated border border-app-border rounded-lg px-2 h-7">
              <Link size={10} className="text-app-muted flex-shrink-0" />
              <input
                type="url"
                value={imageUrlInput}
                onChange={e => setImageUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImageUrlSubmit()}
                placeholder="https://..."
                className="flex-1 bg-transparent text-[10px] text-app-text outline-none placeholder:text-app-muted/40"
              />
            </div>
            <button
              onClick={handleImageUrlSubmit}
              disabled={!imageUrlInput.trim()}
              className="px-2 h-7 rounded-lg bg-app-accent/20 text-app-accent text-[9px] font-bold disabled:opacity-30 hover:bg-app-accent/30 transition-colors"
            >
              Set
            </button>
          </div>
          {/* Show current image URL */}
          {schemaBg?.imageUrl && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex-1 bg-app-elevated border border-app-border rounded-lg px-2 py-1 overflow-hidden">
                <span className="text-[8px] text-app-muted truncate block">{schemaBg.imageUrl}</span>
              </div>
              <button
                onClick={handleRemoveImageUrl}
                className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                title="Hapus gambar"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Overlay slider (only when image is set) */}
        {schemaBg?.imageUrl && (
          <div className="mb-2">
            <label className="text-[10px] text-app-muted block mb-1">
              Overlay gelap: {schemaBg.overlay ?? 40}%
            </label>
            <input
              type="range"
              min={0}
              max={80}
              value={schemaBg.overlay ?? 40}
              onChange={e => handleSchemaOverlayChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </Section>
    );
  }

  // ── Non-schema (legacy) page: show original controls ──
  return (
    <Section
      icon={<ImageIcon size={12} />}
      title="Background"
      collapsed={collapsed}
      onToggle={onToggle}
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
        className="w-full py-2.5 rounded-xl border border-dashed border-app-border hover:border-amber-500/30 bg-app-elevated hover:bg-app-surface transition-colors flex flex-col items-center gap-1"
      >
        <Upload size={16} className="text-app-secondary" />
        <span className="text-[9px] font-bold text-app-secondary">Upload PNG Canva</span>
        <span className="text-[7px] text-app-muted">Warna otomatis dari gambar</span>
      </button>

      {/* Preview thumbnail */}
      {page?.bgDataUrl && (
        <div className="mt-2 rounded-xl overflow-hidden border border-app-border">
          <img src={page.bgDataUrl} alt="BG Preview" className="w-full h-14 object-cover" />
        </div>
      )}

      {/* Overlay slider */}
      <div className="mt-2">
        <label className="text-[10px] text-app-muted block mb-1">Overlay gelap: {page?.overlay || 20}%</label>
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
        <label className="text-[10px] text-app-muted block mb-1">Warna BG</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={page?.bgColor?.startsWith('#') ? page.bgColor : '#1e293b'}
            onChange={e => setBgColor(e.target.value)}
            className="w-full h-7 rounded-lg border border-app-border cursor-pointer bg-app-elevated flex-1"
          />
          {page?.bgColor && !page.bgColor.startsWith('#') && (
            <div className="w-7 h-7 rounded-lg border border-app-border flex-shrink-0"
              style={{ background: page.bgColor }}
              title="Gradient aktif — klik warna untuk override"
            />
          )}
        </div>
      </div>

      {/* Gradient Presets — moved from LeftPanel Tab Template */}
      <div className="mt-3">
        <label className="text-[10px] text-app-muted block mb-1.5">Gradient Presets</label>
        <div className="grid grid-cols-5 gap-1">
          {GRADIENT_PRESETS.map(g => (
            <button
              key={g.id}
              onClick={() => setBgColor(g.css)}
              className={`w-full aspect-square rounded-lg border transition-all hover:scale-110 ${
                page?.bgColor === g.css
                  ? 'border-amber-400 ring-1 ring-amber-400/50'
                  : 'border-app-border hover:border-app-border-strong'
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
