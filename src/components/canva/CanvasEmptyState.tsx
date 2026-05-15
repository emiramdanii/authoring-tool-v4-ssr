'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Plus, Lightbulb } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import dynamic from 'next/dynamic';

// Lazy-load TemplateWizard — it's a modal dialog, not always visible
const TemplateWizard = dynamic(() => import('./TemplateWizard'), { ssr: false });

// ═══════════════════════════════════════════════════════════════
// CANVAS EMPTY STATE — Shown when pages.length === 0
// ═══════════════════════════════════════════════════════════════
// Inviting, clear entry point for teachers who just opened the
// canvas. Three action cards guide them to start creating.
// ═══════════════════════════════════════════════════════════════

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  iconBgClass: string;
  borderClass: string;
  hoverBorderClass: string;
  action: () => void;
}

export default function CanvasEmptyState() {
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleAutoGenerate = useCallback(() => {
    useAuthoringStore.getState().setActivePanel('autogen');
  }, []);

  const handleBlankPage = useCallback(() => {
    useCanvaStore.getState().addPage();
  }, []);

  const handleTemplate = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const cards: ActionCard[] = [
    {
      id: 'autogen',
      title: 'Auto-Generate',
      description: 'Tempel materi, AI buatkan untuk Anda',
      icon: Sparkles,
      colorClass: 'text-purple-400',
      iconBgClass: 'bg-purple-500/15',
      borderClass: 'border-purple-500/20',
      hoverBorderClass: 'hover:border-purple-500/40',
      action: handleAutoGenerate,
    },
    {
      id: 'template',
      title: 'Dari Template',
      description: 'Pilih template siap pakai',
      icon: FileText,
      colorClass: 'text-app-accent',
      iconBgClass: 'bg-app-accent/15',
      borderClass: 'border-app-accent/20',
      hoverBorderClass: 'hover:border-app-accent/40',
      action: handleTemplate,
    },
    {
      id: 'blank',
      title: 'Halaman Kosong',
      description: 'Buat halaman baru dari nol',
      icon: Plus,
      colorClass: 'text-cyan-400',
      iconBgClass: 'bg-cyan-500/15',
      borderClass: 'border-cyan-500/20',
      hoverBorderClass: 'hover:border-cyan-500/40',
      action: handleBlankPage,
    },
  ];

  return (
    <>
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-app-surface px-4 py-8">
        {/* Illustration / Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center">
            <Sparkles size={28} className="text-app-accent" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="text-xl font-bold text-app-primary mb-2 text-center"
        >
          Mulai Buat Media Pembelajaran
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="text-sm text-app-secondary mb-8 text-center max-w-md"
        >
          Pilih cara memulai di bawah, atau tambah halaman dari panel kiri
        </motion.p>

        {/* Action Cards */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-xl">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                onClick={card.action}
                className={`flex-1 min-w-0 p-5 rounded-xl border bg-app-elevated/30 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98] focus-ring ${card.borderClass} ${card.hoverBorderClass}`}
              >
                <div className={`w-10 h-10 rounded-lg ${card.iconBgClass} flex items-center justify-center mb-3`}>
                  <Icon size={20} className={card.colorClass} />
                </div>
                <div className={`text-sm font-semibold ${card.colorClass} mb-1`}>
                  {card.title}
                </div>
                <div className="text-xs text-app-muted leading-relaxed">
                  {card.description}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-app-elevated/40 border border-app-border/30 max-w-md"
        >
          <Lightbulb size={14} className="text-amber-400 flex-shrink-0" />
          <span className="text-xs text-app-secondary">
            Tip: Auto-Generate paling cepat — tempel materi, edit sedikit, selesai!
          </span>
        </motion.div>
      </div>

      {/* Template Wizard Dialog */}
      <TemplateWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
