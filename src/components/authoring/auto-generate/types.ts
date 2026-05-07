// ═══════════════════════════════════════════════════════════════════
// Types & Interfaces for Auto-Generate
// ═══════════════════════════════════════════════════════════════════

export interface ParseResult {
  sentences: string[];
  words: string[];
  topWords: string[];
  wordCount: number;
  definitions: { term: string; meaning: string }[];
  enumerations: { subject: string; items: string[] }[];
  functions: { subject: string; desc: string }[];
  causes: { cause: string; effect: string }[];
}

export interface FlashcardItem {
  depan: string;
  belakang: string;
  hint: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface TrueFalseItem {
  statement: string;
  answer: boolean;
  explanation: string;
}

export interface SkenarioChapter {
  title: string;
  setup: string;
  dialog: { speaker: string; text: string }[];
  choices: { text: string; feedback: string; correct: boolean }[];
}

export interface GenSettings {
  jumlahKuis: number;
  pertemuan: number;
  bloomMax: number;
}

export type GenType = 'cp' | 'tp' | 'atp' | 'alur' | 'kuis' | 'flashcard' | 'skenario' | 'matching' | 'truefalse';

export interface PreviewData {
  type: GenType;
  label: string;
  icon: string;
  data: unknown;
  count: number;
}
