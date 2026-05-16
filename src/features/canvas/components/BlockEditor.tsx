/**
 * SILSE — Inline Block Editor
 * Double-click a block to edit its content inline.
 *
 * Task #8: Inline content editing for blocks.
 * - Double-click opens inline editor for title/content
 * - Edit mode is tracked in SessionInteractionState (ephemeral, never persisted)
 * - Changes commit through the transaction system on blur or Enter
 * - Escape cancels the edit
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvaStore } from '../../../store/canva-store';
import type { SchemaBlock } from '../../../core/schema/types';

// ─── Editable Field ────────────────────────────────────────────────────

interface EditableFieldProps {
  value: string;
  onChange: (newValue: string) => void;
  onCancel: () => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  autoFocus?: boolean;
}

function EditableField({
  value,
  onChange,
  onCancel,
  placeholder = 'Klik untuk menulis...',
  multiline = false,
  className = '',
  autoFocus = true,
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const commit = useCallback(() => {
    if (localValue !== value) {
      onChange(localValue);
    }
    onCancel(); // Exit edit mode
  }, [localValue, value, onChange, onCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Enter' && e.shiftKey && multiline) {
      // Allow shift+enter for new line in multiline
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      commit();
    }
  }, [commit, onCancel, multiline]);

  const sharedProps = {
    value: localValue,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setLocalValue(e.target.value),
    onBlur: commit,
    onKeyDown: handleKeyDown,
    placeholder,
    className: `w-full bg-white/90 border border-indigo-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 outline-none focus:ring-1 focus:ring-indigo-400 resize-none ${className}`,
  };

  if (multiline) {
    return <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} rows={3} {...sharedProps} />;
  }

  return <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />;
}

// ─── Block Editor ──────────────────────────────────────────────────────

interface BlockEditorProps {
  block: SchemaBlock;
  isEditing: boolean;
  onStartEdit: (blockId: string) => void;
  onStopEdit: () => void;
}

/**
 * Inline editor for block content.
 * Renders editable fields based on the block type.
 * Only visible when isEditing is true.
 */
export function BlockEditor({ block, isEditing, onStartEdit, onStopEdit }: BlockEditorProps) {
  const { updateSchemaBlock } = useCanvaStore();

  const handleUpdate = useCallback((field: string, value: string) => {
    if (block.id) updateSchemaBlock(block.id, { [field]: value });
  }, [block.id, updateSchemaBlock]);

  if (!isEditing) return null;

  // Determine which fields are editable based on block type
  const editableFields = getEditableFields(block.type);

  return (
    <div className="bg-indigo-50/80 border border-indigo-200 rounded-md p-2 space-y-1.5 mt-1" onClick={e => e.stopPropagation()}>
      <div className="text-[8px] text-indigo-400 font-medium uppercase tracking-wide flex items-center justify-between">
        <span>Edit Mode</span>
        <button
          onClick={onStopEdit}
          className="text-indigo-400 hover:text-indigo-600 bg-transparent border-none cursor-pointer text-[10px]"
        >
          Selesai ✓
        </button>
      </div>

      {editableFields.map(field => (
        <div key={field.key}>
          <label className="text-[8px] text-indigo-500 block mb-0.5">{field.label}</label>
          <EditableField
            value={(block as unknown as Record<string, unknown>)[field.key] as string ?? ''}
            onChange={(newValue) => handleUpdate(field.key, newValue)}
            onCancel={onStopEdit}
            placeholder={field.placeholder}
            multiline={field.multiline}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Field Definitions ─────────────────────────────────────────────────

interface EditableFieldDef {
  key: string;
  label: string;
  placeholder: string;
  multiline: boolean;
}

function getEditableFields(blockType: string): EditableFieldDef[] {
  switch (blockType) {
    case 'cover':
    case 'hero':
      return [
        { key: 'title', label: 'Judul', placeholder: 'Masukkan judul...', multiline: false },
        { key: 'subtitle', label: 'Subjudul', placeholder: 'Masukkan subjudul...', multiline: false },
      ];

    case 'materi-section':
      return [
        { key: 'title', label: 'Judul Materi', placeholder: 'Masukkan judul materi...', multiline: false },
        { key: 'content', label: 'Konten', placeholder: 'Tulis konten materi...', multiline: true },
      ];

    case 'def-box':
      return [
        { key: 'title', label: 'Judul Definisi', placeholder: 'Masukkan judul...', multiline: false },
        { key: 'content', label: 'Isi Definisi', placeholder: 'Tulis definisi...', multiline: true },
      ];

    case 'kuis':
      return [
        { key: 'title', label: 'Judul Kuis', placeholder: 'Masukkan judul kuis...', multiline: false },
      ];

    case 'kuis-item':
      return [
        { key: 'content', label: 'Pertanyaan', placeholder: 'Tulis pertanyaan...', multiline: true },
      ];

    case 'text-block':
      return [
        { key: 'title', label: 'Judul', placeholder: 'Masukkan judul (opsional)...', multiline: false },
        { key: 'content', label: 'Konten', placeholder: 'Tulis konten teks...', multiline: true },
      ];

    case 'note-callout':
      return [
        { key: 'title', label: 'Judul Catatan', placeholder: 'Masukkan judul...', multiline: false },
        { key: 'content', label: 'Isi Catatan', placeholder: 'Tulis catatan...', multiline: true },
      ];

    case 'petunjuk':
      return [
        { key: 'title', label: 'Judul Petunjuk', placeholder: 'Masukkan judul...', multiline: false },
        { key: 'content', label: 'Isi Petunjuk', placeholder: 'Tulis petunjuk...', multiline: true },
      ];

    case 'diskusi':
    case 'refleksi':
    case 'skenario':
      return [
        { key: 'title', label: 'Judul', placeholder: 'Masukkan judul...', multiline: false },
        { key: 'content', label: 'Deskripsi', placeholder: 'Tulis deskripsi...', multiline: true },
      ];

    case 'game':
      return [
        { key: 'title', label: 'Judul Game', placeholder: 'Masukkan judul game...', multiline: false },
        { key: 'content', label: 'Deskripsi', placeholder: 'Deskripsi singkat game...', multiline: true },
      ];

    case 'image-block':
      return [
        { key: 'title', label: 'Judul', placeholder: 'Masukkan judul gambar...', multiline: false },
        { key: 'imageUrl', label: 'URL Gambar', placeholder: 'https://...', multiline: false },
        { key: 'altText', label: 'Alt Text', placeholder: 'Deskripsi alternatif...', multiline: false },
      ];

    case 'ftab-container':
      return [
        { key: 'title', label: 'Judul Tab Container', placeholder: 'Masukkan judul...', multiline: false },
      ];

    case 'penutup':
      return [
        { key: 'title', label: 'Judul Penutup', placeholder: 'Masukkan judul...', multiline: false },
        { key: 'content', label: 'Konten', placeholder: 'Tulis konten penutup...', multiline: true },
      ];

    default:
      return [
        { key: 'title', label: 'Judul', placeholder: 'Masukkan judul...', multiline: false },
        { key: 'content', label: 'Konten', placeholder: 'Tulis konten...', multiline: true },
      ];
  }
}
