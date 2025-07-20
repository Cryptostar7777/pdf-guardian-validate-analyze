import React from 'react';
import { FileText, Clock, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { PdfValidationResult } from '@/types/pdf';

interface PDFValidationResultProps {
  result: PdfValidationResult;
  className?: string;
}

export const PDFValidationResultComponent: React.FC<PDFValidationResultProps> = ({
  result,
  className
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} сек`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} мин`;
    return `${Math.round(seconds / 3600)} ч`;
  };

  const getTypeLabel = (type: string): string => {
    const labels = {
      text: 'Текстовый PDF',
      scanned: 'Сканированный PDF',
      mixed: 'Смешанный PDF',
      unknown: 'Неопределенный тип'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeDescription = (type: string): string => {
    const descriptions = {
      text: 'PDF содержит извлекаемый текст',
      scanned: 'PDF содержит изображения отсканированных страниц',
      mixed: 'PDF содержит как текст, так и изображения',
      unknown: 'Не удалось определить тип содержимого'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  const getComplexityColor = (complexity: string): string => {
    const colors = {
      low: 'bg-success/10 text-success border-success/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      high: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return colors[complexity as keyof typeof colors] || '';
  };

  const getComplexityLabel = (complexity: string): string => {
    const labels = {
      low: 'Низкая',
      medium: 'Средняя',
      high: 'Высокая'
    };
    return labels[complexity as keyof typeof labels] || complexity;
  };

  if (!result.isValid) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-destructive">Ошибка валидации</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {result.errors[0] || 'Произошла неизвестная ошибка при валидации файла'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Имя файла:</span>
              <span className="font-medium">{result.fileInfo.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Размер файла:</span>
              <span className="font-medium">{formatFileSize(result.fileInfo.size)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-success", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <CardTitle className="text-success">Файл успешно проверен</CardTitle>
        </div>
        <CardDescription>
          PDF файл прошел валидацию и готов к обработке
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Info */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Информация о файле
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">{result.fileInfo.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(result.fileInfo.size)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-4 h-4 flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">#</span>
              </div>
              <div>
                <div className="font-medium text-sm">{result.fileInfo.pageCount} страниц</div>
                <div className="text-xs text-muted-foreground">
                  в документе
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Анализ документа
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Тип документа:</span>
              <Badge variant="outline" className="gap-1">
                <Info className="w-3 h-3" />
                {getTypeLabel(result.pdfType)}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {getTypeDescription(result.pdfType)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Сложность обработки:</span>
              <Badge 
                variant="outline" 
                className={cn("gap-1", getComplexityColor(result.complexity))}
              >
                <AlertTriangle className="w-3 h-3" />
                {getComplexityLabel(result.complexity)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Processing Estimate */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Оценка времени обработки
          </h4>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <div className="font-medium text-sm">
                Примерно {formatTime(result.estimatedProcessingTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                в зависимости от сложности документа
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Готовность к обработке</span>
            <span className="font-medium text-success">100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};