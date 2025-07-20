import * as pdfjsLib from 'pdfjs-dist';
import { 
  TextExtractionResult, 
  StructuredTextBlock, 
  PageText, 
  TextBlock, 
  ExtractionStats,
  TableStructure 
} from '@/types/parsing';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class TextExtractor {
  private static instance: TextExtractor;
  
  static getInstance(): TextExtractor {
    if (!TextExtractor.instance) {
      TextExtractor.instance = new TextExtractor();
    }
    return TextExtractor.instance;
  }

  async extractTextFromPDF(
    file: File,
    onProgress?: (progress: number, currentPage: number, totalPages: number) => void
  ): Promise<TextExtractionResult> {
    const startTime = Date.now();
    const stats: ExtractionStats = {
      totalPages: 0,
      processedPages: 0,
      textPages: 0,
      scannedPages: 0,
      totalTextLength: 0,
      processingTime: 0,
      errors: [],
      warnings: []
    };

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      stats.totalPages = pdf.numPages;

      const pageTexts: PageText[] = [];
      const allTextBlocks: TextBlock[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = await this.extractPageText(page, textContent, pageNum);
          
          pageTexts.push(pageText);
          allTextBlocks.push(...pageText.blocks);
          stats.processedPages++;

          if (pageText.text.trim().length > 0) {
            stats.textPages++;
          } else if (pageText.hasImages) {
            stats.scannedPages++;
          }

          stats.totalTextLength += pageText.text.length;

          // Report progress
          if (onProgress) {
            const progress = (pageNum / pdf.numPages) * 100;
            onProgress(progress, pageNum, pdf.numPages);
          }
        } catch (error) {
          stats.errors.push(`Error processing page ${pageNum}: ${error}`);
          console.error(`Error processing page ${pageNum}:`, error);
        }
      }

      const fullText = pageTexts.map(p => p.text).join('\n\n');
      const structuredText = this.preserveDocumentStructure(allTextBlocks);

      stats.processingTime = Date.now() - startTime;

      return {
        fullText,
        structuredText,
        pageTexts,
        extractionStats: stats
      };
    } catch (error) {
      stats.errors.push(`Fatal error: ${error}`);
      stats.processingTime = Date.now() - startTime;
      throw error;
    }
  }

  private async extractPageText(
    page: any, 
    textContent: any, 
    pageNumber: number
  ): Promise<PageText> {
    const viewport = page.getViewport({ scale: 1.0 });
    const blocks: TextBlock[] = [];
    let pageTextContent = '';

    // Extract text blocks with positioning
    textContent.items.forEach((item: any) => {
      if (item.str && item.str.trim()) {
        const block: TextBlock = {
          text: item.str,
          x: item.transform[4],
          y: viewport.height - item.transform[5], // Convert to top-down coordinates
          width: item.width || 0,
          height: item.height || 0,
          fontSize: Math.abs(item.transform[0]) || 12,
          fontName: item.fontName || 'unknown',
          pageNumber
        };
        blocks.push(block);
        pageTextContent += item.str + ' ';
      }
    });

    // Check for images/graphics (simplified detection)
    const operators = await page.getOperatorList();
    const hasImages = operators.fnArray.some((fn: number) => 
      fn === pdfjsLib.OPS.paintImageXObject || 
      fn === pdfjsLib.OPS.paintXObject
    );

    // Determine if OCR is needed
    const needsOCR = pageTextContent.trim().length < 50 && hasImages;

    return {
      pageNumber,
      text: pageTextContent.trim(),
      blocks,
      hasImages,
      needsOCR
    };
  }

  preserveDocumentStructure(textBlocks: TextBlock[]): StructuredTextBlock[] {
    const structuredBlocks: StructuredTextBlock[] = [];
    
    // Group blocks by proximity and characteristics
    const groupedBlocks = this.groupTextBlocks(textBlocks);
    
    for (const group of groupedBlocks) {
      const block = this.analyzeTextGroup(group);
      structuredBlocks.push(block);
    }

    return structuredBlocks;
  }

  private groupTextBlocks(blocks: TextBlock[]): TextBlock[][] {
    if (blocks.length === 0) return [];

    // Sort blocks by page, then by vertical position, then by horizontal position
    const sortedBlocks = [...blocks].sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
      if (Math.abs(a.y - b.y) > 5) return a.y - b.y;
      return a.x - b.x;
    });

    const groups: TextBlock[][] = [];
    let currentGroup: TextBlock[] = [sortedBlocks[0]];

    for (let i = 1; i < sortedBlocks.length; i++) {
      const current = sortedBlocks[i];
      const previous = sortedBlocks[i - 1];

      // Check if blocks should be grouped together
      const samePageLine = current.pageNumber === previous.pageNumber && 
                          Math.abs(current.y - previous.y) <= 5;
      const verticalProximity = current.pageNumber === previous.pageNumber && 
                               Math.abs(current.y - previous.y) <= previous.fontSize * 1.5;

      if (samePageLine || verticalProximity) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  private analyzeTextGroup(blocks: TextBlock[]): StructuredTextBlock {
    if (blocks.length === 0) {
      throw new Error('Cannot analyze empty text group');
    }

    const text = blocks.map(b => b.text).join(' ').trim();
    const firstBlock = blocks[0];
    
    // Determine block type based on characteristics
    const type = this.determineBlockType(text, blocks);
    const level = type === 'heading' ? this.determineHeadingLevel(blocks) : undefined;

    return {
      type,
      level,
      text,
      blocks,
      position: {
        page: firstBlock.pageNumber,
        x: firstBlock.x,
        y: firstBlock.y
      },
      metadata: this.extractBlockMetadata(text, type)
    };
  }

  private determineBlockType(text: string, blocks: TextBlock[]): StructuredTextBlock['type'] {
    // Check for heading patterns
    if (this.isHeading(text, blocks)) {
      return 'heading';
    }

    // Check for list patterns
    if (this.isList(text)) {
      return 'list';
    }

    // Check for table patterns
    if (this.isTable(text, blocks)) {
      return 'table';
    }

    // Default to paragraph
    return 'paragraph';
  }

  private isHeading(text: string, blocks: TextBlock[]): boolean {
    const avgFontSize = blocks.reduce((sum, b) => sum + b.fontSize, 0) / blocks.length;
    const isLargerFont = avgFontSize > 14;
    const isShort = text.length < 100;
    const hasHeadingPattern = /^(\d+\.?\s+|[A-Z][A-Z\s]+|Chapter|Section|Part)/i.test(text);
    const endsWithoutPeriod = !text.endsWith('.');

    return (isLargerFont && isShort) || hasHeadingPattern || (isShort && endsWithoutPeriod);
  }

  private isList(text: string): boolean {
    const listPatterns = [
      /^[\u2022\u2023\u25E6\u2043\u2219]\s+/,  // Bullet points
      /^\d+[\.\)]\s+/,                         // Numbered lists
      /^[a-zA-Z][\.\)]\s+/,                    // Lettered lists
      /^[-\*\+]\s+/                            // Dash/asterisk lists
    ];

    return listPatterns.some(pattern => pattern.test(text));
  }

  private isTable(text: string, blocks: TextBlock[]): boolean {
    // Simple heuristic: multiple blocks on same line with regular spacing
    if (blocks.length < 2) return false;

    const sameLineBlocks = blocks.filter(b => 
      Math.abs(b.y - blocks[0].y) <= 3
    );

    return sameLineBlocks.length >= 3 && /\t|\s{3,}/.test(text);
  }

  private determineHeadingLevel(blocks: TextBlock[]): number {
    const avgFontSize = blocks.reduce((sum, b) => sum + b.fontSize, 0) / blocks.length;
    
    if (avgFontSize >= 24) return 1;
    if (avgFontSize >= 20) return 2;
    if (avgFontSize >= 18) return 3;
    if (avgFontSize >= 16) return 4;
    if (avgFontSize >= 14) return 5;
    return 6;
  }

  private extractBlockMetadata(text: string, type: StructuredTextBlock['type']): any {
    const metadata: any = {};

    if (type === 'list') {
      if (/^\d+/.test(text)) {
        metadata.isNumbered = true;
        metadata.listType = 'numbered';
      } else {
        metadata.isNumbered = false;
        metadata.listType = 'bullet';
      }
    }

    if (type === 'table') {
      // Simple table data extraction
      const rows = text.split('\n').map(row => row.split(/\t|\s{3,}/));
      metadata.tableData = rows;
    }

    return metadata;
  }

  detectTextBlocks(pageContent: any): TextBlock[] {
    const blocks: TextBlock[] = [];
    
    if (pageContent && pageContent.items) {
      pageContent.items.forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          blocks.push({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width || 0,
            height: item.height || 0,
            fontSize: Math.abs(item.transform[0]) || 12,
            fontName: item.fontName || 'unknown',
            pageNumber: 1 // Will be set by caller
          });
        }
      });
    }

    return blocks;
  }

  async extractTabularData(page: any): Promise<TableStructure[]> {
    const tables: TableStructure[] = [];
    
    try {
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Group text items by approximate rows and columns
      const items = textContent.items.filter((item: any) => item.str.trim());
      
      // Simple table detection based on alignment
      const rows = this.groupItemsIntoRows(items, viewport.height);
      const potentialTables = this.identifyTables(rows);
      
      for (const tableRows of potentialTables) {
        const tableData = tableRows.map(row => 
          row.map(item => item.str.trim()).filter(str => str.length > 0)
        );
        
        if (tableData.length > 1 && tableData[0].length > 1) {
          const firstRow = tableRows[0];
          const lastRow = tableRows[tableRows.length - 1];
          
          tables.push({
            rows: tableData,
            headers: tableData[0].length === tableData[1]?.length ? tableData[0] : undefined,
            page: 1, // Will be set by caller
            position: {
              x: Math.min(...firstRow.map(item => item.transform[4])),
              y: viewport.height - Math.max(...firstRow.map(item => item.transform[5])),
              width: Math.max(...lastRow.map(item => item.transform[4] + (item.width || 0))) - 
                     Math.min(...firstRow.map(item => item.transform[4])),
              height: Math.abs(firstRow[0].transform[5] - lastRow[0].transform[5])
            },
            confidence: 0.8 // Placeholder confidence score
          });
        }
      }
    } catch (error) {
      console.error('Error extracting tabular data:', error);
    }
    
    return tables;
  }

  private groupItemsIntoRows(items: any[], pageHeight: number): any[][] {
    const tolerance = 5; // Vertical tolerance for same row
    const rows: any[][] = [];
    
    // Sort items by vertical position (top to bottom)
    const sortedItems = items.sort((a, b) => 
      (pageHeight - b.transform[5]) - (pageHeight - a.transform[5])
    );
    
    let currentRow: any[] = [];
    let currentY = sortedItems[0] ? pageHeight - sortedItems[0].transform[5] : 0;
    
    for (const item of sortedItems) {
      const itemY = pageHeight - item.transform[5];
      
      if (Math.abs(itemY - currentY) <= tolerance) {
        currentRow.push(item);
      } else {
        if (currentRow.length > 0) {
          // Sort row items by horizontal position
          currentRow.sort((a, b) => a.transform[4] - b.transform[4]);
          rows.push(currentRow);
        }
        currentRow = [item];
        currentY = itemY;
      }
    }
    
    if (currentRow.length > 0) {
      currentRow.sort((a, b) => a.transform[4] - b.transform[4]);
      rows.push(currentRow);
    }
    
    return rows;
  }

  private identifyTables(rows: any[][]): any[][][] {
    const tables: any[][][] = [];
    let currentTable: any[][] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Check if this row could be part of a table
      if (row.length >= 2 && this.looksLikeTableRow(row, rows[i - 1])) {
        currentTable.push(row);
      } else {
        // End current table if it has enough rows
        if (currentTable.length >= 2) {
          tables.push([...currentTable]);
        }
        currentTable = [];
        
        // Start new table if this row looks tabular
        if (row.length >= 2) {
          currentTable.push(row);
        }
      }
    }
    
    // Add final table if exists
    if (currentTable.length >= 2) {
      tables.push(currentTable);
    }
    
    return tables;
  }

  private looksLikeTableRow(currentRow: any[], previousRow?: any[]): boolean {
    if (!previousRow) return currentRow.length >= 2;
    
    // Check if column count is similar
    const columnCountSimilar = Math.abs(currentRow.length - previousRow.length) <= 1;
    
    // Check if horizontal positions align somewhat
    const alignmentThreshold = 20;
    let alignedColumns = 0;
    
    for (let i = 0; i < Math.min(currentRow.length, previousRow.length); i++) {
      const currentX = currentRow[i].transform[4];
      const previousX = previousRow[i].transform[4];
      
      if (Math.abs(currentX - previousX) <= alignmentThreshold) {
        alignedColumns++;
      }
    }
    
    const alignmentRatio = alignedColumns / Math.max(currentRow.length, previousRow.length);
    
    return columnCountSimilar && alignmentRatio >= 0.5;
  }
}

// Export singleton instance
export const textExtractor = TextExtractor.getInstance();