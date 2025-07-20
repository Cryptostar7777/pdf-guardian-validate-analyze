import { FileText, Clock, Layers, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PdfValidationResult } from '@/types/pdf';

interface FileInfoProps {
  validationResult: PdfValidationResult;
}

export const FileInfo = ({ validationResult }: FileInfoProps) => {
  const { fileInfo, pdfType, complexity, estimatedProcessingTime } = validationResult;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU');
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'text':
        return { label: 'Текстовый', variant: 'default' as const, description: 'PDF с выделяемым текстом' };
      case 'scanned':
        return { label: 'Сканированный', variant: 'secondary' as const, description: 'PDF из изображений' };
      case 'mixed':
        return { label: 'Смешанный', variant: 'outline' as const, description: 'PDF с текстом и изображениями' };
      default:
        return { label: 'Неизвестный', variant: 'destructive' as const, description: 'Не удалось определить тип' };
    }
  };

  const getComplexityInfo = (level: string) => {
    switch (level) {
      case 'low':
        return { label: 'Низкая', variant: 'default' as const, color: 'text-green-600' };
      case 'medium':
        return { label: 'Средняя', variant: 'secondary' as const, color: 'text-yellow-600' };
      case 'high':
        return { label: 'Высокая', variant: 'destructive' as const, color: 'text-red-600' };
      default:
        return { label: 'Неизвестна', variant: 'outline' as const, color: 'text-muted-foreground' };
    }
  };

  const typeInfo = getTypeInfo(pdfType);
  const complexityInfo = getComplexityInfo(complexity);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Информация о файле</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic file info */}
        <div className="space-y-3">
          <div>
            <p className="font-medium text-lg">{fileInfo.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(fileInfo.size)} • Изменен {formatDate(fileInfo.lastModified)}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center space-x-1">
              <Layers className="h-4 w-4" />
              <span>{fileInfo.pageCount} страниц</span>
            </span>
            <Badge variant={typeInfo.variant}>
              {typeInfo.label}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Analysis results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">Тип документа</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {typeInfo.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4" />
              <span className="font-medium">Сложность</span>
            </div>
            <div className="ml-6 flex items-center space-x-2">
              <Badge variant={complexityInfo.variant}>
                {complexityInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Оценка времени обработки</span>
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Приблизительно {estimatedProcessingTime} секунд
          </p>
        </div>

        {/* Metadata if available */}
        {fileInfo.metadata && Object.keys(fileInfo.metadata).length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Метаданные</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {fileInfo.metadata.title && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Заголовок:</span>
                    <span className="text-right max-w-[200px] truncate">{fileInfo.metadata.title}</span>
                  </div>
                )}
                {fileInfo.metadata.author && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Автор:</span>
                    <span className="text-right max-w-[200px] truncate">{fileInfo.metadata.author}</span>
                  </div>
                )}
                {fileInfo.metadata.creator && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создано в:</span>
                    <span className="text-right max-w-[200px] truncate">{fileInfo.metadata.creator}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Warnings if any */}
        {validationResult.warnings && validationResult.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600">Предупреждения</h4>
            <ul className="text-sm space-y-1">
              {validationResult.warnings.map((warning, index) => (
                <li key={index} className="text-muted-foreground">• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};