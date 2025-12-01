import React, { useState, useEffect, useRef } from 'react';
import { InputSection } from './components/InputSection';
import { SeoResults } from './components/SeoResults';
import { ProofreadResults } from './components/ProofreadResults';
import { SettingsModal } from './components/SettingsModal';
import { ArticleData, AnalysisState, AnalysisStatus, UserSettings } from './types';
import { DEMO_DATA, DEFAULT_SETTINGS } from './constants';
import { generateSeo, generateProofread } from './services/geminiService';
import { scrapeArticle } from './services/scraperService';

const App: React.FC = () => {
  // Application State
  const [article, setArticle] = useState<ArticleData>({
    title: '',
    excerpt: '',
    content: ''
  });

  const [analysis, setAnalysis] = useState<AnalysisState>({
    status: AnalysisStatus.IDLE,
    seo: null,
    proofread: null,
    error: null,
    elapsedTime: 0
  });

  const [activeTab, setActiveTab] = useState<'seo' | 'proofread'>('seo');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  
  // Timer Refs & State for visual display
  const startTimeRef = useRef<number>(0);
  const [displayTimer, setDisplayTimer] = useState(0);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('editorAi_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // Timer Effect for Visual Display only
  useEffect(() => {
    let interval: any;
    if (analysis.status === AnalysisStatus.PROCESSING) {
      setDisplayTimer(0);
      interval = setInterval(() => {
        // Update visual timer every second
        if (startTimeRef.current > 0) {
            setDisplayTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else if (analysis.status === AnalysisStatus.IDLE) {
      setDisplayTimer(0);
    }
    return () => clearInterval(interval);
  }, [analysis.status]);

  const handleInputChange = (field: keyof ArticleData, value: string) => {
    setArticle(prev => ({ ...prev, [field]: value }));
  };

  const loadDemoData = () => {
    setArticle(DEMO_DATA);
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('editorAi_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

  const handleAnalyze = async (dataToAnalyze: ArticleData = article) => {
    // Start timing
    startTimeRef.current = Date.now();

    setAnalysis({
      status: AnalysisStatus.PROCESSING,
      seo: null,
      proofread: null,
      error: null,
      elapsedTime: 0
    });

    try {
      // Execute tasks SEQUENTIALLY to minimize Rate Limit risks (429)
      
      // 1. Generate SEO
      const seoResult = await generateSeo(dataToAnalyze, settings);
      
      // Update partial state (Optional: could show SEO while waiting for proofread)
      setAnalysis(prev => ({ ...prev, seo: seoResult }));

      // 2. Generate Proofreading (takes longer)
      const proofreadResult = await generateProofread(dataToAnalyze, settings);

      // Calculate precise elapsed time
      const endTime = Date.now();
      const durationInSeconds = parseFloat(((endTime - startTimeRef.current) / 1000).toFixed(1));

      setAnalysis(prev => ({
        status: AnalysisStatus.COMPLETED,
        seo: seoResult,
        proofread: proofreadResult,
        error: null,
        elapsedTime: durationInSeconds
      }));
      
      // Auto-switch to proofread tab if it has content
      if (proofreadResult.correctedHtml) {
         setActiveTab('proofread');
      }
    } catch (err: any) {
      setAnalysis(prev => ({
        ...prev,
        status: AnalysisStatus.ERROR,
        error: err.message || "An unexpected error occurred."
      }));
    }
  };

  const handleUrlAnalyze = async (url: string) => {
    // Reset state but keep status IDLE initially until fetch starts
    setAnalysis({
      status: AnalysisStatus.PROCESSING,
      seo: null,
      proofread: null,
      error: null,
      elapsedTime: 0
    });
    
    // Reset Start time for the fetch phase
    startTimeRef.current = Date.now();

    try {
      // Step 1: Fetch and Scrape
      const scrapedData = await scrapeArticle(url);
      setArticle(scrapedData);

      // Step 2: Automatically proceed to Analyze with the FRESH data
      await handleAnalyze(scrapedData);

    } catch (err: any) {
       setAnalysis(prev => ({
        ...prev,
        status: AnalysisStatus.ERROR,
        error: err.message || "Failed to fetch URL content."
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                E
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                  EditorAI
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">SEO & PROOFREADING</p>
              </div>
            </div>
            
            {/* Settings Button */}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)] min-h-[600px]">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 h-full">
            <InputSection 
              data={article} 
              onChange={handleInputChange} 
              onAnalyze={() => handleAnalyze(article)}
              onAnalyzeUrl={handleUrlAnalyze}
              isProcessing={analysis.status === AnalysisStatus.PROCESSING}
              onLoadDemo={loadDemoData}
            />
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200 p-1">
            {/* Tabs */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm mb-4 mx-4 mt-4">
              <button
                onClick={() => setActiveTab('seo')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all
                  ${activeTab === 'seo' 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                SEO Metadata
              </button>
              <button
                onClick={() => setActiveTab('proofread')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all
                  ${activeTab === 'proofread' 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                Proofreading
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto px-4 pb-4">
              {analysis.status === AnalysisStatus.IDLE && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-lg font-medium">Ready to analyze</p>
                  <p className="text-sm">Paste a link above or enter content manually.</p>
                </div>
              )}

              {analysis.status === AnalysisStatus.PROCESSING && (
                 <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="text-3xl font-mono font-bold text-blue-600 tabular-nums">
                      {displayTimer}s
                    </div>
                    <div className="text-slate-600 font-medium animate-pulse">Processing Content...</div>
                    <div className="text-xs text-slate-400 max-w-xs text-center">
                      Fetching content, checking grammar rules, and optimizing SEO keywords. <br/>
                      (Large articles may take 30-60s)
                    </div>
                 </div>
              )}

              {analysis.status === AnalysisStatus.ERROR && (
                <div className="h-full flex flex-col items-center justify-center text-red-500 px-8 text-center">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-bold">Operation Failed</p>
                  <p className="text-sm">{analysis.error}</p>
                </div>
              )}

              {analysis.status === AnalysisStatus.COMPLETED && (
                <>
                  <div className={activeTab === 'seo' ? 'block' : 'hidden'}>
                    <SeoResults seo={analysis.seo} />
                  </div>
                  <div className={`h-full ${activeTab === 'proofread' ? 'block' : 'hidden'}`}>
                    <ProofreadResults 
                      result={analysis.proofread} 
                      elapsedTime={analysis.elapsedTime}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          currentSettings={settings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
};

export default App;