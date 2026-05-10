'use client';

import { Settings2, Trash2, Copy, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { ELEMENT_TYPE_COLORS } from '@/lib/canva-icon-maps';
import { LAYOUT_VARIANTS, type LayoutVariant } from '@/components/shared/PresetModuleCard';
import { toast } from 'sonner';
import type { CanvaElement } from '../types';
import PropInput from './PropInput';
import DataIdxSelector from './DataIdxSelector';

interface ElementPropertiesProps {
  selectedEl: CanvaElement;
  updateElement: (id: string, updates: Partial<CanvaElement>) => void;
  deleteSelected: () => void;
}

export default function ElementProperties({ selectedEl, updateElement, deleteSelected }: ElementPropertiesProps) {
  return (
    <div className="border-b border-amber-500/10">
      <div className="px-3 py-2 flex items-center gap-1.5 bg-amber-500/5">
        <Settings2 size={12} className="text-amber-400" />
        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Properti Elemen</span>
      </div>
      <div className="px-3 pb-3 pt-2 space-y-1">
        {/* Element badge */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: ELEMENT_TYPE_COLORS[selectedEl.type] || '#888' }}
          />
          <span className="text-[11px] font-bold text-slate-200 truncate">
            {selectedEl.icon} {selectedEl.label || selectedEl.type}
          </span>
          {/* Quick duplicate */}
          <button
            onClick={() => {
              const store = useCanvaStore.getState();
              const pages = store.pages;
              const page = pages[store.currentPageIndex];
              if (!page) return;
              const newEl: typeof selectedEl = {
                ...selectedEl,
                id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                x: selectedEl.x + 2,
                y: selectedEl.y + 2,
              };
              store._pushHistory();
              const isOverlay = (page.overlayElements || []).some(oe => oe.id === selectedEl.id);
              const newPages = [...pages];
              if (isOverlay) {
                newPages[store.currentPageIndex] = {
                  ...page,
                  overlayElements: [...(page.overlayElements || []), newEl],
                };
              } else {
                newPages[store.currentPageIndex] = {
                  ...page,
                  elements: [...page.elements, newEl],
                };
              }
              useCanvaStore.setState({ pages: newPages, selectedElId: newEl.id, selectedElIds: [newEl.id] });
              toast.success('Elemen diduplikasi');
            }}
            className="btn-ghost w-6 h-6 ml-auto"
            title="Duplikat elemen"
          >
            <Copy size={10} />
          </button>
        </div>

        {/* Position & size */}
        <PropInput label="X" value={Math.round(selectedEl.x)} onChange={v => updateElement(selectedEl.id, { x: v })} />
        <PropInput label="Y" value={Math.round(selectedEl.y)} onChange={v => updateElement(selectedEl.id, { y: v })} />
        <PropInput label="Lebar" value={Math.round(selectedEl.w)} onChange={v => updateElement(selectedEl.id, { w: v })} />
        <PropInput label="Tinggi" value={Math.round(selectedEl.h)} onChange={v => updateElement(selectedEl.id, { h: v })} />
        <PropInput label="Opacity" value={selectedEl.opacity || 100} min={0} max={100} onChange={v => updateElement(selectedEl.id, { opacity: v })} />

        {/* Teks-specific props */}
        {selectedEl.type === 'teks' && (
          <>
            <PropInput label="Font" value={selectedEl.fontSize || 20} min={8} max={72} onChange={v => updateElement(selectedEl.id, { fontSize: v })} />
            {/* Font weight */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-500 w-14">Tebal</span>
              <div className="flex gap-0.5 flex-1">
                {[400, 700, 900].map(w => (
                  <button
                    key={w}
                    onClick={() => updateElement(selectedEl.id, { fontWeight: w })}
                    className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-colors ${
                      (selectedEl.fontWeight || 700) === w
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800/40 text-slate-400 border border-slate-700/20 hover:border-slate-600'
                    }`}
                  >
                    {w === 400 ? 'Ringan' : w === 700 ? 'Sedang' : 'Tebal'}
                  </button>
                ))}
              </div>
            </div>
            {/* Text alignment */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-500 w-14">Rata</span>
              <div className="flex gap-0.5 flex-1">
                {([
                  { val: 'left' as const, icon: '⬅' },
                  { val: 'center' as const, icon: '⬌' },
                  { val: 'right' as const, icon: '➡' },
                ]).map(a => (
                  <button
                    key={a.val}
                    onClick={() => updateElement(selectedEl.id, { textAlign: a.val })}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      (selectedEl.textAlign || 'left') === a.val
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800/40 text-slate-400 border border-slate-700/20 hover:border-slate-600'
                    }`}
                  >
                    {a.icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-500 w-14">Warna</span>
              <input
                type="color"
                value={selectedEl.textColor?.startsWith('#') ? selectedEl.textColor : '#ffffff'}
                onChange={e => updateElement(selectedEl.id, { textColor: e.target.value })}
                className="flex-1 h-7 rounded-lg border border-slate-700/30 cursor-pointer bg-slate-800/60"
              />
            </div>
          </>
        )}

        {/* Shape-specific props */}
        {selectedEl.type === 'shape' && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-500 w-14">Warna</span>
              <input
                type="color"
                value={selectedEl.color?.startsWith('#') ? selectedEl.color : '#ffffff'}
                onChange={e => updateElement(selectedEl.id, { color: e.target.value })}
                className="flex-1 h-7 rounded-lg border border-slate-700/30 cursor-pointer bg-slate-800/60"
              />
            </div>
            <PropInput label="Radius" value={selectedEl.radius || 8} min={0} max={50} onChange={v => updateElement(selectedEl.id, { radius: v })} />
          </>
        )}

        {/* Image-specific props */}
        {selectedEl.type === 'image' && (
          <>
            <div className="mb-2">
              <label className="text-[10px] text-slate-500 block mb-1">URL Gambar</label>
              <input
                type="text"
                value={selectedEl.imageUrl || ''}
                onChange={e => updateElement(selectedEl.id, { imageUrl: e.target.value })}
                placeholder="https://... atau tempel URL"
                className="w-full h-7 px-2 text-[10px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div className="mb-2">
              <label className="text-[10px] text-slate-500 block mb-1">Atau Upload File</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error('Ukuran file maks 2MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    updateElement(selectedEl.id, { imageUrl: dataUrl });
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full text-[9px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-orange-500/20 file:text-orange-300 hover:file:bg-orange-500/30 file:cursor-pointer"
              />
              <span className="text-[8px] text-slate-600">Maks 2MB (disimpan sebagai base64)</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-500 w-14">Paskan</span>
              <div className="flex gap-0.5 flex-1">
                {([
                  { val: 'cover' as const, label: 'Cover' },
                  { val: 'contain' as const, label: 'Contain' },
                  { val: 'fill' as const, label: 'Fill' },
                  { val: 'none' as const, label: 'Asli' },
                ]).map(f => (
                  <button
                    key={f.val}
                    onClick={() => updateElement(selectedEl.id, { imageFit: f.val })}
                    className={`flex-1 py-1 rounded-lg text-[8px] font-bold transition-colors ${
                      (selectedEl.imageFit || 'cover') === f.val
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'bg-slate-800/40 text-slate-400 border border-slate-700/20 hover:border-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Data reference — dropdown with module names */}
        {(selectedEl.type === 'kuis' || selectedEl.type === 'game' || selectedEl.type === 'modul') && (
          <DataIdxSelector
            elementType={selectedEl.type}
            currentIdx={selectedEl.dataIdx ?? -1}
            onChange={(idx, stableId) => updateElement(selectedEl.id, { dataIdx: idx, ...(stableId ? (selectedEl.type === 'kuis' ? { kuisId: stableId } : { moduleId: stableId }) : {}) })}
          />
        )}

        {/* Layout Variant Picker for modul/materi elements */}
        {(selectedEl.type === 'modul' || selectedEl.type === 'materi') && (
          <div className="mt-2 mb-1">
            <label className="text-[10px] text-slate-500 block mb-1">Layout Variant</label>
            <div className="flex gap-1">
              {LAYOUT_VARIANTS.map(v => {
                const current = (selectedEl.layoutVariant as LayoutVariant) || 'A';
                return (
                  <button
                    key={v.id}
                    onClick={() => updateElement(selectedEl.id, { layoutVariant: v.id })}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-colors ${
                      current === v.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
                    }`}
                    title={v.desc}
                  >
                    {v.icon} {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Z-Order controls */}
        <div className="mt-2 mb-1">
          <label className="text-[10px] text-slate-500 block mb-1">Urutan Layer</label>
          <div className="flex gap-1">
            {[
              { dir: 'top' as const, icon: <ChevronsUp size={10} />, label: 'Paling Depan', shortcut: '⌘⇧]' },
              { dir: 'up' as const, icon: <ArrowUp size={10} />, label: 'Maju 1 Layer', shortcut: '⌘]' },
              { dir: 'down' as const, icon: <ArrowDown size={10} />, label: 'Mundur 1 Layer', shortcut: '⌘[' },
              { dir: 'bottom' as const, icon: <ChevronsDown size={10} />, label: 'Paling Belakang', shortcut: '⌘⇧[' },
            ].map(item => (
              <button
                key={item.dir}
                onClick={() => useCanvaStore.getState().moveElementZ(selectedEl.id, item.dir)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/20 hover:border-slate-600 text-slate-400 hover:text-slate-200 transition-colors flex flex-col items-center gap-0.5"
                title={`${item.label} (${item.shortcut})`}
              >
                {item.icon}
                <span className="text-[7px]">{item.dir === 'top' ? 'Depan' : item.dir === 'up' ? '↑' : item.dir === 'down' ? '↓' : 'Belakang'}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={deleteSelected}
          className="btn-danger w-full mt-3"
        >
          <Trash2 size={12} />
          Hapus Elemen
        </button>
      </div>
    </div>
  );
}
