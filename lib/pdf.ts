import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import React from 'react';
import fs from 'fs';
import { renderToStaticMarkup } from 'react-dom/server.edge';
import ReceiptTemplate, { ReceiptTemplateProps } from '@/components/receipt/ReceiptTemplate';

export interface GeneratePdfOptions extends ReceiptTemplateProps {
  baseUrl: string;
}

/**
 * Searches for an existing Chrome or Edge installation on the host system.
 */
function findChromeExecutable(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(/*turbopackIgnore: true*/ process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_BIN && fs.existsSync(/*turbopackIgnore: true*/ process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const potentialPaths = [
    // Standard Windows Chrome / Edge paths
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    // Standard Linux paths (containers / cloud)
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    // Standard macOS paths
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];

  for (const p of potentialPaths) {
    try {
      if (p && fs.existsSync(/*turbopackIgnore: true*/ p)) {
        return p;
      }
    } catch {
      // ignore path access errors
    }
  }

  return undefined;
}

/**
 * Launch Chromium browser instance.
 * Automatically checks for system Chrome/Edge or falls back to Puppeteer cache.
 */
export async function launchBrowser(): Promise<Browser> {
  const executablePath = findChromeExecutable();

  const options: LaunchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=medium',
    ],
  };

  if (executablePath) {
    options.executablePath = executablePath;
  }

  return await puppeteer.launch(options);
}

/**
 * Generates an A4 portrait PDF for the given receipt data using ReceiptTemplate.tsx as the single source of truth.
 */
export async function generateReceiptPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const { student, receiptNumber, admissionFee, payment, receiptType, baseUrl } = options;

  // Build absolute logo URL and signature URL
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const absoluteLogoUrl = `${normalizedBaseUrl}/lips-logo.png`;
  const absoluteSignatureUrl = `${normalizedBaseUrl}/signature.png`;

  // Render the EXACT ReceiptTemplate to static markup
  const receiptHtml = renderToStaticMarkup(
    React.createElement(ReceiptTemplate, {
      student,
      receiptNumber,
      admissionFee,
      payment,
      receiptType,
      logoUrl: absoluteLogoUrl,
      signatureUrl: absoluteSignatureUrl,
    })
  );

  // Guarantee all relative image URLs are transformed to absolute URLs
  const processedReceiptHtml = receiptHtml.replace(
    /src=["']\/([^"']+)["']/g,
    `src="${normalizedBaseUrl}/$1"`
  );

  // Complete HTML document with precise print styles
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt ${receiptNumber}</title>
  <base href="${normalizedBaseUrl}/" />
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .receipt-page {
      box-sizing: border-box;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  </style>
</head>
<body>
  ${processedReceiptHtml}
</body>
</html>`;

  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Set A4 viewport (deviceScaleFactor: 2 for sharp vector/font quality)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Emulate print media so print CSS (@media print) is active
    await page.emulateMediaType('print');

    // Load HTML content
    await page.setContent(fullHtml, {
      waitUntil: 'load',
      timeout: 30000,
    });

    // Explicitly wait for images to load
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve());
            img.addEventListener('error', () => resolve()); // don't freeze on error
          });
        })
      );
    });

    // Wait for fonts to finish rendering
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch {
      // fonts.ready fallback
    }

    // Verify receipt element exists in DOM
    await page.waitForSelector('.receipt-page', { timeout: 10000 });

    // Generate strict 1-page A4 PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close().catch((err) => {
        console.error('Error closing Puppeteer browser:', err);
      });
    }
  }
}
