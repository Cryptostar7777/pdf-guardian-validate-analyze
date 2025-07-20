export interface TextBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  pageNumber: number;
}

export interface StructuredTextBlock {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'other';
  level?: number; // For headings (1-6)
  text: string;
  blocks: TextBlock[];
  position: {
    page: number;
    x: number;
    y: number;
  };
  metadata?: {
    isNumbered?: boolean;
    listType?: 'bullet' | 'numbered';
    tableData?: string[][];
  };
}

export interface PageText {
  pageNumber: number;
  text: string;
  blocks: TextBlock[];
  hasImages: boolean;
  needsOCR: boolean;
}

export interface ExtractionStats {
  totalPages: number;
  processedPages: number;
  textPages: number;
  scannedPages: number;
  totalTextLength: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
}

export interface TextExtractionResult {
  fullText: string;
  structuredText: StructuredTextBlock[];
  pageTexts: PageText[];
  extractionStats: ExtractionStats;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
  pageNumber: number;
  processingTime: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface TextRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  hasText: boolean;
}

export interface DocumentStructure {
  title?: string;
  headings: Heading[];
  sections: DocumentSection[];
  lists: ListStructure[];
  tables: TableStructure[];
  hierarchy: DocumentTree;
  metadata: {
    totalSections: number;
    maxHeadingLevel: number;
    hasTableOfContents: boolean;
  };
}

export interface Heading {
  level: number;
  text: string;
  page: number;
  position: { x: number; y: number };
  id: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  startPage: number;
  endPage: number;
  content: StructuredTextBlock[];
  subsections: DocumentSection[];
}

export interface DocumentTree {
  root: DocumentNode;
  nodes: Map<string, DocumentNode>;
}

export interface DocumentNode {
  id: string;
  title: string;
  level: number;
  page: number;
  children: DocumentNode[];
  parent?: DocumentNode;
}

export interface ListStructure {
  type: 'bullet' | 'numbered';
  items: ListItem[];
  startPage: number;
  endPage: number;
  level: number;
}

export interface ListItem {
  text: string;
  page: number;
  level: number;
  subitems: ListItem[];
}

export interface TableStructure {
  rows: string[][];
  headers?: string[];
  page: number;
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface ParsingProgress {
  stage: 'idle' | 'extracting' | 'ocr-processing' | 'analyzing' | 'completed' | 'error';
  currentPage: number;
  totalPages: number;
  currentTask: string;
  progress: number; // 0-100
  timeElapsed: number;
  timeRemaining?: number;
  stats: {
    textPagesProcessed: number;
    ocrPagesProcessed: number;
    errorsCount: number;
  };
}

export interface ParsingError {
  type: 'extraction' | 'ocr' | 'analysis' | 'memory' | 'timeout';
  message: string;
  page?: number;
  details?: any;
  isRecoverable: boolean;
}

export interface ParsingConfig {
  enableOCR: boolean;
  ocrLanguage: string;
  preserveFormatting: boolean;
  extractTables: boolean;
  extractImages: boolean;
  maxProcessingTime: number; // seconds
  enableProgressiveProcessing: boolean;
}