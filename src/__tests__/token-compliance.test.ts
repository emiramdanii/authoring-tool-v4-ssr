// ═══════════════════════════════════════════════════════════════════
// TOKEN COMPLIANCE TESTS — iOS Visual Contract enforcement
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { checkTokenCompliance, checkTokenComplianceBatch } from '@/core/vcs/token-compliance';
import * as fs from 'fs';
import * as path from 'path';

describe('Token Compliance Checker', () => {
  describe('Unit: checkTokenCompliance', () => {
    it('should pass clean source code', () => {
      const clean = `
        const style = {
          transition: tokens.iosTransitionStyle('transform', 'slow'),
          boxShadow: tokens.iosShadow('soft'),
        };
        <div className="rounded-lg shadow-sm hover:scale-[1.02] duration-300" />
      `;
      const result = checkTokenCompliance(clean);
      expect(result.pass).toBe(true);
      expect(result.total).toBe(0);
      expect(result.score).toBe(100);
    });

    it('should detect transition-all', () => {
      const bad = `<div className="transition-all" />`;
      const result = checkTokenCompliance(bad);
      expect(result.pass).toBe(false);
      expect(result.byCode['TOKEN_TRANSITION_ALL']).toBe(1);
      expect(result.violations[0]!.severity).toBe('error');
    });

    it('should detect hover:scale-105', () => {
      const bad = `<div className="hover:scale-105" />`;
      const result = checkTokenCompliance(bad);
      expect(result.pass).toBe(false);
      expect(result.byCode['TOKEN_HOVER_SCALE_EXCEEDED']).toBe(1);
    });

    it('should allow hover:scale-[1.02]', () => {
      const good = `<div className="hover:scale-[1.02]" />`;
      const result = checkTokenCompliance(good);
      expect(result.total).toBe(0);
    });

    it('should detect duration-500', () => {
      const bad = `<div className="duration-500" />`;
      const result = checkTokenCompliance(bad);
      expect(result.byCode['TOKEN_DURATION_EXCEEDED']).toBe(1);
    });

    it('should allow duration-300', () => {
      const good = `<div className="duration-300" />`;
      const result = checkTokenCompliance(good);
      expect(result.total).toBe(0);
    });

    it('should detect shadow-xl', () => {
      const bad = `<div className="shadow-xl" />`;
      const result = checkTokenCompliance(bad);
      expect(result.byCode['TOKEN_SHADOW_LEVEL_INVALID']).toBe(1);
    });

    it('should detect shadow-2xl', () => {
      const bad = `<div className="shadow-2xl" />`;
      const result = checkTokenCompliance(bad);
      expect(result.byCode['TOKEN_SHADOW_LEVEL_INVALID']).toBe(1);
    });

    it('should allow shadow-sm and shadow-md', () => {
      const good = `<div className="shadow-sm shadow-md" />`;
      const result = checkTokenCompliance(good);
      expect(result.total).toBe(0);
    });

    it('should detect inline slow transition', () => {
      const bad = `transition: 'transform 0.5s ease'`;
      const result = checkTokenCompliance(bad);
      expect(result.byCode['TOKEN_INLINE_SLOW_TRANSITION']).toBe(1);
    });

    it('should allow inline fast transition', () => {
      const good = `transition: 'transform 0.2s ease'`;
      const result = checkTokenCompliance(good);
      expect(result.total).toBe(0);
    });

    it('should compute correct score with multiple violations', () => {
      const bad = `
        <div className="transition-all shadow-xl hover:scale-105 duration-500" />
        <span style={{ transition: 'all 0.8s' }} />
      `;
      const result = checkTokenCompliance(bad);
      expect(result.total).toBe(5);
      expect(result.score).toBeLessThan(60);
    });
  });

  describe('Integration: Renderer Block Files', () => {
    const blocksDir = path.resolve(__dirname, '../core/renderer/blocks');

    it('should have zero critical violations in all renderer blocks', () => {
      if (!fs.existsSync(blocksDir)) {
        return; // Skip if directory not found
      }

      const files = fs.readdirSync(blocksDir)
        .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
        .map(f => ({
          path: f,
          source: fs.readFileSync(path.join(blocksDir, f), 'utf-8'),
        }));

      const batch = checkTokenComplianceBatch(files);

      // All renderer blocks should pass (0 errors)
      const failingFiles = batch.results.filter(r => !r.pass);
      if (failingFiles.length > 0) {
        const details = failingFiles.map(f =>
          `${f.path}: ${f.violations.map(v => `${v.code}@L${v.line}`).join(', ')}`
        ).join('\n');
        console.error('Token compliance failures:\n' + details);
      }

      expect(failingFiles.length).toBe(0);
    });

    it('should have no TOKEN_TRANSITION_ALL violations in renderer blocks', () => {
      if (!fs.existsSync(blocksDir)) return;

      const files = fs.readdirSync(blocksDir)
        .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
        .map(f => ({
          path: f,
          source: fs.readFileSync(path.join(blocksDir, f), 'utf-8'),
        }));

      for (const file of files) {
        const result = checkTokenCompliance(file.source);
        const transitionAll = result.violations.filter(v => v.code === 'TOKEN_TRANSITION_ALL');
        expect(transitionAll.length, `${file.path} has transition-all violations`).toBe(0);
      }
    });

    it('should have no TOKEN_SHADOW_LEVEL_INVALID violations in renderer blocks', () => {
      if (!fs.existsSync(blocksDir)) return;

      const files = fs.readdirSync(blocksDir)
        .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
        .map(f => ({
          path: f,
          source: fs.readFileSync(path.join(blocksDir, f), 'utf-8'),
        }));

      for (const file of files) {
        const result = checkTokenCompliance(file.source);
        const shadowViolations = result.violations.filter(v => v.code === 'TOKEN_SHADOW_LEVEL_INVALID');
        expect(shadowViolations.length, `${file.path} has shadow-xl/2xl violations`).toBe(0);
      }
    });
  });
});
