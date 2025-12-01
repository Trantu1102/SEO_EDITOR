import React from 'react';
import { ProofreadResult } from '../types';

interface ProofreadResultsProps {
  result: ProofreadResult | null;
  elapsedTime?: number;
}

export const ProofreadResults: React.FC<ProofreadResultsProps> = ({ result, elapsedTime }) => {
  if (!result) return null;

  const handleExportDocx = () => {
    // Basic HTML template for the docx
    const header = `<!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 14pt; }
      span[style*="color:red"] { color: red !important; font-weight: bold; }
    </style>
    </head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + result.correctedHtml + footer;

    if ((window as any).htmlDocx) {
        const converted = (window as any).htmlDocx.asBlob(sourceHTML);
        (window as any).saveAs(converted, 'Proofread_Result.docx');
    } else {
        alert("Export library not loaded.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
       <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
           <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Proofreading Analysis
          {elapsedTime && elapsedTime > 0 && (
            <span className="text-xs font-normal text-slate-400 bg-white border border-slate-200 rounded-md px-2 py-0.5 ml-2">
              {elapsedTime}s
            </span>
          )}
        </h3>
        
        <div className="flex items-center gap-4">
             <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span className="text-slate-500">[Error]</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-slate-500">Correction</span>
              </div>
            </div>

            <button 
                onClick={handleExportDocx}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                title="Download as Word Document"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export .docx
            </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-grow bg-white">
        <div 
          className="prose prose-slate max-w-none text-slate-800 leading-8"
          dangerouslySetInnerHTML={{ __html: result.correctedHtml }}
        />
        
        {/* Fallback if HTML is empty but processing marked done */}
        {!result.correctedHtml && (
          <div className="text-center text-slate-400 py-10">
            No corrections found or content is perfect.
          </div>
        )}
      </div>
    </div>
  );
};