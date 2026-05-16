'use client';

import React, { useEffect, useCallback } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { PanelId } from '@/store/authoring-store';

// ═══════════════════════════════════════════════════════════════
// WORKFLOW STEP INDICATOR — Compact progress bar for authoring
// ═══════════════════════════════════════════════════════════════
// Shows where the teacher is in the workflow:
//   Materi → Generate → Edit → Preview → Export
//
// Steps are "completed" once the user has visited them.
// Completion state is tracked in localStorage.
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'silse_workflow_completed_steps';

interface StepDef {
  id: string;
  label: string;
  panelIds: PanelId[];
}

const STEPS: StepDef[] = [
  { id: 'materi', label: 'Materi', panelIds: ['dokumen', 'konten'] },
  { id: 'generate', label: 'Generate', panelIds: ['autogen'] },
  { id: 'edit', label: 'Edit', panelIds: ['canva'] },
  { id: 'preview', label: 'Preview', panelIds: ['preview'] },
  { id: 'export', label: 'Export', panelIds: ['import'] },
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
    if (STEPS[i].panelIds.includes(activePanel)) return i;
  }
  return 0;
}

export default function WorkflowStepIndicator() {
  const activePanel = useAuthoringStore((s) => s.activePanel);
  const currentStepIndex = getCurrentStepIndex(activePanel);

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
      markStepCompleted(STEPS[currentStepIndex].id);
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

        return (
          <React.Fragment key={step.id}>
            {/* Step circle + label */}
            <div className="flex items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                  isCompleted && !isCurrent
                    ? 'bg-app-accent/20 text-app-accent border border-app-accent/30'
                    : isCurrent
                      ? 'bg-app-accent/10 text-app-accent border border-app-accent/30 ring-2 ring-app-accent/20'
                      : 'bg-app-elevated/50 text-app-muted border border-app-border/40'
                }`}
                title={step.label}
              >
                {isCompleted && !isCurrent ? (
                  <Check size={10} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold hidden lg:inline ${
                  isCurrent ? 'text-app-primary' : isPast ? 'text-app-secondary' : 'text-app-muted'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector arrow */}
            {i < STEPS.length - 1 && (
              <ArrowRight
                size={10}
                className={`mx-0.5 flex-shrink-0 ${
                  isPast ? 'text-app-accent/40' : 'text-app-border/50'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
