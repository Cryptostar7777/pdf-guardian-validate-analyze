import { useState, useCallback } from 'react';
import { PdfAnalyzer } from '@/utils/pdfAnalyzer';
import type { 
  PdfValidationResult, 
  PdfAnalysisProgress, 
  ValidationConfig 
} from '@/types/pdf';

interface UsePdfValidatorOptions {
  config?: Partial<ValidationConfig>;
  onValidationStart?: () => void;
  onValidationComplete?: (result: PdfValidationResult) => void;
  onValidationError?: (error: string) => void;
}

export const usePdfValidator = (options: UsePdfValidatorOptions = {}) => {
  const [validationResult, setValidationResult] = useState<PdfValidationResult | null>(null);
  const [progress, setProgress] = useState<PdfAnalysisProgress | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetValidation = useCallback(() => {
    setValidationResult(null);
    setProgress(null);
    setIsValidating(false);
    setError(null);
  }, []);

  const validateFile = useCallback(async (file: File) => {
    if (isValidating) return;

    setIsValidating(true);
    setError(null);
    setValidationResult(null);
    options.onValidationStart?.();

    const startTime = Date.now();

    try {
      // Update progress - uploading stage
      setProgress({
        stage: 'uploading',
        progress: 0,
        currentTask: 'Загрузка файла...',
        timeElapsed: 0
      });

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        setProgress(prev => prev ? { 
          ...prev, 
          progress: i,
          timeElapsed: Date.now() - startTime
        } : null);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Update progress - validating stage
      setProgress({
        stage: 'validating',
        progress: 0,
        currentTask: 'Проверка формата файла...',
        timeElapsed: Date.now() - startTime
      });

      // Perform validation
      const result = await PdfAnalyzer.validatePdfFile(file, options.config);

      if (!result.isValid) {
        setError(result.errors[0] || 'Ошибка валидации');
        setProgress({
          stage: 'error',
          progress: 0,
          currentTask: 'Ошибка валидации',
          timeElapsed: Date.now() - startTime
        });
        options.onValidationError?.(result.errors[0] || 'Ошибка валидации');
        return;
      }

      // Update progress - analyzing stage
      setProgress({
        stage: 'analyzing',
        progress: 50,
        currentTask: 'Анализ содержимого PDF...',
        timeElapsed: Date.now() - startTime
      });

      // Simulate analysis progress
      for (let i = 50; i <= 90; i += 10) {
        setProgress(prev => prev ? { 
          ...prev, 
          progress: i,
          timeElapsed: Date.now() - startTime
        } : null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Complete validation
      setProgress({
        stage: 'completed',
        progress: 100,
        currentTask: 'Анализ завершен',
        timeElapsed: Date.now() - startTime
      });

      setValidationResult(result);
      options.onValidationComplete?.(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      setProgress({
        stage: 'error',
        progress: 0,
        currentTask: 'Ошибка обработки',
        timeElapsed: Date.now() - startTime
      });
      options.onValidationError?.(errorMessage);
    } finally {
      setIsValidating(false);
    }
  }, [isValidating, options]);

  return {
    validationResult,
    progress,
    isValidating,
    error,
    validateFile,
    resetValidation
  };
};