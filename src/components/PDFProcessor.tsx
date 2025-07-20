import React, { useState } from 'react';
import { PDFUploadZone } from './PDFUploadZone';
import { PDFValidationResultComponent } from './PDFValidationResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PdfValidationResult } from '@/types/pdf';

export const PDFProcessor: React.FC = () => {
  const [validationResult, setValidationResult] = useState<PdfValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileValidated = (result: PdfValidationResult) => {
    console.log('🟢 Файл валидирован в PDFProcessor:', result);
    setValidationResult(result);
    
    if (result.isValid) {
      toast({
        title: "Файл успешно проверен",
        description: `PDF файл "${result.fileInfo.name}" готов к обработке`,
      });
    } else {
      toast({
        title: "Ошибка валидации",
        description: result.errors[0] || "Не удалось обработать файл",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setValidationResult(null);
    setIsProcessing(false);
  };

  const handleProcessDocument = async () => {
    if (!validationResult?.isValid) return;
    
    setIsProcessing(true);
    
    // Simulate document processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Документ обработан",
        description: "PDF файл успешно обработан и готов к использованию",
      });
    } catch (error) {
      toast({
        title: "Ошибка обработки",
        description: "Произошла ошибка при обработке документа",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Валидатор PDF документов
        </h1>
        <p className="text-muted-foreground">
          Загрузите PDF файл для анализа и предварительной оценки сложности обработки
        </p>
      </div>

      {/* Upload Zone */}
      {!validationResult && (
        <PDFUploadZone
          onFileValidated={handleFileValidated}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Validation Result */}
      {validationResult && (
        <div className="space-y-4">
          <PDFValidationResultComponent result={validationResult} />
          
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Действия с документом</CardTitle>
              <CardDescription>
                Выберите дальнейшие действия с проверенным PDF файлом
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Загрузить другой файл
                </Button>
                
                {validationResult.isValid && (
                  <>
                    <Button
                      onClick={handleProcessDocument}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {isProcessing ? 'Обработка...' : 'Начать обработку'}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      className="gap-2"
                      disabled
                    >
                      <Download className="w-4 h-4" />
                      Скачать отчет
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Info */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Возможности валидатора</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">📄 Проверка формата</h4>
              <p className="text-sm text-muted-foreground">
                Валидация MIME-type и структуры PDF файла
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">📊 Анализ содержимого</h4>
              <p className="text-sm text-muted-foreground">
                Определение типа PDF: текстовый, сканированный или смешанный
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">⏱️ Оценка времени</h4>
              <p className="text-sm text-muted-foreground">
                Расчет примерного времени обработки документа
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">🔢 Подсчет страниц</h4>
              <p className="text-sm text-muted-foreground">
                Определение количества страниц с проверкой лимита
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">🎯 Оценка сложности</h4>
              <p className="text-sm text-muted-foreground">
                Автоматическая классификация по уровню сложности
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">🚀 Drag & Drop</h4>
              <p className="text-sm text-muted-foreground">
                Удобный интерфейс с поддержкой перетаскивания файлов
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};