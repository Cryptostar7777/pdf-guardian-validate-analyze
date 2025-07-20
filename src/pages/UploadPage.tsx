import { useState } from 'react';
import { ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PdfUploader } from '@/components/PdfUploader';
import { FileInfo } from '@/components/FileInfo';
import type { PdfValidationResult } from '@/types/pdf';

export const UploadPage = () => {
  const [validationResult, setValidationResult] = useState<PdfValidationResult | null>(null);

  const handleFileValidated = (result: PdfValidationResult) => {
    setValidationResult(result);
  };

  const handleNextStep = () => {
    // Навигация к следующему этапу
    console.log('Переход к следующему этапу с файлом:', validationResult?.fileInfo.name);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Загрузка и анализ PDF
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Загрузите PDF документ для валидации и предварительного анализа
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              1
            </div>
            <span className="font-medium">Загрузка</span>
          </div>
          <div className="w-12 h-0.5 bg-border"></div>
          <div className="flex items-center space-x-2 opacity-50">
            <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span>Обработка</span>
          </div>
          <div className="w-12 h-0.5 bg-border opacity-50"></div>
          <div className="flex items-center space-x-2 opacity-50">
            <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span>Результат</span>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Upload section */}
          {!validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Выберите PDF файл</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PdfUploader onFileValidated={handleFileValidated} />
              </CardContent>
            </Card>
          )}

          {/* File info and next step */}
          {validationResult && validationResult.isValid && (
            <div className="space-y-6">
              <FileInfo validationResult={validationResult} />
              
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleNextStep}
                  className="flex items-center space-x-2"
                >
                  <span>Перейти к обработке</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Help section */}
        <Card className="bg-accent/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Поддерживаемые форматы</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-600">✓ Текстовые PDF</p>
                <p className="text-muted-foreground">PDF с выделяемым текстом</p>
              </div>
              <div>
                <p className="font-medium text-blue-600">✓ Сканированные PDF</p>
                <p className="text-muted-foreground">PDF из изображений</p>
              </div>
              <div>
                <p className="font-medium text-purple-600">✓ Смешанные PDF</p>
                <p className="text-muted-foreground">PDF с текстом и изображениями</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};