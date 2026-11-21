import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { AnyAnnotation, PageMeta, WatermarkSettings } from './types';

// Helper to parse hex color to pdf-lib rgb
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export async function exportFinalPdf(
  sourcePdfBytes: ArrayBuffer | Uint8Array,
  pagesMeta: PageMeta[],
  annotations: AnyAnnotation[],
  watermarkSettings?: WatermarkSettings,
  studentId?: string
): Promise<Uint8Array> {
  const originalPdf = await PDFDocument.load(sourcePdfBytes);
  const outPdf = await PDFDocument.create();

  // Fonts cache
  const fontHelvetica = await outPdf.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await outPdf.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaItalic = await outPdf.embedFont(StandardFonts.HelveticaOblique);
  const fontTimes = await outPdf.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await outPdf.embedFont(StandardFonts.TimesRomanBold);
  const fontCourier = await outPdf.embedFont(StandardFonts.Courier);
  const fontCourierBold = await outPdf.embedFont(StandardFonts.CourierBold);

  const getFont = (family?: string, bold?: boolean, italic?: boolean) => {
    if (family === 'Times') return bold ? fontTimesBold : fontTimes;
    if (family === 'Courier') return bold ? fontCourierBold : fontCourier;
    if (italic) return fontHelveticaItalic;
    return bold ? fontHelveticaBold : fontHelvetica;
  };

  // 1. Process Page Reordering & Copying
  for (let i = 0; i < pagesMeta.length; i++) {
    const meta = pagesMeta[i];
    const srcIndex = meta.pageIndex;

    let targetPage;
    if (srcIndex < originalPdf.getPageCount()) {
      const [copiedPage] = await outPdf.copyPages(originalPdf, [srcIndex]);
      targetPage = outPdf.addPage(copiedPage);
    } else {
      // Blank newly added page (A4 default: 595.28 x 841.89)
      targetPage = outPdf.addPage([meta.width || 595.28, meta.height || 841.89]);
    }

    // Apply rotation
    if (meta.rotation) {
      targetPage.setRotation(degrees(meta.rotation));
    }

    const { width: pageWidth, height: pageHeight } = targetPage.getSize();

    // 2. Filter annotations belonging to this page
    const pageAnnots = annotations.filter((a) => a.pageIndex === i);

    // Group 2a: Redactions & Whiteout Masks (Bake first so they mask background)
    for (const annot of pageAnnots) {
      if (annot.type === 'redaction') {
        const c = hexToRgb(annot.fillColor || '#000000');
        targetPage.drawRectangle({
          x: annot.x,
          y: pageHeight - annot.y - annot.height,
          width: annot.width,
          height: annot.height,
          color: rgb(c.r, c.g, c.b),
        });
      } else if (annot.type === 'text-replace') {
        // Draw mask over original text
        const maskColor = hexToRgb(annot.maskColor || '#ffffff');
        targetPage.drawRectangle({
          x: annot.x,
          y: pageHeight - annot.y - annot.height,
          width: annot.width,
          height: annot.height,
          color: rgb(maskColor.r, maskColor.g, maskColor.b),
        });

        // Draw replacement text on top
        if (annot.replacementText) {
          const textColor = hexToRgb(annot.color || '#000000');
          const font = getFont(annot.fontFamily);
          targetPage.drawText(annot.replacementText, {
            x: annot.x + 2,
            y: pageHeight - annot.y - (annot.fontSize || 12),
            size: annot.fontSize || 12,
            font,
            color: rgb(textColor.r, textColor.g, textColor.b),
          });
        }
      }
    }

    // Group 2b: Highlighters
    for (const annot of pageAnnots) {
      if (annot.type === 'highlight') {
        const c = hexToRgb(annot.color || '#fef08a');
        targetPage.drawRectangle({
          x: annot.x,
          y: pageHeight - annot.y - annot.height,
          width: annot.width,
          height: annot.height,
          color: rgb(c.r, c.g, c.b),
          opacity: annot.opacity || 0.45,
        });
      }
    }

    // Group 2c: Shapes
    for (const annot of pageAnnots) {
      if (annot.type === 'shape') {
        const stroke = hexToRgb(annot.strokeColor || '#8B5CF6');
        const fill = annot.fillColor ? hexToRgb(annot.fillColor) : undefined;
        const pdfY = pageHeight - annot.y - annot.height;

        if (annot.shapeType === 'rectangle') {
          targetPage.drawRectangle({
            x: annot.x,
            y: pdfY,
            width: annot.width,
            height: annot.height,
            borderColor: rgb(stroke.r, stroke.g, stroke.b),
            borderWidth: annot.strokeWidth || 2,
            color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
            opacity: annot.opacity || 1,
          });
        } else if (annot.shapeType === 'circle') {
          const xRadius = annot.width / 2;
          const yRadius = annot.height / 2;
          targetPage.drawEllipse({
            x: annot.x + xRadius,
            y: pdfY + yRadius,
            xScale: xRadius,
            yScale: yRadius,
            borderColor: rgb(stroke.r, stroke.g, stroke.b),
            borderWidth: annot.strokeWidth || 2,
            color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
            opacity: annot.opacity || 1,
          });
        } else if (annot.shapeType === 'line' || annot.shapeType === 'arrow') {
          targetPage.drawLine({
            start: { x: annot.x, y: pageHeight - annot.y },
            end: { x: annot.x + annot.width, y: pdfY },
            color: rgb(stroke.r, stroke.g, stroke.b),
            thickness: annot.strokeWidth || 2,
            opacity: annot.opacity || 1,
          });
        }
      }
    }

    // Group 2d: Freehand Drawings
    for (const annot of pageAnnots) {
      if (annot.type === 'draw' && annot.points.length > 1) {
        const c = hexToRgb(annot.color || '#000000');
        for (let p = 0; p < annot.points.length - 1; p++) {
          const pt1 = annot.points[p];
          const pt2 = annot.points[p + 1];
          targetPage.drawLine({
            start: { x: pt1.x, y: pageHeight - pt1.y },
            end: { x: pt2.x, y: pageHeight - pt2.y },
            color: rgb(c.r, c.g, c.b),
            thickness: annot.strokeWidth || 2,
            opacity: annot.opacity || 1,
          });
        }
      }
    }

    // Group 2e: Images & Signatures
    for (const annot of pageAnnots) {
      if ((annot.type === 'image' || annot.type === 'signature') && annot.dataUrl) {
        try {
          let embeddedImg;
          if (annot.dataUrl.startsWith('data:image/jpeg') || annot.dataUrl.startsWith('data:image/jpg')) {
            embeddedImg = await outPdf.embedJpg(annot.dataUrl);
          } else {
            embeddedImg = await outPdf.embedPng(annot.dataUrl);
          }

          targetPage.drawImage(embeddedImg, {
            x: annot.x,
            y: pageHeight - annot.y - annot.height,
            width: annot.width,
            height: annot.height,
            opacity: annot.opacity || 1,
          });
        } catch (imgErr) {
          console.warn('Failed embedding image or signature', imgErr);
        }
      }
    }

    // Group 2f: Text Elements
    for (const annot of pageAnnots) {
      if (annot.type === 'text' && annot.text) {
        const c = hexToRgb(annot.color || '#000000');
        const font = getFont(annot.fontFamily, annot.isBold, annot.isItalic);
        const fontSize = annot.fontSize || 14;

        // If background color is set, draw background box
        if (annot.backgroundColor) {
          const bg = hexToRgb(annot.backgroundColor);
          targetPage.drawRectangle({
            x: annot.x,
            y: pageHeight - annot.y - annot.height,
            width: annot.width,
            height: annot.height,
            color: rgb(bg.r, bg.g, bg.b),
          });
        }

        // Split text by lines
        const lines = annot.text.split('\n');
        lines.forEach((line, lineIdx) => {
          targetPage.drawText(line, {
            x: annot.x + 4,
            y: pageHeight - annot.y - (lineIdx + 1) * (fontSize * 1.2),
            size: fontSize,
            font,
            color: rgb(c.r, c.g, c.b),
            opacity: annot.opacity || 1,
          });
        });
      }
    }

    // Group 2g: Stamps
    for (const annot of pageAnnots) {
      if (annot.type === 'stamp') {
        const stampTexts: Record<string, { text: string; color: { r: number; g: number; b: number } }> = {
          APPROVED: { text: '✓ APPROVED FOR SUBMISSION', color: { r: 0.05, g: 0.6, b: 0.3 } },
          VERIFIED: { text: `✓ VERIFIED VSS SCHOLAR · [${studentId || 'SHADOW_SCHOLAR_01'}]`, color: { r: 0.74, g: 0.95, b: 0.39 } },
          CONFIDENTIAL: { text: '🔒 CONFIDENTIAL / EVALUATION ONLY', color: { r: 0.85, g: 0.2, b: 0.2 } },
          DRAFT: { text: '📝 DRAFT STUDY RECORD', color: { r: 0.9, g: 0.6, b: 0.1 } },
          STUDENT_ID: { text: `CODE NAME: [${studentId || 'SHADOW_SCHOLAR_01'}]`, color: { r: 0.2, g: 0.5, b: 0.8 } },
        };

        const config = stampTexts[annot.stampType] || stampTexts.VERIFIED;
        const scale = annot.scale || 1;
        const font = fontHelveticaBold;
        const size = 16 * scale;

        // Stamp border box
        const textWidth = font.widthOfTextAtSize(config.text, size);
        const boxWidth = textWidth + 24 * scale;
        const boxHeight = size + 16 * scale;
        const pdfY = pageHeight - annot.y - boxHeight;

        targetPage.drawRectangle({
          x: annot.x,
          y: pdfY,
          width: boxWidth,
          height: boxHeight,
          borderColor: rgb(config.color.r, config.color.g, config.color.b),
          borderWidth: 2 * scale,
          color: rgb(config.color.r, config.color.g, config.color.b),
          opacity: 0.12,
        });

        targetPage.drawText(config.text, {
          x: annot.x + 12 * scale,
          y: pdfY + 8 * scale,
          size,
          font,
          color: rgb(config.color.r, config.color.g, config.color.b),
          opacity: 0.9,
        });
      }
    }

    // Group 2h: Institutional Watermark (if configured)
    if (watermarkSettings && watermarkSettings.enabled && watermarkSettings.text) {
      const colorMap = {
        emerald: rgb(0.06, 0.5, 0.35),
        amber: rgb(0.85, 0.45, 0.05),
        slate: rgb(0.4, 0.45, 0.5),
      };

      const wmColor = colorMap[watermarkSettings.color] || colorMap.emerald;

      // Diagonal watermark in center
      targetPage.drawText(watermarkSettings.text, {
        x: pageWidth / 6,
        y: pageHeight / 2,
        size: Math.max(16, Math.min(26, pageWidth / 24)),
        font: fontHelveticaBold,
        color: wmColor,
        opacity: watermarkSettings.opacity || 0.25,
        rotate: degrees(watermarkSettings.rotation || 45),
      });

      // Top institutional header banner
      if (watermarkSettings.includeStudentHeader) {
        targetPage.drawText(`VSS VERIFIED ACADEMIC RESOURCE · AUTH: [${studentId || 'SHADOW_SCHOLAR_01'}]`, {
          x: 36,
          y: pageHeight - 24,
          size: 7.5,
          font: fontHelveticaBold,
          color: rgb(0.35, 0.35, 0.35),
          opacity: 0.6,
        });
      }
    }
  }

  const finalBytes = await outPdf.save();
  return finalBytes;
}
