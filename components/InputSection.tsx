import React, { useState, useRef } from 'react';
import { ArticleData } from '../types';

interface InputSectionProps {
  data: ArticleData;
  onChange: (field: keyof ArticleData, value: string) => void;
  onAnalyze: () => void;
  onAnalyzeUrl: (url: string) => void;
  isProcessing: boolean;
  onLoadDemo: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  data, 
  onChange, 
  onAnalyze, 
  onAnalyzeUrl,
  isProcessing,
  onLoadDemo 
}) => {
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = () => {
    if (url.trim()) {
      onAnalyzeUrl(url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      handleUrlSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = event.target?.result;
      if (arrayBuffer && (window as any).mammoth) {
        (window as any).mammoth.extractRawText({ arrayBuffer: arrayBuffer })
          .then(function(result: any) {
            onChange('content', result.value);
            // Optionally clear title if needed, or leave as is
          })
          .catch(function(err: any) {
            console.error(err);
            alert("Error reading .docx file");
          });
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset value to allow re-uploading same file
    e.target.value = '';
  };

  // Calculate word count
  const wordCount = data.content 
    ? data.content.trim().split(/\s+/).filter(word => word.length > 0).length 
    : 0;

  // Validation: Button enabled if content exists (even if title is missing, as per request)
  const canGenerate = !isProcessing && (data.content.trim().length > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Content Input
        </h2>
        <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".docx" 
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors px-2 py-1 bg-blue-50 rounded-md hover:bg-blue-100"
              disabled={isProcessing}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import .docx
            </button>
            <button 
              onClick={onLoadDemo}
              className="text-sm text-slate-500 hover:text-slate-700 underline decoration-dotted transition-colors"
              disabled={isProcessing}
            >
              Load Demo
            </button>
        </div>
      </div>

      {/* URL Input Section */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
        <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
          Auto-Import from Link
        </label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none text-slate-700 placeholder-slate-400"
              placeholder="Paste article URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
            />
          </div>
          <button
            onClick={handleUrlSubmit}
            disabled={isProcessing || !url.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all whitespace-nowrap
              ${isProcessing || !url.trim()
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isProcessing && url.trim() ? 'Fetching...' : 'Fetch & Analyze'}
          </button>
        </div>
      </div>

      <div className="space-y-4 flex-grow overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Article Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            placeholder="Enter article title..."
            value={data.title}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt (Sapo)</label>
          <textarea
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none h-24"
            placeholder="Enter short description..."
            value={data.excerpt}
            onChange={(e) => onChange('excerpt', e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-700">Main Content</label>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {wordCount.toLocaleString()} words
            </span>
          </div>
          <textarea
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-y min-h-[200px]"
            placeholder="Paste the full article content here..."
            value={data.content}
            onChange={(e) => onChange('content', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={onAnalyze}
          disabled={!canGenerate}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5
            ${!canGenerate
              ? 'bg-slate-400 cursor-not-allowed transform-none shadow-none' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30'
            }`}
        >
          {isProcessing && !url.trim() ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Generate SEO & Check Spelling'
          )}
        </button>
      </div>
    </div>
  );
};