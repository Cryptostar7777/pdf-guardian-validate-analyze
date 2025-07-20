import * as pdfjsLib from 'pdfjs-dist';
import type { PdfValidationResult, PdfFileInfo } from '@/types/pdf';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_PAGES = 250;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export class PDFValidator {
  static async validateFile(file: File): Promise<PdfValidationResult> {
    const fileInfo: PdfFileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };

    const errors: string[] = [];

    try {
      // Check file type
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        errors.push('Файл должен быть в формате PDF');
        return {
          isValid: false,
          fileInfo,
          pdfType: 'unknown',
          complexity: 'low',
          estimatedProcessingTime: 0,
          errors,
          warnings: []
        };
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Размер файла не должен превышать ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return {
          isValid: false,
          fileInfo,
          pdfType: 'unknown',
          complexity: 'low',
          estimatedProcessingTime: 0,
          errors,
          warnings: []
        };
      }

      // Load PDF document
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      fileInfo.pageCount = pdf.numPages;

      // Check page limit
      if (fileInfo.pageCount > MAX_PAGES) {
        errors.push(`Документ содержит ${fileInfo.pageCount} страниц. Максимально допустимо ${MAX_PAGES} страниц.`);
        return {
          isValid: false,
          fileInfo,
          pdfType: 'unknown',
          complexity: 'low',
          estimatedProcessingTime: 0,
          errors,
          warnings: []
        };
      }

      // Analyze PDF content
      const analysis = await this.analyzePDFContent(pdf);
      const pdfType = this.determinePDFType(analysis);
      const complexity = this.calculateComplexity(fileInfo.pageCount, analysis);
      const estimatedProcessingTime = this.estimateProcessingTime(fileInfo.pageCount, complexity);
      
      return {
        isValid: true,
        fileInfo,
        pdfType,
        complexity,
        estimatedProcessingTime,
        errors: [],
        warnings: []
      };
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Ошибка при анализе PDF файла');
      return {
        isValid: false,
        fileInfo,
        pdfType: 'unknown',
        complexity: 'low',
        estimatedProcessingTime: 0,
        errors,
        warnings: []
      };
    }
  }

  private static async analyzePDFContent(pdf: any): Promise<{ hasText: boolean; hasImages: boolean }> {
    const analysis = {
      hasText: false,
      hasImages: false
    };

    try {
      // Sample first few pages to determine content type
      const samplesToCheck = Math.min(5, pdf.numPages);
      
      for (let i = 1; i <= samplesToCheck; i++) {
        const page = await pdf.getPage(i);
        
        // Check for text content
        const textContent = await page.getTextContent();
        if (textContent.items.length > 0) {
          const hasSignificantText = textContent.items.some((item: any) => 
            item.str && item.str.trim().length > 3
          );
          if (hasSignificantText) {
            analysis.hasText = true;
          }
        }

        // Check for images
        const operatorList = await page.getOperatorList();
        const hasImages = operatorList.fnArray.includes(pdfjsLib.OPS.paintImageXObject) ||
                         operatorList.fnArray.includes(pdfjsLib.OPS.paintInlineImageXObject);
        if (hasImages) {
          analysis.hasImages = true;
        }

        // Early exit if we found both
        if (analysis.hasText && analysis.hasImages) break;
      }

    } catch (error) {
      console.warn('Error analyzing PDF content:', error);
    }

    return analysis;
  }

  private static determinePDFType(analysis: { hasText: boolean; hasImages: boolean }): 'text' | 'scanned' | 'mixed' | 'unknown' {
    if (analysis.hasText && analysis.hasImages) {
      return 'mixed';
    } else if (analysis.hasText) {
      return 'text';
    } else if (analysis.hasImages) {
      return 'scanned';
    }
    return 'unknown';
  }

  private static calculateComplexity(pageCount: number, analysis: { hasText: boolean; hasImages: boolean }): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Page count factor
    if (pageCount > 100) score += 3;
    else if (pageCount > 50) score += 2;
    else if (pageCount > 20) score += 1;
    
    // Content type factor
    if (analysis.hasImages) score += 2;
    if (analysis.hasText && analysis.hasImages) score += 1; // Mixed content
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  private static estimateProcessingTime(pageCount: number, complexity: 'low' | 'medium' | 'high'): number {
    const baseTimePerPage = {
      low: 0.5,    // 0.5 seconds per page
      medium: 1.5, // 1.5 seconds per page
      high: 3      // 3 seconds per page
    };
    
    return Math.round(pageCount * baseTimePerPage[complexity]);
  }
}