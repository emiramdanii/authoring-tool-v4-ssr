'use client';

import { useRef } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { GRADIENT_PRESETS } from '../types';
import Section from './Section';
import type { CanvaPage } from '../types';

interface BackgroundSectionProps {
  page: CanvaPage | undefined;
  setBgColor: (color: string) => void;
  setBgImage: (dataUrl: string) => void;
  setOverlay: (value: number) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function BackgroundSection({
  page,
  setBgColor,
  setBgImage,
  setOverlay,
  collapsed,
  onToggle,
}: BackgroundSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/30 bg-slate-800/30 hover:bg-slate-800/50 transition-colors flex flex-col items-center gap-1"
      >
        <Upload size={16} className="text-slate-400" />
        <span className="text-[9px] font-bold text-slate-400">Upload PNG Canva</span>
        <span className="text-[7px] text-slate-500">Warna otomatis dari gambar</span>
      </button>

      {/* Preview thumbnail */}
      {page?.bgDataUrl && (
        <div className="mt-2 rounded-xl overflow-hidden border border-slate-700/30">
          <img src={page.bgDataUrl} alt="BG Preview" className="w-full h-14 object-cover" />
        </div>
      )}

      {/* Overlay slider */}
      <div className="mt-2">
        <label className="text-[10px] text-slate-500 block mb-1">Overlay gelap: {page?.overlay || 20}%</label>
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
        <label className="text-[10px] text-slate-500 block mb-1">Warna BG</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={page?.bgColor?.startsWith('#') ? page.bgColor : '#1e293b'}
            onChange={e => setBgColor(e.target.value)}
            className="w-full h-7 rounded-lg border border-slate-700/30 cursor-pointer bg-slate-800/60 flex-1"
          />
          {page?.bgColor && !page.bgColor.startsWith('#') && (
            <div className="w-7 h-7 rounded-lg border border-slate-700/30 flex-shrink-0"
              style={{ background: page.bgColor }}
              title="Gradient aktif — klik warna untuk override"
            />
          )}
        </div>
      </div>

      {/* Gradient Presets — moved from LeftPanel Tab Template */}
      <div className="mt-3">
        <label className="text-[10px] text-slate-500 block mb-1.5">Gradient Presets</label>
        <div className="grid grid-cols-5 gap-1">
          {GRADIENT_PRESETS.map(g => (
            <button
              key={g.id}
              onClick={() => setBgColor(g.css)}
              className={`w-full aspect-square rounded-lg border transition-all hover:scale-110 ${
                page?.bgColor === g.css
                  ? 'border-amber-400 ring-1 ring-amber-400/50'
                  : 'border-slate-700/30 hover:border-slate-600'
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
