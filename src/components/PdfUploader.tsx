import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePdfValidator } from '@/hooks/usePdfValidator';
import type { ValidationConfig } from '@/types/pdf';

interface PdfUploaderProps {
  onFileValidated?: (result: any) => void;
  config?: Partial<ValidationConfig>;
  disabled?: boolean;
}

export const PdfUploader = ({ onFileValidated, config, disabled }: PdfUploaderProps) => {
  const { 
    validationResult, 
    progress, 
    isValidating, 
    error, 
    validateFile, 
    resetValidation 
  } = usePdfValidator({
    config,
    onValidationComplete: onFileValidated
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      validateFile(acceptedFiles[0]);
    }
  }, [validateFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: disabled || isValidating
  });

  const getDropzoneClasses = () => {
    let classes = "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ";
    
    if (isDragActive && !isDragReject) {
      classes += "border-primary bg-primary/5";
    } else if (isDragReject) {
      classes += "border-destructive bg-destructive/5";
    } else {
      classes += "border-border hover:border-primary hover:bg-accent/50";
    }

    if (disabled || isValidating) {
      classes += " opacity-50 cursor-not-allowed";
    }

    return classes;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div {...getRootProps()} className={getDropzoneClasses()}>
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {isValidating ? (
              <div className="w-full space-y-4">
                <FileText className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">{progress?.currentTask}</p>
                  <Progress value={progress?.progress || 0} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {progress?.stage === 'completed' ? 'Готово!' : 
                     progress?.timeElapsed ? `${Math.round(progress.timeElapsed / 1000)}с` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive 
                      ? (isDragReject ? 'Неподдерживаемый тип файла' : 'Отпустите файл здесь')
                      : 'Перетащите PDF файл сюда'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    или нажмите для выбора файла
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Максимальный размер: {config?.maxFileSize ? Math.round(config.maxFileSize / 1024 / 1024) : 50}MB, 
                    до {config?.maxPages || 250} страниц
                  </p>
                </div>
                
                <Button variant="outline" disabled={disabled || isValidating}>
                  Выбрать файл
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {validationResult && validationResult.isValid && (
          <div className="mt-4 p-4 bg-accent rounded-lg">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{validationResult.fileInfo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {validationResult.fileInfo.pageCount} страниц • {
                    Math.round(validationResult.fileInfo.size / 1024)
                  }KB • {validationResult.pdfType}
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetValidation}
              className="mt-2"
            >
              Загрузить другой файл
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};