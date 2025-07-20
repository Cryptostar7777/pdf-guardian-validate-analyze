import * as pdfjsLib from 'pdfjs-dist';
import type { PDFValidationResult, PDFAnalysis } from '@/types/pdf';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_PAGES = 250;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export class PDFValidator {
  static async validateFile(file: File): Promise<PDFValidationResult> {
    const result: PDFValidationResult = {
      isValid: false,
      pageCount: 0,
      fileSize: file.size,
      fileName: file.name,
      pdfType: 'unknown',
      estimatedProcessingTime: 0,
      complexity: 'low'
    };

    try {
      // Check file type
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        result.error = 'Файл должен быть в формате PDF';
        return result;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        result.error = `Размер файла не должен превышать ${MAX_FILE_SIZE / 1024 / 1024}MB`;
        return result;
      }

      // Load PDF document
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      result.pageCount = pdf.numPages;

      // Check page limit
      if (result.pageCount > MAX_PAGES) {
        result.error = `Документ содержит ${result.pageCount} страниц. Максимально допустимо ${MAX_PAGES} страниц.`;
        return result;
      }

      // Analyze PDF content
      const analysis = await this.analyzePDFContent(pdf);
      result.pdfType = this.determinePDFType(analysis);
      result.complexity = this.calculateComplexity(result.pageCount, analysis);
      result.estimatedProcessingTime = this.estimateProcessingTime(result.pageCount, result.complexity);
      
      result.isValid = true;
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Ошибка при анализе PDF файла';
    }

    return result;
  }

  private static async analyzePDFContent(pdf: any): Promise<PDFAnalysis> {
    const analysis: PDFAnalysis = {
      hasText: false,
      hasImages: false,
      metadata: {}
    };

    try {
      // Get metadata
      const metadata = await pdf.getMetadata();
      if (metadata.info) {
        analysis.metadata = {
          title: metadata.info.Title,
          author: metadata.info.Author,
          subject: metadata.info.Subject,
          creator: metadata.info.Creator,
          producer: metadata.info.Producer,
          creationDate: metadata.info.CreationDate,
          modificationDate: metadata.info.ModDate
        };
      }

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

  private static determinePDFType(analysis: PDFAnalysis): 'text' | 'scanned' | 'mixed' | 'unknown' {
    if (analysis.hasText && analysis.hasImages) {
      return 'mixed';
    } else if (analysis.hasText) {
      return 'text';
    } else if (analysis.hasImages) {
      return 'scanned';
    }
    return 'unknown';
  }

  private static calculateComplexity(pageCount: number, analysis: PDFAnalysis): 'low' | 'medium' | 'high' {
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