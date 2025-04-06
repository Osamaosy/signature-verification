import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface VerificationResult {
  prediction: string;
  confidence: number;
}

function App() {
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            نظام التحقق من التوقيع
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">التوقيع المرجعي</p>
                <input
                  type="file"
                  onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">التوقيع المفحوص</p>
                <input
                  type="file"
                  onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                <p className="text-lg">
                  مستوى الثقة: <span className="font-bold">{result.confidence}%</span>
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