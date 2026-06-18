// ═══════════════════════════════════════════════════════════════════
// Fixture Loader (Sprint 8.2B-Patch-1)
// ═══════════════════════════════════════════════════════════════════
// Loads real corpus fixtures from fixtures/projects/*.json and
// extracts CanvaPage objects for use in integration tests.
//
// Usage:
//   const page = loadFixturePage('golden-pertemuan', 0);
//   const pages = loadFixturePages('macam-norma-legacy');
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';

// Cache loaded fixtures
const _cache = new Map<string, any>();

/**
 * Load a fixture JSON file from fixtures/projects/.
 * Returns the raw parsed JSON (project document shape).
 */
function loadFixture(name: string): any {
  if (_cache.has(name)) return _cache.get(name);

  // Resolve path relative to project root
  const path = require('path');
  const fixturePath = path.resolve(
    __dirname, '..', '..', '..', 'fixtures', 'projects', `${name}.json`
  );
  const fixture = require(fixturePath);
  _cache.set(name, fixture);
  return fixture;
}

/**
 * Load all CanvaPage objects from a fixture.
 * Extracts pages from the fixture's canvaState.pages array.
 */
export function loadFixturePages(name: string): CanvaPage[] {
  const fixture = loadFixture(name);
  const pages = fixture?.canvaState?.pages;
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`Fixture "${name}" has no pages in canvaState.pages`);
  }
  return pages as CanvaPage[];
}

/**
 * Load a single CanvaPage from a fixture by index.
 * Defaults to index 0 (first page).
 */
export function loadFixturePage(name: string, index: number = 0): CanvaPage {
  const pages = loadFixturePages(name);
  if (index < 0 || index >= pages.length) {
    throw new Error(`Fixture "${name}" has ${pages.length} pages, index ${index} out of range`);
  }
  return pages[index]!;
}

/**
 * Get fixture metadata (name, description, schemaVersion, skenario).
 */
export function getFixtureMetadata(name: string): {
  name: string;
  description: string;
  schemaVersion: number;
  skenario: string;
} {
  const fixture = loadFixture(name);
  return fixture?._fixture ?? {
    name,
    description: 'No metadata',
    schemaVersion: 0,
    skenario: 'unknown',
  };
}
