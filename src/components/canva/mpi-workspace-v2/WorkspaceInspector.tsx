'use client';

import React, { useMemo, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { getBlockFields, FALLBACK_FIELDS } from './inspector-field-registry';
import { QuestionsFieldEditor, type KuisQuestion } from './QuestionsFieldEditor';
import { SortItemsFieldEditor, type SortItemsValue } from './SortItemsFieldEditor';
import { ReflectionQuestionsFieldEditor } from './ReflectionQuestionsFieldEditor';

export function WorkspaceInspector() {
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);

  const page = pages[currentPageIndex];

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId || !page?.schema?.blocks) return null;
    return page.schema.blocks.find((b) => b.id === selectedBlockId) || null;
  }, [selectedBlockId, page]);

  const fieldConfig = useMemo(() => {
    if (!selectedBlock) return null;
    return getBlockFields(selectedBlock.type) ?? FALLBACK_FIELDS;
  }, [selectedBlock]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    if (!selectedBlockId) return;
    updateSchemaBlock(selectedBlockId, { [key]: value } as never, { source: 'user' });
  }, [selectedBlockId, updateSchemaBlock]);

  // BATCH-07A: Specialized handler for questions field — value is an
  // array of KuisQuestion, not a string. Routes through the same
  // updateSchemaBlock to keep single write path.
  const handleQuestionsChange = useCallback((questions: KuisQuestion[]) => {
    if (!selectedBlockId) return;
    updateSchemaBlock(selectedBlockId, { questions } as never, { source: 'user' });
  }, [selectedBlockId, updateSchemaBlock]);

  // BATCH-07B: Handler for sortir-game sortItems field. The editor
  // returns { pool, kolom } — we patch BOTH fields in one call by
  // passing them as a single object (updateSchemaBlock merges the
  // patch into the block).
  const handleSortItemsChange = useCallback((value: SortItemsValue) => {
    if (!selectedBlockId) return;
    updateSchemaBlock(selectedBlockId, { pool: value.pool, kolom: value.kolom } as never, { source: 'user' });
  }, [selectedBlockId, updateSchemaBlock]);

  // BATCH-07B: Handler for diskusi/refleksi questions field. Same
  // shape as kuis questions (array of objects) but different item
  // structure. Routes through the same updateSchemaBlock.
  const handleReflectionQuestionsChange = useCallback((questions: unknown[]) => {
    if (!selectedBlockId) return;
    updateSchemaBlock(selectedBlockId, { questions } as never, { source: 'user' });
  }, [selectedBlockId, updateSchemaBlock]);

  const blockFields = (selectedBlock as unknown as Record<string, unknown>) || {};

  return (
    <aside
      className="w-80 min-w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto"
      aria-label="Panel edit"
    >
      <div className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
        <h2 className="text-sm font-semibold text-slate-800">
          {selectedBlock ? `Edit ${fieldConfig?.displayName ?? 'Bagian'}` : 'Pengaturan Halaman'}
        </h2>
      </div>

      <div className="flex-1 p-4">
        {selectedBlock && fieldConfig ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>edit</span>
                <span className="text-sm font-medium">{fieldConfig.displayName}</span>
              </div>
            </div>

            {fieldConfig.fields.map((field) => {
              // BATCH-07A: questions field type renders kuis inline editor
              if (field.type === 'questions') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      {field.label}
                    </label>
                    <QuestionsFieldEditor
                      value={blockFields[field.key]}
                      onChange={handleQuestionsChange}
                    />
                    {field.helpText && <p className="text-xs text-slate-400 mt-1.5">{field.helpText}</p>}
                  </div>
                );
              }

              // BATCH-07B: sortItems field type renders sortir-game editor
              if (field.type === 'sortItems') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      {field.label}
                    </label>
                    {/* Pass the entire block so editor can read pool + kolom */}
                    <SortItemsFieldEditor
                      value={selectedBlock}
                      onChange={handleSortItemsChange}
                    />
                    {field.helpText && <p className="text-xs text-slate-400 mt-1.5">{field.helpText}</p>}
                  </div>
                );
              }

              // BATCH-07B: discussionQuestions field type (diskusi)
              if (field.type === 'discussionQuestions') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      {field.label}
                    </label>
                    <ReflectionQuestionsFieldEditor
                      value={blockFields[field.key]}
                      onChange={handleReflectionQuestionsChange}
                      mode="discussion"
                    />
                    {field.helpText && <p className="text-xs text-slate-400 mt-1.5">{field.helpText}</p>}
                  </div>
                );
              }

              // BATCH-07B: reflectionQuestions field type (refleksi)
              if (field.type === 'reflectionQuestions') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      {field.label}
                    </label>
                    <ReflectionQuestionsFieldEditor
                      value={blockFields[field.key]}
                      onChange={handleReflectionQuestionsChange}
                      mode="reflection"
                    />
                    {field.helpText && <p className="text-xs text-slate-400 mt-1.5">{field.helpText}</p>}
                  </div>
                );
              }

              const value = String(blockFields[field.key] ?? '');
              if (field.type === 'textarea') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                    <textarea
                      value={value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
                    />
                    {field.helpText && <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>}
                  </div>
                );
              }
              return (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                  {field.helpText && <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>}
                </div>
              );
            })}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">Perubahan otomatis tersimpan.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '40px' }}>touch_app</span>
              <p className="text-sm text-slate-500 mt-2 font-medium">Pilih bagian di canvas</p>
              <p className="text-xs text-slate-400 mt-1">Klik bagian pada halaman untuk mengedit isi.</p>
            </div>
            {page && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Halaman Aktif</h3>
                <div><label className="text-xs text-slate-400">Label</label><p className="text-sm text-slate-800">{page.label || `Halaman ${currentPageIndex + 1}`}</p></div>
                <div><label className="text-xs text-slate-400">Tipe</label><p className="text-sm text-slate-800 capitalize">{page.templateType || 'custom'}</p></div>
                <div><label className="text-xs text-slate-400">Bagian</label><p className="text-sm text-slate-800">{page.schema?.blocks?.length || 0} blok</p></div>
              </div>
            )}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Style Media</h3>
              <p className="text-xs text-slate-400">Ubah style via tombol "Style" di toolbar atas.</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
