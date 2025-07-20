export interface PdfFileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export interface PdfValidationResult {
  isValid: boolean;
  fileInfo: PdfFileInfo;
  pdfType: 'text' | 'scanned' | 'mixed' | 'unknown';
  complexity: 'low' | 'medium' | 'high';
  estimatedProcessingTime: number;
  errors: string[];
  warnings: string[];
}

export interface PdfAnalysisProgress {
  stage: 'uploading' | 'validating' | 'analyzing' | 'completed' | 'error';
  progress: number;
  currentTask: string;
  timeElapsed: number;
  timeRemaining?: number;
}

export interface ValidationConfig {
  maxFileSize: number;
  maxPages: number;
  allowedTypes: string[];
  enableComplexityAnalysis: boolean;
  enableMetadataExtraction: boolean;
}

export interface PdfAnalysisResult {
  hasText: boolean;
  hasImages: boolean;
  textDensity: number;
  imageDensity: number;
  structuralComplexity: 'simple' | 'moderate' | 'complex';
}