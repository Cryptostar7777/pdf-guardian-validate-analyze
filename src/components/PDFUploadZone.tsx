import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PDFValidator } from '@/utils/pdfValidator';
import type { PdfValidationResult, PdfAnalysisProgress } from '@/types/pdf';

interface PDFUploadZoneProps {
  onFileValidated: (result: PdfValidationResult) => void;
  onUploadProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
  className?: string;
}

export const PDFUploadZone: React.FC<PDFUploadZoneProps> = ({
  onFileValidated,
  onUploadProgress,
  className
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const simulateUploadProgress = useCallback((file: File) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random increment between 5-20%
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      setValidationProgress(progress);
      onUploadProgress?.({
        loaded: (progress / 100) * file.size,
        total: file.size,
        percentage: progress
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onUploadProgress]);

  const handleFileValidation = useCallback(async (file: File) => {
    setCurrentFile(file);
    setIsValidating(true);
    setValidationProgress(0);

    // Simulate upload progress
    const clearProgress = simulateUploadProgress(file);

    try {
      // Add some delay to show progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await PDFValidator.validateFile(file);
      
      // Ensure progress reaches 100%
      setValidationProgress(100);
      
      // Wait a bit before calling the callback
      setTimeout(() => {
        onFileValidated(result);
        clearProgress();
        setIsValidating(false);
        setCurrentFile(null);
        setValidationProgress(0);
      }, 500);
      
    } catch (error) {
      clearProgress();
      setIsValidating(false);
      setCurrentFile(null);
      setValidationProgress(0);
      
      onFileValidated({
        isValid: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        },
        pdfType: 'unknown',
        estimatedProcessingTime: 0,
        complexity: 'low',
        errors: ['Произошла ошибка при валидации файла'],
        warnings: []
      });
    }
  }, [onFileValidated, simulateUploadProgress]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileValidation(acceptedFiles[0]);
    }
  }, [handleFileValidation]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isValidating
  });

  const getStatusIcon = () => {
    if (isValidating) {
      return <Upload className="w-8 h-8 text-primary animate-pulse" />;
    }
    if (isDragReject) {
      return <AlertCircle className="w-8 h-8 text-destructive" />;
    }
    if (isDragActive) {
      return <CheckCircle2 className="w-8 h-8 text-success" />;
    }
    return <FileText className="w-8 h-8 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isValidating) {
      return `Валидация файла: ${currentFile?.name}`;
    }
    if (isDragReject) {
      return 'Поддерживаются только PDF файлы';
    }
    if (isDragActive) {
      return 'Отпустите файл для загрузки';
    }
    return 'Перетащите PDF файл сюда или нажмите для выбора';
  };

  const getStatusSubText = () => {
    if (isValidating) {
      return `${validationProgress.toFixed(0)}% завершено`;
    }
    if (isDragReject) {
      return 'Пожалуйста, выберите корректный PDF файл';
    }
    return 'Максимальный размер: 50MB, до 250 страниц';
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "upload-zone rounded-lg p-8 text-center cursor-pointer min-h-[200px] flex flex-col items-center justify-center",
          isDragActive && !isDragReject && "upload-zone-hover",
          isDragReject && "border-destructive bg-destructive/5",
          isValidating && "cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="mb-4">
          {getStatusIcon()}
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {getStatusText()}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          {getStatusSubText()}
        </p>

        {isValidating && (
          <div className="w-full max-w-xs mb-4">
            <Progress value={validationProgress} className="h-2" />
          </div>
        )}
        
        {!isDragActive && !isValidating && (
          <Button 
            variant="outline" 
            onClick={open}
            className="mt-2"
          >
            Выбрать файл
          </Button>
        )}
      </div>
    </div>
  );
};