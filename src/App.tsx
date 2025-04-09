import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface VerificationResult {
  prediction: string;
  confidence: number;
}

interface FileWithPreview extends File {
  preview?: string;
}

function App() {
  const [referenceFile, setReferenceFile] = useState<FileWithPreview | null>(null);
  const [testFile, setTestFile] = useState<FileWithPreview | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState<'reference' | 'test' | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'reference' | 'test') => {
    e.preventDefault();
    setDragOver(type);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'reference' | 'test') => {
    e.preventDefault();
    setDragOver(null);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.preview = URL.createObjectURL(file);
      
      if (type === 'reference') {
        if (referenceFile?.preview) URL.revokeObjectURL(referenceFile.preview);
        setReferenceFile(fileWithPreview);
      } else {
        if (testFile?.preview) URL.revokeObjectURL(testFile.preview);
        setTestFile(fileWithPreview);
      }
    }
  }, [referenceFile, testFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'reference' | 'test') => {
    const file = e.target.files?.[0];
    if (file) {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.preview = URL.createObjectURL(file);
      
      if (type === 'reference') {
        if (referenceFile?.preview) URL.revokeObjectURL(referenceFile.preview);
        setReferenceFile(fileWithPreview);
      } else {
        if (testFile?.preview) URL.revokeObjectURL(testFile.preview);
        setTestFile(fileWithPreview);
      }
    }
  }, [referenceFile, testFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceFile || !testFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('reference', referenceFile);
    formData.append('file', testFile);

    try {
      const response = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup URLs when component unmounts
  React.useEffect(() => {
    return () => {
      if (referenceFile?.preview) URL.revokeObjectURL(referenceFile.preview);
      if (testFile?.preview) URL.revokeObjectURL(testFile.preview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            نظام التحقق من التوقيع
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div 
                className={`border-2 ${dragOver === 'reference' ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-6 text-center transition-colors duration-200`}
                onDragOver={(e) => handleDragOver(e, 'reference')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'reference')}
              >
                <div className="flex justify-center mb-4">
                  {referenceFile?.preview ? (
                    <img 
                      src={referenceFile.preview} 
                      alt="Reference signature preview" 
                      className="max-h-48 object-contain"
                    />
                  ) : (
                    <Upload className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">التوقيع المرجعي</p>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'reference')}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">اسحب وأفلت الصورة هنا أو اختر ملفًا</p>
              </div>

              <div 
                className={`border-2 ${dragOver === 'test' ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-6 text-center transition-colors duration-200`}
                onDragOver={(e) => handleDragOver(e, 'test')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'test')}
              >
                <div className="flex justify-center mb-4">
                  {testFile?.preview ? (
                    <img 
                      src={testFile.preview} 
                      alt="Test signature preview" 
                      className="max-h-48 object-contain"
                    />
                  ) : (
                    <Upload className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">التوقيع المفحوص</p>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'test')}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">اسحب وأفلت الصورة هنا أو اختر ملفًا</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !referenceFile || !testFile}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الفحص...' : 'فحص'}
            </button>
          </form>

          {result && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">النتيجة:</h3>
              <div className="space-y-2">
                <p className="text-lg">
                  التوقيع: <span className="font-bold">{result.prediction}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;