// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL COMPONENTS — Pedagogical component vocabulary + grammar
// ═══════════════════════════════════════════════════════════════════
// "Komponen edukasi punya identitas tetap — bukan styling acak."
//
// Each educational component has:
//   - Fixed accent color (semantic, not decorative)
//   - Fixed icon (Lucide, not emoji — consistent across OS)
//   - Fixed hierarchy (always the same visual weight)
//   - Fixed spacing (always the same breathing room)
//   - Fixed behavior (always the same interaction pattern)
//
// This is NOT a component library — it's a component GRAMMAR.
// It defines how components CAN and CANNOT be combined.
// ═══════════════════════════════════════════════════════════════════

import type { EduComponentRole } from './education-colors';
import { EDU_COMPONENT_COLORS } from './education-colors';

// ═══════════════════════════════════════════════════════════════════
// COMPONENT DEFINITIONS — The 8 core educational components
// ═══════════════════════════════════════════════════════════════════

export interface EduComponentDefinition {
  /** Component role (semantic identifier) */
  role: EduComponentRole;
  /** Display label (Indonesian) */
  label: string;
  /** Lucide icon name — fixed, not configurable */
  icon: string;
  /** Accent color token — maps to EDU_COMPONENT_COLORS */
  accentColor: string;
  /** Component description */
  description: string;
  /** Fixed visual style rules */
  style: EduComponentStyle;
  /** Grammar rules — what must surround this component */
  grammar: EduComponentGrammar;
  /** Which Bloom's taxonomy level this serves */
  bloomLevel: string;
  /** Learning phase in the pedagogical sequence */
  learningPhase: 'opening' | 'reception' | 'illustration' | 'practice' | 'interaction' | 'metacognition' | 'measurement' | 'synthesis';
}

export interface EduComponentStyle {
  /** Border style — left accent stripe */
  borderStyle: 'left-stripe' | 'full-border' | 'bottom-accent' | 'none';
  /** Stripe width in px (for left-stripe) */
  stripeWidth: number;
  /** Background tint — subtle accent color */
  backgroundTint: boolean;
  /** Heading pattern — how the title should look */
  headingPattern: 'uppercase-small' | 'sentence-large' | 'centered';
  /** Whether to show icon in header */
  showIcon: boolean;
  /** Icon position */
  iconPosition: 'left' | 'above' | 'inline';
  /** Bullet style for list content */
  bulletStyle: 'checklist' | 'numbered' | 'dots' | 'none';
  /** Content alignment */
  alignment: 'left' | 'center';
}

export interface EduComponentGrammar {
  /** What must come BEFORE this component (suggest/require) */
  before: EduComponentRole[];
  /** What must come AFTER this component (suggest/require) */
  after: EduComponentRole[];
  /** Whether the 'before' constraint is required (vs suggested) */
  beforeRequired: boolean;
  /** Whether the 'after' constraint is required (vs suggested) */
  afterRequired: boolean;
  /** Maximum instances per slide */
  maxPerSlide: number;
  /** Whether this component should start a new slide */
  startsNewSlide: boolean;
  /** Whether this component can appear on the same slide as another */
  canShareSlide: boolean;
}

/**
 * The 8 core educational components — fixed definitions.
 * These are the vocabulary of instructional design.
 */
export const EDU_COMPONENTS: Record<EduComponentRole, EduComponentDefinition> = {
  tujuan: {
    role: 'tujuan',
    label: 'Tujuan Pembelajaran',
    icon: 'Target',
    accentColor: EDU_COMPONENT_COLORS.tujuan.accent,
    description: 'Learning objectives — what students will achieve. Always at the beginning, always with checklist style.',
    style: {
      borderStyle: 'left-stripe',
      stripeWidth: 4,
      backgroundTint: true,
      headingPattern: 'uppercase-small',
      showIcon: true,
      iconPosition: 'left',
      bulletStyle: 'checklist',
      alignment: 'left',
    },
    grammar: {
      before: [],
      after: ['materi', 'aktivitas'],
      beforeRequired: false,
      afterRequired: false,
      maxPerSlide: 1,
      startsNewSlide: true,
      canShareSlide: false,
    },
    bloomLevel: 'Remember',
    learningPhase: 'opening',
  },
  materi: {
    role: 'materi',
    label: 'Materi Inti',
    icon: 'BookOpen',
    accentColor: EDU_COMPONENT_COLORS.materi.accent,
    description: 'Core learning material — the knowledge content. Often paired with contoh for illustration.',
    style: {
      borderStyle: 'left-stripe',
      stripeWidth: 3,
      backgroundTint: false,
      headingPattern: 'sentence-large',
      showIcon: true,
      iconPosition: 'left',
      bulletStyle: 'dots',
      alignment: 'left',
    },
    grammar: {
      before: ['tujuan'],
      after: ['contoh', 'aktivitas'],
      beforeRequired: false,
      afterRequired: false,
      maxPerSlide: 1,
      startsNewSlide: false,
      canShareSlide: true,
    },
    bloomLevel: 'Understand',
    learningPhase: 'reception',
  },
  contoh: {
    role: 'contoh',
    label: 'Contoh',
    icon: 'Lightbulb',
    accentColor: EDU_COMPONENT_COLORS.contoh.accent,
    description: 'Examples and illustrations — making abstract concepts concrete. Should follow materi.',
    style: {
      borderStyle: 'full-border',
      stripeWidth: 2,
      backgroundTint: true,
      headingPattern: 'sentence-large',
      showIcon: true,
      iconPosition: 'left',
      bulletStyle: 'dots',
      alignment: 'left',
    },
    grammar: {
      before: ['materi'],
      after: ['aktivitas', 'diskusi'],
      beforeRequired: false,
      afterRequired: false,
      maxPerSlide: 2,
      startsNewSlide: false,
      canShareSlide: true,
    },
    bloomLevel: 'Apply',
    learningPhase: 'illustration',
  },
  aktivitas: {
    role: 'aktivitas',
    label: 'Aktivitas',
    icon: 'Hand',
    accentColor: EDU_COMPONENT_COLORS.aktivitas.accent,
    description: 'Hands-on activity — numbered steps, clear instructions. Whitespace besar. Max 3 steps.',
    style: {
      borderStyle: 'left-stripe',
      stripeWidth: 4,
      backgroundTint: true,
      headingPattern: 'sentence-large',
      showIcon: true,
      iconPosition: 'above',
      bulletStyle: 'numbered',
      alignment: 'left',
    },
    grammar: {
      before: ['materi', 'contoh'],
      after: ['refleksi', 'quiz'],
      beforeRequired: false,
      afterRequired: false,
      maxPerSlide: 1,
      startsNewSlide: true,
      canShareSlide: false,
    },
    bloomLevel: 'Apply',
    learningPhase: 'practice',
  },
  diskusi: {
    role: 'diskusi',
    label: 'Diskusi',
    icon: 'MessageCircle',
    accentColor: EDU_COMPONENT_COLORS.diskusi.accent,
    description: 'Discussion prompt — open-ended question with response area. Conversational rhythm.',
    style: {
      borderStyle: 'bottom-accent',
      stripeWidth: 3,
      backgroundTint: false,
      headingPattern: 'sentence-large',
      showIcon: true,
      iconPosition: 'left',
      bulletStyle: 'none',
      alignment: 'left',
    },
    grammar: {
      before: ['materi', 'contoh'],
      after: ['refleksi', 'rangkuman'],
      beforeRequired: false,
      afterRequired: false,
      maxPerSlide: 2,
      startsNewSlide: false,
      canShareSlide: true,
    },
    bloomLevel: 'Analyze',
    learningPhase: 'interaction',
  },
  refleksi: {
    role: 'refleksi',
    label: 'Refleksi',
    icon: 'Brain',
    accentColor: EDU_COMPONENT_COLORS.refleksi.accent,
    description: 'Self-reflection — centered, spacious, minimal, calm. For metakognisi and self-assessment.',
    style: {
      borderStyle: 'none',
      stripeWidth: 0,
      backgroundTint: false,
      headingPattern: 'centered',
      showIcon: true,
      iconPosition: 'above',
      bulletStyle: 'none',
      alignment: 'center',
    },
    grammar: {
      before: ['aktivitas', 'diskusi'],
      after: ['quiz', 'rangkuman'],
      beforeRequired: true,
      afterRequired: false,
      maxPerSlide: 1,
      startsNewSlide: true,
      canShareSlide: false,
    },
    bloomLevel: 'Evaluate',
    learningPhase: 'metacognition',
  },
  quiz: {
    role: 'quiz',
    label: 'Quiz',
    icon: 'CheckCircle2',
    accentColor: EDU_COMPONENT_COLORS.quiz.accent,
    description: 'Assessment — high contrast, single focus, whitespace besar, CTA jelas, tidak decorative.',
    style: {
      borderStyle: 'full-border',
      stripeWidth: 2,
      backgroundTint: false,
      headingPattern: 'sentence-large',
      showIcon: true,
      iconPosition: 'left',
      bulletStyle: 'none',
      alignment: 'center',
    },
    grammar: {
      before: ['materi', 'aktivitas'],
      after: ['rangkuman'],
      beforeRequired: false,
      afterRequired: false,
      maxPerSlide: 1,
      startsNewSlide: true,
      canShareSlide: false,
    },
    bloomLevel: 'Evaluate',
    learningPhase: 'measurement',
  },
  rangkuman: {
    role: 'rangkuman',
    label: 'Rangkuman',
    icon: 'ClipboardList',
    accentColor: EDU_COMPONENT_COLORS.rangkuman.accent,
    description: 'Summary — key points synthesis. Clean, organized, brings closure.',
    style: {
      borderStyle: 'bottom-accent',
      stripeWidth: 2,
      backgroundTint: false,
      headingPattern: 'sentence-large',
      showIcon: true,
      iconPosition: 'left',
      bulletStyle: 'checklist',
      alignment: 'left',
    },
    grammar: {
      before: ['quiz', 'refleksi'],
      after: [],
      beforeRequired: false,
      afterRequired: false,
      maxPerSlide: 1,
      startsNewSlide: true,
      canShareSlide: false,
    },
    bloomLevel: 'Create',
    learningPhase: 'synthesis',
  },
};

// ═══════════════════════════════════════════════════════════════════
// PEDAGOGICAL SEQUENCE — The learning flow
// ═══════════════════════════════════════════════════════════════════
// This is NOT random ordering. It's a learning cycle based on
// Dave's Cone of Experience + Bloom's Taxonomy.
// ═══════════════════════════════════════════════════════════════════

export const PEDAGOGICAL_SEQUENCE: EduComponentRole[] = [
  'tujuan',     // 1. Opening — what will we learn?
  'materi',     // 2. Reception — core knowledge
  'contoh',     // 3. Illustration — making it concrete
  'aktivitas',  // 4. Practice — hands-on application
  'diskusi',    // 5. Interaction — social learning
  'refleksi',   // 6. Metacognition — self-assessment
  'quiz',       // 7. Measurement — evaluation
  'rangkuman',  // 8. Synthesis — bringing it together
];

/**
 * Validate that a sequence of components follows pedagogical grammar.
 * Returns suggestions for improving the sequence.
 */
export function validatePedagogicalSequence(
  sequence: EduComponentRole[],
): { valid: boolean; suggestions: string[] } {
  const suggestions: string[] = [];

  // Rule 1: Tujuan should come first (if present)
  const tujuanIdx = sequence.indexOf('tujuan');
  if (tujuanIdx > 0) {
    suggestions.push('Tujuan Pembelajaran sebaiknya berada di awal slide, bukan di tengah.');
  }

  // Rule 2: Materi should not be followed directly by another materi without contoh or aktivitas
  for (let i = 0; i < sequence.length - 1; i++) {
    if (sequence[i] === 'materi' && sequence[i + 1] === 'materi') {
      suggestions.push('Dua Materi Inti berturut-turut tanpa Contoh atau Aktivitas di antaranya. Sisipkan Contoh untuk mengilustrasikan.');
    }
  }

  // Rule 3: Refleksi should come after aktivitas or diskusi
  const refleksiIdx = sequence.indexOf('refleksi');
  if (refleksiIdx > 0) {
    const before = sequence[refleksiIdx - 1];
    if (before !== 'aktivitas' && before !== 'diskusi' && before !== 'quiz') {
      suggestions.push('Refleksi paling bermakna setelah Aktivitas atau Diskusi. Pertimbangkan untuk memindahkan setelah aktivitas interaktif.');
    }
  }

  // Rule 4: Quiz should not be first
  if (sequence[0] === 'quiz') {
    suggestions.push('Quiz tidak boleh di awal tanpa konten pembelajaran terlebih dahulu.');
  }

  return {
    valid: suggestions.length === 0,
    suggestions,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE SEQUENCES — Pre-built learning flows for templates
// ═══════════════════════════════════════════════════════════════════

export const TEMPLATE_SEQUENCES: Record<string, {
  name: string;
  description: string;
  sequence: EduComponentRole[];
}> = {
  'clean-lecture': {
    name: 'Clean Lecture',
    description: 'Materi presentasi standar — alur pembelajaran klasik',
    sequence: ['tujuan', 'materi', 'contoh', 'rangkuman'],
  },
  'guided-activity': {
    name: 'Guided Activity',
    description: 'Aktivitas siswa — practice-oriented dengan refleksi',
    sequence: ['tujuan', 'materi', 'contoh', 'aktivitas', 'refleksi'],
  },
  'assessment': {
    name: 'Assessment',
    description: 'Evaluasi dan penilaian — quiz dengan rangkuman',
    sequence: ['tujuan', 'materi', 'quiz', 'rangkuman'],
  },
  'full-lesson': {
    name: 'Full Lesson',
    description: 'Siklus belajar lengkap — semua 8 komponen',
    sequence: ['tujuan', 'materi', 'contoh', 'aktivitas', 'diskusi', 'refleksi', 'quiz', 'rangkuman'],
  },
};
