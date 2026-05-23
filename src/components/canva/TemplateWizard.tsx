'use client';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE WIZARD — 4-step guided composition for new projects
// ═══════════════════════════════════════════════════════════════════
// Steps:
//   1. Pilih Mata Pelajaran (subject selection)
//   2. Pilih Kelas & Semester (grade & semester)
//   3. Pilih Template (course template card)
//   4. Isi Info Dasar (title, teacher, school)
//
// On "Buat Project": calls createProjectFromTemplate() → sets pages
// in canva store → persists to DB via ProjectManager → closes wizard
// → editor is ready.

import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  FileText,
  Check,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useProjectManager } from '@/hooks/use-project-manager';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';
import {
  SUBJECTS,
  GRADE_OPTIONS,
  SEMESTER_OPTIONS,
  getCourseTemplatesFiltered,
  getTemplateFlowPreview,
  createProjectFromTemplate,
  getTemplateThemeId,
  type CourseTemplate,
  type ProjectMetadata,
} from '@/core/template/CourseTemplateRegistry';

// ── Step indicator ─────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Mata Pelajaran', icon: BookOpen },
  { num: 2, label: 'Kelas & Semester', icon: GraduationCap },
  { num: 3, label: 'Pilih Template', icon: FileText },
  { num: 4, label: 'Info Dasar', icon: Sparkles },
];

// ── Props ──────────────────────────────────────────────────────

interface TemplateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function TemplateWizard({ open, onOpenChange }: TemplateWizardProps) {
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [guru, setGuru] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // ProjectManager for DB persistence
  const { createProject } = useProjectManager();

  // Filtered templates based on subject/grade
  const filteredTemplates = useMemo(
    () => getCourseTemplatesFiltered(subject || undefined, grade || undefined),
    [subject, grade],
  );

  const selectedTemplate = useMemo(
    () => filteredTemplates.find(t => t.id === selectedTemplateId),
    [filteredTemplates, selectedTemplateId],
  );

  // ── Navigation ──────────────────────────────────────────────────

  const canGoNext = useMemo(() => {
    switch (step) {
      case 1: return !!subject;
      case 2: return !!grade && !!semester;
      case 3: return !!selectedTemplateId;
      case 4: return !!title.trim();
      default: return false;
    }
  }, [step, subject, grade, semester, selectedTemplateId, title]);

  const goNext = useCallback(() => {
    if (canGoNext && step < 4) setStep(step + 1);
  }, [canGoNext, step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  // ── Create Project ──────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (!selectedTemplateId || !title.trim()) return;

    setIsCreating(true);
    try {
      const metadata: ProjectMetadata = {
        title: title.trim(),
        guru: guru.trim() || undefined,
        sekolah: sekolah.trim() || undefined,
      };

      const rawPages = createProjectFromTemplate(selectedTemplateId, metadata);

      // Get theme from template
      const themeId = getTemplateThemeId(selectedTemplateId);

      // Apply theme IMMUTABLY — schemas may be deepFrozen in dev mode,
      // so we must create new page objects instead of mutating in place.
      const pages = rawPages.map(page => {
        if (!page.schema) return page;

        const updatedSchema = {
          ...page.schema,
          background: {
            ...(page.schema.background ?? {}),
            type: page.schema.background?.type ?? 'gradient',
          } as NonNullable<import('@/core/schema/types').ScreenSchema['background']>,
        };

        return {
          ...page,
          schema: updatedSchema,
          templateData: { ...page.templateData, schemaThemeId: themeId },
        };
      });

      // Set pages in canva store (replaces current project)
      const store = useCanvaStore.getState();
      store._pushHistory();
      useCanvaStore.setState({
        pages,
        currentPageIndex: 0,
        selectedElId: null,
        selectedElIds: [],
        selectedBlockId: null,
        selectedBlockType: null,
        editingBlockId: null,
        selectedBlockIds: [],
      });

      // Update authoring store metadata so Dashboard reflects the new project
      const authoringStore = useAuthoringStore.getState();
      if (title.trim()) authoringStore.updateMeta('judulPertemuan', title.trim());
      if (subject) authoringStore.updateMeta('mapel', subject);
      if (grade) authoringStore.updateMeta('kelas', grade);
      // Mark as dirty so user is prompted to save
      useAuthoringStore.setState({ dirty: true });

      // Persist to database via ProjectManager
      try {
        await createProject({
          title: title.trim(),
          subject,
          grade,
        });
      } catch (dbErr) {
        // DB save failed — project is still in memory, just log warning
        logger.warn('TemplateWizard', 'DB persist failed, project is in memory only: ' + String(dbErr));
        // Save to localStorage as fallback
        useCanvaStore.getState().saveToStorage();
        useAuthoringStore.getState().saveToStorage();
      }

      toast.success(`Project "${title.trim()}" berhasil dibuat!`);
      onOpenChange(false);

      // Navigate to Canva editor after a short delay (let modal close animation finish)
      setTimeout(() => {
        useAuthoringStore.getState().setActivePanel('canva');
      }, 300);

      // Reset wizard state
      setStep(1);
      setSubject('');
      setGrade('');
      setSemester('');
      setSelectedTemplateId('');
      setTitle('');
      setGuru('');
      setSekolah('');
    } catch (err) {
      toast.error('Gagal membuat project. Silakan coba lagi.');
      logger.error('TemplateWizard', 'createProjectFromTemplate error: ' + String(err));
    } finally {
      setIsCreating(false);
    }
  }, [selectedTemplateId, title, guru, sekolah, subject, grade, onOpenChange, createProject]);

  // ── Reset on close ──────────────────────────────────────────────

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setStep(1);
      setSubject('');
      setGrade('');
      setSemester('');
      setSelectedTemplateId('');
      setTitle('');
      setGuru('');
      setSekolah('');
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-app-surface border border-app-border max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
        {/* Header with step indicator */}
        <div className="px-6 pt-6 pb-4 border-b border-app-border/30">
          <h2 className="text-lg font-bold text-app-primary mb-4">Buat Project Baru</h2>
          <StepIndicator currentStep={step} />
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[320px]">
          {step === 1 && (
            <StepSubject selected={subject} onSelect={setSubject} />
          )}
          {step === 2 && (
            <StepGradeSemester
              grade={grade}
              semester={semester}
              onGradeChange={setGrade}
              onSemesterChange={setSemester}
            />
          )}
          {step === 3 && (
            <StepTemplate
              templates={filteredTemplates}
              selectedId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
            />
          )}
          {step === 4 && selectedTemplate && (
            <StepInfo
              template={selectedTemplate}
              title={title}
              guru={guru}
              sekolah={sekolah}
              onTitleChange={setTitle}
              onGuruChange={setGuru}
              onSekolahChange={setSekolah}
            />
          )}
        </div>

        {/* Footer with navigation */}
        <div className="px-6 py-4 border-t border-app-border/30 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step <= 1}
            className="gap-1 text-app-secondary"
          >
            <ArrowLeft size={14} />
            Kembali
          </Button>

          {step < 4 ? (
            <Button
              onClick={goNext}
              disabled={!canGoNext}
              className="gap-1 bg-app-accent hover:bg-app-accent/90 text-app-accent-foreground"
            >
              Selanjutnya
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={!canGoNext || isCreating}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Membuat...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Buat Project
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ═══════════════════════════════════════════════════════════════════

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const isCompleted = currentStep > s.num;
        const isCurrent = currentStep === s.num;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.num}>
            {i > 0 && (
              <div className={`flex-1 h-[2px] ${
                isCompleted ? 'bg-app-accent/40' : 'bg-app-border/30'
              }`} />
            )}
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-[background-color,border-color] ${
                isCompleted
                  ? 'bg-app-accent/20 text-app-accent border border-app-accent/40'
                  : isCurrent
                    ? 'bg-app-accent/10 text-app-accent border border-app-accent/30 ring-2 ring-app-accent/20'
                    : 'bg-app-elevated text-app-muted border border-app-border/50'
              }`}>
                {isCompleted ? <Check size={12} /> : s.num}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:inline ${
                isCurrent ? 'text-app-primary' : 'text-app-muted'
              }`}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 1: PILIH MATA PELAJARAN
// ═══════════════════════════════════════════════════════════════════

function StepSubject({ selected, onSelect }: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-app-primary mb-1">Pilih Mata Pelajaran</h3>
      <p className="text-xs text-app-muted mb-4">Pilih mata pelajaran untuk menampilkan template yang sesuai.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUBJECTS.map(sub => {
          const isSelected = selected === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`rounded-xl p-4 text-center transition-[transform,background-color,border-color] cursor-pointer border ${
                isSelected
                  ? 'border-app-accent/60 bg-app-accent/10 ring-2 ring-app-accent/20'
                  : 'border-app-border/40 bg-app-elevated/30 hover:border-app-accent/30 hover:bg-app-accent/5'
              }`}
            >
              <div className="text-2xl mb-2">{sub.icon}</div>
              <div className={`text-xs font-semibold ${isSelected ? 'text-app-accent' : 'text-app-primary'}`}>
                {sub.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 2: PILIH KELAS & SEMESTER
// ═══════════════════════════════════════════════════════════════════

function StepGradeSemester({ grade, semester, onGradeChange, onSemesterChange }: {
  grade: string;
  semester: string;
  onGradeChange: (v: string) => void;
  onSemesterChange: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-app-primary mb-1">Pilih Kelas & Semester</h3>
      <p className="text-xs text-app-muted mb-4">Tentukan tingkat kelas dan semester pembelajaran.</p>

      <div className="space-y-4 max-w-sm">
        <div>
          <label className="text-xs font-semibold text-app-secondary mb-1.5 block">
            Kelas
          </label>
          <Select value={grade} onValueChange={onGradeChange}>
            <SelectTrigger className="bg-app-elevated/50 border-app-border/50">
              <SelectValue placeholder="Pilih kelas..." />
            </SelectTrigger>
            <SelectContent className="bg-app-surface border border-app-border max-h-60">
              {GRADE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-app-secondary mb-1.5 block">
            Semester
          </label>
          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger className="bg-app-elevated/50 border-app-border/50">
              <SelectValue placeholder="Pilih semester..." />
            </SelectTrigger>
            <SelectContent className="bg-app-surface border border-app-border">
              {SEMESTER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 3: PILIH TEMPLATE
// ═══════════════════════════════════════════════════════════════════

function StepTemplate({ templates, selectedId, onSelect }: {
  templates: CourseTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm text-app-muted">Tidak ada template untuk kombinasi ini.</p>
        <p className="text-xs text-app-muted mt-1">Coba pilih mata pelajaran atau kelas lain.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-app-primary mb-1">Pilih Template</h3>
      <p className="text-xs text-app-muted mb-4">Pilih template alur pembelajaran yang sesuai.</p>

      <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
        {templates.map(tmpl => {
          const isSelected = selectedId === tmpl.id;
          const flowPreview = getTemplateFlowPreview(tmpl.id);

          return (
            <button
              key={tmpl.id}
              onClick={() => onSelect(tmpl.id)}
              className={`w-full text-left rounded-xl p-4 transition-[transform,background-color,border-color] cursor-pointer border ${
                isSelected
                  ? 'border-app-accent/60 bg-app-accent/10 ring-2 ring-app-accent/20'
                  : 'border-app-border/40 bg-app-elevated/30 hover:border-app-accent/30 hover:bg-app-accent/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon & name */}
                <div className="text-2xl flex-shrink-0 mt-0.5">{tmpl.metadata.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${isSelected ? 'text-app-accent' : 'text-app-primary'}`}>
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-app-elevated/50 border border-app-border/30 text-app-muted font-semibold">
                      {tmpl.scenes.length} halaman
                    </span>
                  </div>
                  <p className="text-xs text-app-muted mb-2">{tmpl.description}</p>

                  {/* Scene flow preview */}
                  <div className="flex flex-wrap gap-1">
                    {tmpl.scenes.map((scene, i) => (
                      <React.Fragment key={i}>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-app-elevated/50 border border-app-border/20 text-app-secondary font-medium">
                          {scene.label}
                        </span>
                        {i < tmpl.scenes.length - 1 && (
                          <span className="text-[9px] text-app-muted">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Selection check */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-app-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-app-accent" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 4: ISI INFO DASAR
// ═══════════════════════════════════════════════════════════════════

function StepInfo({ template, title, guru, sekolah, onTitleChange, onGuruChange, onSekolahChange }: {
  template: CourseTemplate;
  title: string;
  guru: string;
  sekolah: string;
  onTitleChange: (v: string) => void;
  onGuruChange: (v: string) => void;
  onSekolahChange: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-app-primary mb-1">Isi Info Dasar</h3>
      <p className="text-xs text-app-muted mb-4">Lengkapi informasi presentasi Anda.</p>

      <div className="space-y-4">
        {/* Title input (required) */}
        <div>
          <label className="text-xs font-semibold text-app-secondary mb-1.5 block">
            Judul Presentasi <span className="text-red-400">*</span>
          </label>
          <Input
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Contoh: Hakikat Norma dalam Kehidupan"
            className="bg-app-elevated/50 border-app-border/50"
            autoFocus
          />
        </div>

        {/* Teacher name */}
        <div>
          <label className="text-xs font-semibold text-app-secondary mb-1.5 block">
            Nama Guru <span className="text-app-muted text-[10px]">(opsional)</span>
          </label>
          <Input
            value={guru}
            onChange={e => onGuruChange(e.target.value)}
            placeholder="Nama guru pengampu"
            className="bg-app-elevated/50 border-app-border/50"
          />
        </div>

        {/* School name */}
        <div>
          <label className="text-xs font-semibold text-app-secondary mb-1.5 block">
            Nama Sekolah <span className="text-app-muted text-[10px]">(opsional)</span>
          </label>
          <Input
            value={sekolah}
            onChange={e => onSekolahChange(e.target.value)}
            placeholder="SMP Negeri 1 Contoh"
            className="bg-app-elevated/50 border-app-border/50"
          />
        </div>

        {/* Preview of what will be created */}
        <div className="bg-app-surface/40 border border-app-border/30 rounded-xl p-4 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{template.metadata.icon}</span>
            <span className="text-xs font-bold text-app-primary">{template.name}</span>
          </div>
          <div className="text-[10px] font-semibold text-app-secondary mb-2">Halaman yang akan dibuat:</div>
          <div className="flex flex-wrap gap-1.5">
            {template.scenes.map((scene, i) => (
              <React.Fragment key={i}>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-app-elevated/50 border border-app-border/20 text-app-secondary font-medium">
                  {i + 1}. {scene.label}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-app-muted">
            Tema: <span className="text-app-accent font-semibold">{template.theme}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
