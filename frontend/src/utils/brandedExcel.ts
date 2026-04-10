/**
 * Branded Excel export utility — Embassy Equestrian Premier League
 *
 * Produces .xlsx files with:
 *   Row 1  — Orange banner: logo image (cols A-B) + "EQUESTRIAN PREMIER LEAGUE" title (cols C-last)
 *   Row 2  — Orange background subtitle
 *   Row 3  — Spacer / note row (white)
 *   Row 4  — Dark column headers (white text)
 *   Data   — Alternating white / light-gray rows, thin borders, centered text
 */

import ExcelJS from 'exceljs';

// ─── Colours ──────────────────────────────────────────────────────────────────
const ORANGE:      ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF08C00' } };
const WHITE_FILL:  ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F1F1F' } };
const ALT_FILL:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };

const THIN_BORDER: ExcelJS.Borders = {
  top:    { style: 'thin', color: { argb: 'FFCCCCCC' } },
  left:   { style: 'thin', color: { argb: 'FFCCCCCC' } },
  bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  right:  { style: 'thin', color: { argb: 'FFCCCCCC' } },
  diagonal: { style: 'thin', color: { argb: 'FFCCCCCC' } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function styleCells(
  row: ExcelJS.Row,
  fill: ExcelJS.Fill,
  fontArgb: string,
  fontSize: number,
  bold: boolean,
  align: ExcelJS.Alignment['horizontal'] = 'center',
) {
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = fill;
    cell.font = { name: 'Arial', size: fontSize, bold, color: { argb: fontArgb } };
    cell.alignment = { horizontal: align, vertical: 'middle', wrapText: false };
    cell.border = THIN_BORDER;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildTimestampedFileName(prefix: string) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}-${stamp}.xlsx`;
}

/** Fetch the Embassy logo as a base64 PNG (browser-only). Returns null if unavailable. */
async function fetchLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/images/embassy-logo.png');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface BrandedExcelOptions {
  /** The sheet / document title (shown in the header banner, e.g. "REGISTRATIONS") */
  sheetTitle: string;
  /** Subtitle shown in row 2 (e.g. date range, event name) */
  subtitle?: string;
  /** Optional note shown in the spacer row 3 */
  note?: string;
  /** Column header labels — length determines column count */
  headers: string[];
  /** Data rows — each inner array must match the length of `headers` */
  rows: (string | number)[][];
  /** Base filename without extension or timestamp (e.g. "registrations") */
  filename: string;
  /** Optional per-column widths in characters (defaults to 18) */
  columnWidths?: number[];
}

export async function exportBrandedExcel(options: BrandedExcelOptions): Promise<void> {
  const { sheetTitle, subtitle, note, headers, rows, filename, columnWidths } = options;
  const colCount = headers.length;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Embassy Equestrian';
  const sheet = workbook.addWorksheet(sheetTitle);

  // ── Column widths ──────────────────────────────────────────────────────────
  sheet.columns = headers.map((_, i) => ({
    width: columnWidths?.[i] ?? 18,
  }));

  // Try to load the logo image
  const logoBase64 = await fetchLogoBase64();
  let logoImageId: number | null = null;
  if (logoBase64) {
    logoImageId = workbook.addImage({
      base64: logoBase64,
      extension: 'png',
    });
  }

  // Merge helper — col letters A, B, C…
  const colLetter = (n: number) => {
    let s = '';
    while (n > 0) {
      s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  const lastCol = colLetter(colCount);

  // ── Row 1 — Orange banner ──────────────────────────────────────────────────
  sheet.addRow(Array(colCount).fill(''));
  sheet.mergeCells(`A1:${lastCol}1`);
  sheet.getRow(1).height = 60;

  const titleCell = sheet.getCell('A1');
  titleCell.fill = ORANGE;
  titleCell.border = THIN_BORDER;

  if (logoImageId !== null && colCount >= 3) {
    // Logo occupies A1:B1 (white background); title spans C1-last on orange
    sheet.unMergeCells(`A1:${lastCol}1`);
    sheet.mergeCells('A1:B1');
    const thirdCol = colLetter(3);
    sheet.mergeCells(`${thirdCol}1:${lastCol}1`);

    // Logo cell — white background, merged A1:B1
    const logoCell = sheet.getCell('A1');
    logoCell.fill = WHITE_FILL;
    logoCell.border = THIN_BORDER;
    sheet.getCell('B1').fill = WHITE_FILL;
    sheet.getCell('B1').border = THIN_BORDER;

    // Embed logo image — scale within the existing A+B column widths
    sheet.addImage(logoImageId, {
      tl: { col: 0.1, row: 0.08 } as ExcelJS.Anchor,
      br: { col: 1.9, row: 0.92 } as ExcelJS.Anchor,
      editAs: 'oneCell',
    });

    // Title on orange
    const t = sheet.getCell(`${thirdCol}1`);
    t.value = 'EQUESTRIAN PREMIER LEAGUE';
    t.fill = ORANGE;
    t.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    t.alignment = { horizontal: 'center', vertical: 'middle' };
    t.border = THIN_BORDER;
  } else {
    // No logo — full-width title
    titleCell.value = `EMBASSY  ·  EQUESTRIAN PREMIER LEAGUE`;
    titleCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // ── Row 2 — Subtitle (orange) ──────────────────────────────────────────────
  sheet.addRow(Array(colCount).fill(''));
  sheet.mergeCells(`A2:${lastCol}2`);
  sheet.getRow(2).height = 30;
  const sub = sheet.getCell('A2');
  sub.value = subtitle ? subtitle.toUpperCase() : sheetTitle.toUpperCase();
  sub.fill = ORANGE;
  sub.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };
  sub.border = THIN_BORDER;

  // ── Row 3 — Note / spacer ──────────────────────────────────────────────────
  sheet.addRow(Array(colCount).fill(''));
  sheet.mergeCells(`A3:${lastCol}3`);
  sheet.getRow(3).height = 22;
  const noteCell = sheet.getCell('A3');
  noteCell.value = note ?? `Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  Embassy Equestrian Premier League`;
  noteCell.fill = WHITE_FILL;
  noteCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
  noteCell.alignment = { horizontal: 'center', vertical: 'middle' };
  noteCell.border = THIN_BORDER;

  // ── Row 4 — Column headers ─────────────────────────────────────────────────
  const headerRow = sheet.addRow(headers);
  styleCells(headerRow, HEADER_FILL, 'FFFFFFFF', 11, true, 'center');
  headerRow.height = 26;

  // ── Data rows ──────────────────────────────────────────────────────────────
  rows.forEach((rowData, i) => {
    const r = sheet.addRow(rowData);
    styleCells(r, i % 2 === 0 ? WHITE_FILL : ALT_FILL, 'FF111111', 10, false, 'center');
    r.height = 20;
  });

  // ── Write & download ───────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    buildTimestampedFileName(filename),
  );
}

/** Convenience: CSV export (unchanged from existing helpers, kept here for co-location) */
export function exportCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const esc = (f: string | number) => {
    const s = String(f);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
}
