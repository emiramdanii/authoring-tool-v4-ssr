// ═══════════════════════════════════════════════════════════════════════
// PDF EXPORT UTILITY — Server-side PDF generation using Puppeteer
// ═══════════════════════════════════════════════════════════════════════
// Takes HTML content and options, launches a headless Chromium browser,
// renders the HTML, and generates a native PDF with A4 formatting
// suitable for Indonesian education standards (Kurikulum Merdeka).
//
// Features:
// - A4 / Letter format with configurable margins
// - Landscape / Portrait orientation
// - Header with document title
// - Footer with "Halaman X dari Y" (Indonesian page numbering)
// - Optional answer key visibility toggle via .print-answers CSS class
// - Print background colors and images
// ═══════════════════════════════════════════════════════════════════════

import puppeteer from 'puppeteer';

export interface PdfExportOptions {
  title?: string;
  format?: 'A4' | 'Letter';
  landscape?: boolean;
  margin?: { top: string; bottom: string; left: string; right: string };
  printBackground?: boolean;
  includeAnswerKeys?: boolean;
}

/**
 * Generate a PDF buffer from HTML content using Puppeteer.
 *
 * @param htmlContent - The full HTML string to render
 * @param options - PDF export configuration options
 * @returns Buffer containing the PDF binary data
 */
export async function generatePdf(
  htmlContent: string,
  options: PdfExportOptions = {}
): Promise<Buffer> {
  const {
    title = 'Media Pembelajaran Interaktif',
    format = 'A4',
    landscape = false,
    margin = { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground = true,
    includeAnswerKeys = true,
  } = options;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--run-all-compositor-stages-before-draw',
        '--disable-features=PaintHolding',
      ],
    });

    const page = await browser.newPage();

    // Set HTML content and wait for full load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait a moment for any lazy-loaded or animated components to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // If answer keys should be visible, add CSS class to body
    if (includeAnswerKeys) {
      await page.evaluate(() => {
        document.body.classList.add('print-answers');
      });
    }

    // Add print-specific CSS to ensure proper page breaks
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          .page, [data-page] {
            page-break-after: always;
            break-after: page;
          }
          .page:last-child, [data-page]:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .print-answers .answer-key,
        .print-answers [data-answer-key],
        .print-answers .kunci-jawaban {
          display: block !important;
          visibility: visible !important;
        }
      `;
      document.head.appendChild(style);
    });

    // Generate PDF with Indonesian education standard formatting
    const pdfBuffer = await page.pdf({
      format,
      landscape,
      margin,
      printBackground,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px; width:100%; text-align:center; color:#888; padding:0 15mm;">
          ${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      `,
      footerTemplate: `
        <div style="font-size:8px; width:100%; text-align:center; color:#888; padding:0 15mm;">
          Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
