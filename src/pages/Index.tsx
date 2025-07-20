import { PDFProcessor } from '@/components/PDFProcessor';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4">
      <PDFProcessor />
      <Toaster />
    </div>
  );
};

export default Index;
