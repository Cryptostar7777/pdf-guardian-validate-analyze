export interface PDFValidationResult {
  isValid: boolean;
  pageCount: number;
  fileSize: number;
  fileName: string;
  pdfType: 'text' | 'scanned' | 'mixed' | 'unknown';
  estimatedProcessingTime: number;
  complexity: 'low' | 'medium' | 'high';
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface PDFAnalysis {
  hasText: boolean;
  hasImages: boolean;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}