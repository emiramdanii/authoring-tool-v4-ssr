// ═══════════════════════════════════════════════════════════════════════
// EXPORT BUILD SCRIPT — Orchestrates the Vite build for export
// Called from the UI when user clicks "Export"
// ═══════════════════════════════════════════════════════════════════════

import { build } from 'vite';
import { exportConfig } from './vite.export.config';
import path from 'path';
import fs from 'fs';

interface ExportBuildOptions {
  pages: any[];
  ratioId: string;
  meta: Record<string, string>;
  gameData: Record<string, unknown>;
  gameEngineJS: string;
  outputPath?: string;
}

export async function buildExportHTML(options: ExportBuildOptions): Promise<string> {
  const {
    pages,
    ratioId,
    meta,
    gameData,
    gameEngineJS,
    outputPath = path.resolve(process.cwd(), 'download'),
  } = options;

  // 1. Write export data to a temp file that the entry point will read
  const dataFilePath = path.resolve(process.cwd(), 'src/export/export-data.json');
  fs.writeFileSync(dataFilePath, JSON.stringify({
    pages,
    ratioId,
    meta,
    gameData,
    gameEngineJS,
  }, null, 0)); // Compact JSON

  // 2. Run Vite build
  try {
    await build(exportConfig);

    // 3. Read the built HTML file
    const builtHtmlPath = path.resolve(process.cwd(), 'export-output', 'index.html');
    let html = fs.readFileSync(builtHtmlPath, 'utf-8');

    // 4. Inject export data as a script tag before </body>
    const dataScript = `<script>window.__EXPORT_DATA__ = ${JSON.stringify({
      pages, ratioId, meta, gameEngineJS,
    }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')};</script>`;
    html = html.replace('</body>', `${dataScript}\n</body>`);

    // 5. Update title
    const title = `${meta.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${meta.mapel || ''} ${meta.kelas || ''}`;
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

    // 6. Save to output path
    const fileName = `${(meta.judulPertemuan || 'media-pembelajaran').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-export.html`;
    const outputFilePath = path.resolve(outputPath, fileName);
    fs.mkdirSync(outputPath, { recursive: true });
    fs.writeFileSync(outputFilePath, html);

    // 7. Cleanup temp files
    fs.unlinkSync(dataFilePath);

    return outputFilePath;
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(dataFilePath)) fs.unlinkSync(dataFilePath);
    throw error;
  }
}
