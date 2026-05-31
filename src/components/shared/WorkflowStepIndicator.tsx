'use client';

import React, { useEffect, useCallback } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import type { PanelId } from '@/store/authoring-store';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

// ═══════════════════════════════════════════════════════════════
// WORKFLOW STEP INDICATOR — Compact progress bar for authoring
// ═══════════════════════════════════════════════════════════════
// Shows where the teacher is in the workflow:
//   Materi → Generate → Edit → Preview → Export
//
// Steps are "completed" once the user has visited them.
// Completion state is tracked in localStorage.
//
// Mode-aware: In sederhana mode, uses teacher-friendly labels
// and each step is clickable for quick navigation.
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'silse_workflow_completed_steps';

interface StepDef {
  id: string;
  label: string;
  labelSederhana: string;
  panelIds: PanelId[];
  navigateTo: PanelId;
}

const STEPS: StepDef[] = [
  { id: 'materi', label: 'Materi', labelSederhana: 'Materi', panelIds: ['dokumen', 'konten'], navigateTo: 'konten' },
  { id: 'generate', label: 'Generate', labelSederhana: 'Buat AI', panelIds: ['autogen'], navigateTo: 'autogen' },
  { id: 'edit', label: 'Edit', labelSederhana: 'Desain', panelIds: ['canva'], navigateTo: 'canva' },
  { id: 'preview', label: 'Preview', labelSederhana: 'Pratinjau', panelIds: ['preview'], navigateTo: 'preview' },
  { id: 'export', label: 'Export', labelSederhana: 'Simpan', panelIds: ['import'], navigateTo: 'import' },
];

function getCompletedSteps(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveCompletedSteps(steps: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...steps]));
  } catch {
    // Ignore storage errors
  }
}

function getCurrentStepIndex(activePanel: PanelId): number {
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i]!.panelIds.includes(activePanel)) return i;
  }
  return 0;
}

export default function WorkflowStepIndicator() {
  // Phase 3: activePanel read stays (source of truth for current panel), write migrated → panelRequest
  const activePanel = useAuthoringStore((s) => s.activePanel);
  const currentStepIndex = getCurrentStepIndex(activePanel);
  const { isSederhana } = useTeacherMode();

  // Track completed steps — mark all steps up to and including current as visited
  const markStepCompleted = useCallback((stepId: string) => {
    const completed = getCompletedSteps();
    if (!completed.has(stepId)) {
      completed.add(stepId);
      saveCompletedSteps(completed);
    }
  }, []);

  // Mark current step as completed whenever user visits it
  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < STEPS.length) {
      markStepCompleted(STEPS[currentStepIndex]!.id);
    }
  }, [currentStepIndex, markStepCompleted]);

  // Read completed steps from localStorage on each render
  // (Using a simple approach — read directly rather than state to avoid
  // unnecessary re-renders since this is a compact indicator)
  const completedSteps = getCompletedSteps();

  return (
    <div className="flex items-center gap-0.5" role="navigation" aria-label="Langkah workflow">
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.has(step.id);
        const isCurrent = i === currentStepIndex;
        const isPast = i < currentStepIndex;
        const stepLabel = isSederhana ? step.labelSederhana : step.label;

        return (
          <React.Fragment key={step.id}>
            {/* Step circle + label — clickable for navigation */}
            <button
              onClick={() => useCanvaStore.setState({ panelRequest: step.navigateTo })}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer focus-ring rounded-sm"
              title={`Ke ${stepLabel}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                  isCompleted && !isCurrent
                    ? 'bg-silse-primary-container/20 text-silse-primary border border-silse-primary-container/30'
                    : isCurrent
                      ? 'bg-silse-primary/10 text-silse-primary border border-silse-primary/30 ring-2 ring-silse-primary/20'
                      : 'bg-silse-surface-container-high/50 text-silse-on-surface-variant border border-silse-outline-variant/40'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>check</span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold hidden lg:inline ${
                  isCurrent ? 'text-silse-on-surface' : isPast ? 'text-silse-on-surface-variant' : 'text-silse-on-surface-variant/60'
                }`}
              >
                {stepLabel}
              </span>
            </button>

            {/* Connector arrow */}
            {i < STEPS.length - 1 && (
              <ArrowRight
                size={10}
                className={`mx-0.5 flex-shrink-0 ${
                  isPast ? 'text-silse-primary/40' : 'text-silse-outline-variant/50'
                }`
              }
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
