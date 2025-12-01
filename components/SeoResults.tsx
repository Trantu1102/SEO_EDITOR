import React, { useState } from 'react';
import { SeoResult } from '../types';

interface SeoResultsProps {
  seo: SeoResult | null;
}

export const SeoResults: React.FC<SeoResultsProps> = ({ seo }) => {
  const [copied, setCopied] = useState(false);

  if (!seo) return null;

  const handleCopyKeywords = () => {
    navigator.clipboard.writeText(seo.keywords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Card */}
      <div className="bg-white rounded-lg p-5 border-l-4 border-blue-500 shadow-sm">
        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">SEO Title</h3>
        <p className="text-lg font-medium text-slate-800">{seo.title || "No title generated"}</p>
        <div className={`mt-2 text-xs text-right font-medium ${seo.title.length > 75 ? 'text-red-500' : 'text-slate-400'}`}>
          {seo.title.length} / 75 characters
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white rounded-lg p-5 border-l-4 border-green-500 shadow-sm">
        <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">SEO Description</h3>
        <p className="text-slate-700 leading-relaxed">{seo.description || "No description generated"}</p>
        <div className={`mt-2 text-xs text-right font-medium ${seo.description.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
          {seo.description.length} / 160 characters
        </div>
      </div>

      {/* Keywords Card */}
      <div className="bg-white rounded-lg p-5 border-l-4 border-purple-500 shadow-sm relative">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider">SEO Keywords</h3>
          <button 
            onClick={handleCopyKeywords}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors"
            title="Copy all keywords"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copy All
              </>
            )}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {seo.keywords.split(',').map((keyword, index) => (
            <span 
              key={index} 
              className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100"
            >
              {keyword.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};