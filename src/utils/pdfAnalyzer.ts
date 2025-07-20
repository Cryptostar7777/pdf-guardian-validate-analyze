import * as pdfjsLib from 'pdfjs-dist';
import type { 
  PdfFileInfo, 
  PdfValidationResult, 
  ValidationConfig, 
  PdfAnalysisResult 
} from '@/types/pdf';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DEFAULT_CONFIG: ValidationConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxPages: 250,
  allowedTypes: ['application/pdf'],
  enableComplexityAnalysis: true,
  enableMetadataExtraction: true
};

export class PdfAnalyzer {
  static async validatePdfFile(
    file: File, 
    config: Partial<ValidationConfig> = {}
  ): Promise<PdfValidationResult> {
    const validationConfig = { ...DEFAULT_CONFIG, ...config };
    const errors: string[] = [];
    const warnings: string[] = [];

    const fileInfo: PdfFileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };

    // Basic file validation
    if (!validationConfig.allowedTypes.includes(file.type) && 
        !file.name.toLowerCase().endsWith('.pdf')) {
      errors.push('Файл должен быть в формате PDF');
    }

    if (file.size > validationConfig.maxFileSize) {
      errors.push(`Размер файла превышает ${validationConfig.maxFileSize / 1024 / 1024}MB`);
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        fileInfo,
        pdfType: 'unknown',
        complexity: 'low',
        estimatedProcessingTime: 0,
        errors,
        warnings
      };
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      fileInfo.pageCount = pdf.numPages;

      if (pdf.numPages > validationConfig.maxPages) {
        errors.push(`Документ содержит ${pdf.numPages} страниц. Максимально допустимо ${validationConfig.maxPages}`);
      }

      // Extract metadata if enabled
      if (validationConfig.enableMetadataExtraction) {
        fileInfo.metadata = await this.extractPdfMetadata(pdf);
      }

      // Analyze complexity if enabled
      let analysisResult: PdfAnalysisResult | null = null;
      if (validationConfig.enableComplexityAnalysis) {
        analysisResult = await this.analyzePdfComplexity(pdf);
      }

      const pdfType = analysisResult ? this.detectPdfType(analysisResult) : 'unknown';
      const complexity = analysisResult ? this.calculateComplexity(pdf.numPages, analysisResult) : 'low';
      const estimatedProcessingTime = this.estimateProcessingTime(pdf.numPages, complexity);

      return {
        isValid: errors.length === 0,
        fileInfo,
        pdfType,
        complexity,
        estimatedProcessingTime,
        errors,
        warnings
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
        warnings
      };
    }
  }

  static async analyzePdfComplexity(pdf: any): Promise<PdfAnalysisResult> {
    const analysis: PdfAnalysisResult = {
      hasText: false,
      hasImages: false,
      textDensity: 0,
      imageDensity: 0,
      structuralComplexity: 'simple'
    };

    const samplesToCheck = Math.min(5, pdf.numPages);
    let totalTextItems = 0;
    let totalImages = 0;

    for (let i = 1; i <= samplesToCheck; i++) {
      const page = await pdf.getPage(i);
      
      // Analyze text content
      const textContent = await page.getTextContent();
      const meaningfulText = textContent.items.filter((item: any) => 
        item.str && item.str.trim().length > 2
      );
      
      if (meaningfulText.length > 0) {
        analysis.hasText = true;
        totalTextItems += meaningfulText.length;
      }

      // Analyze images
      const operatorList = await page.getOperatorList();
      const hasImages = operatorList.fnArray.includes(pdfjsLib.OPS.paintImageXObject) ||
                       operatorList.fnArray.includes(pdfjsLib.OPS.paintInlineImageXObject);
      
      if (hasImages) {
        analysis.hasImages = true;
        totalImages++;
      }
    }

    // Calculate densities
    analysis.textDensity = totalTextItems / samplesToCheck;
    analysis.imageDensity = totalImages / samplesToCheck;

    // Determine structural complexity
    if (analysis.textDensity > 100 && analysis.hasImages) {
      analysis.structuralComplexity = 'complex';
    } else if (analysis.textDensity > 50 || analysis.hasImages) {
      analysis.structuralComplexity = 'moderate';
    }

    return analysis;
  }

  static detectPdfType(analysis: PdfAnalysisResult): 'text' | 'scanned' | 'mixed' | 'unknown' {
    if (analysis.hasText && analysis.hasImages && analysis.textDensity > 20) {
      return 'mixed';
    } else if (analysis.hasText && analysis.textDensity > 10) {
      return 'text';
    } else if (analysis.hasImages || analysis.textDensity < 5) {
      return 'scanned';
    }
    return 'unknown';
  }

  static estimateProcessingTime(pageCount: number, complexity: 'low' | 'medium' | 'high'): number {
    const baseTimePerPage = {
      low: 0.5,
      medium: 1.5,
      high: 3
    };
    
    return Math.round(pageCount * baseTimePerPage[complexity]);
  }

  static async extractPdfMetadata(pdf: any): Promise<PdfFileInfo['metadata']> {
    try {
      const metadata = await pdf.getMetadata();
      if (metadata.info) {
        return {
          title: metadata.info.Title,
          author: metadata.info.Author,
          subject: metadata.info.Subject,
          creator: metadata.info.Creator,
          producer: metadata.info.Producer,
          creationDate: metadata.info.CreationDate,
          modificationDate: metadata.info.ModDate
        };
      }
    } catch (error) {
      console.warn('Error extracting PDF metadata:', error);
    }
    return {};
  }

  private static calculateComplexity(
    pageCount: number, 
    analysis: PdfAnalysisResult
  ): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Page count factor
    if (pageCount > 100) score += 3;
    else if (pageCount > 50) score += 2;
    else if (pageCount > 20) score += 1;
    
    // Content complexity factor
    if (analysis.structuralComplexity === 'complex') score += 3;
    else if (analysis.structuralComplexity === 'moderate') score += 2;
    
    // Density factors
    if (analysis.textDensity > 100) score += 2;
    if (analysis.imageDensity > 0.5) score += 2;
    
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
}