
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InputSection } from './components/InputSection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { LandingPageBuilder } from './components/LandingPageBuilder';
import { generateCampaign, generateLandingPage } from './services/geminiService';
import { GenerationState, HistoryItem, InputType, CampaignResult, LandingPageContent, TargetLanguage } from './types';
import { AlertTriangle, Clock, ChevronRight, Trash2, X, Calendar } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'CAMPAIGN' | 'LANDING'>('CAMPAIGN');
  
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    result: null,
    landingPage: null
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('adgen_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem('adgen_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (result: CampaignResult, landingPage: LandingPageContent, inputText: string, inputType: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      inputSummary: inputText.length > 40 ? inputText.substring(0, 40) + '...' : (inputText || 'Image/URL Analysis'),
      inputType: inputType as InputType,
      result: result,
      landingPage: landingPage
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setState({
      isLoading: false,
      error: null,
      result: item.result,
      landingPage: item.landingPage || null
    });
    setIsHistoryOpen(false);
    setCurrentView('CAMPAIGN'); // Switch back to campaign view when loading history
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async (text: string, images: string[] | null, url: string | null, language: TargetLanguage) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Determine input type for history
    let type = InputType.TEXT;
    let summary = text;
    if (url) {
      type = InputType.URL;
      summary = url;
    } else if (images && images.length > 0) {
      type = InputType.IMAGE;
      summary = `Image Analysis (${images.length} imgs): ` + (text || "Product");
    }

    try {
      // 1. Generate Ad Campaign
      const result = await generateCampaign(text, images, url, language);
      
      // 2. Automatically generate Landing Page based on Campaign result
      // We pass the language context implicitly via the CampaignResult
      const lpResult = await generateLandingPage(result);

      setState({
        isLoading: false,
        error: null,
        result: result,
        landingPage: lpResult
      });

      addToHistory(result, lpResult, summary, type);

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "An unexpected error occurred.",
      }));
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden"
      style={{
        background: 'linear-gradient(90deg, rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%)'
      }}
    >
      <Navbar 
        onToggleHistory={() => setIsHistoryOpen(true)} 
        currentView={currentView}
        onSwitchView={setCurrentView}
      />
      
      {/* History Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-white/10 ${
          isHistoryOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Recent Campaigns</h2>
            </div>
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No history yet.</p>
                <p className="text-xs mt-1">Generate a campaign to see it here.</p>
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => loadHistoryItem(item)}
                  className="bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 rounded-lg p-4 cursor-pointer transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.inputType === 'URL' ? 'bg-blue-900/50 text-blue-300' :
                      item.inputType === 'IMAGE' ? 'bg-purple-900/50 text-purple-300' :
                      'bg-emerald-900/50 text-emerald-300'
                    }`}>
                      {item.inputType}
                    </span>
                    <button 
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2" dir={item.result.language === 'العربية' || item.result.language === 'Darija (Morocco)' ? 'rtl' : 'ltr'}>
                    {item.result.adCopy.headline || "Untitled Campaign"}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-1">
                    {item.inputSummary}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    <span className="text-[10px] uppercase bg-slate-700 px-1.5 rounded text-slate-300">
                        {item.result.language === 'Darija (Morocco)' ? 'DARIJA' : item.result.language}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {history.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-slate-900">
              <button 
                onClick={clearHistory}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for history sidebar */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}
      
      {/* MAIN CONTENT AREA SWITCHER */}
      {currentView === 'LANDING' ? (
        <LandingPageBuilder generatedContent={state.landingPage} />
      ) : (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-md">
              Create High-Converting Ads in <span className="text-indigo-100 underline decoration-indigo-500 decoration-4 underline-offset-4">Seconds</span>
            </h1>
            <p className="text-lg text-slate-100 max-w-2xl mx-auto drop-shadow-md font-medium">
              Input a product description, upload an image, or paste a URL. 
              AdGen Master's AI will architect your entire campaign strategy, copy, and creative assets.
            </p>
          </div>

          <section className="mb-12">
            <InputSection onGenerate={handleGenerate} isLoading={state.isLoading} />
          </section>

          {state.error && (
            <div className="mb-8 p-4 bg-red-900/80 backdrop-blur-md border border-red-800 rounded-lg flex items-start gap-3 shadow-xl animate-fade-in">
              <AlertTriangle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-100 font-semibold">Generation Failed</h3>
                <p className="text-red-200 text-sm">{state.error}</p>
              </div>
            </div>
          )}

          {state.result && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">Campaign Blueprint</h2>
                <div className="flex gap-3">
                    {state.landingPage && (
                        <button 
                            onClick={() => setCurrentView('LANDING')}
                            className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 text-sm font-medium flex items-center gap-1 shadow-sm transition-colors"
                        >
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                            View Landing Page
                        </button>
                    )}
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 text-green-400 border border-green-500/50 text-sm font-medium flex items-center gap-1 backdrop-blur-sm shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        Generated Successfully
                    </span>
                </div>
              </div>
              {/* 
                Key prop forces re-render when switching history items, 
                ensuring internal state of ResultsDashboard (images/videos) resets correctly 
              */}
              <ResultsDashboard key={JSON.stringify(state.result)} data={state.result} />
            </section>
          )}
          
          {!state.result && !state.isLoading && !state.error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-all duration-500">
              {/* Skeleton previews to fill empty space */}
              <div className="h-40 bg-slate-900/40 rounded-xl border border-white/10 border-dashed flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white/70 font-medium">Strategy Module</p>
              </div>
              <div className="h-40 bg-slate-900/40 rounded-xl border border-white/10 border-dashed flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white/70 font-medium">Copywriting Module</p>
              </div>
              <div className="h-40 bg-slate-900/40 rounded-xl border border-white/10 border-dashed flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white/70 font-medium">Creative Vision Module</p>
              </div>
            </div>
          )}
        </main>
      )}

      {currentView === 'CAMPAIGN' && (
        <footer className="border-t border-white/10 bg-slate-900/60 backdrop-blur-md py-8 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-300 text-sm">
            <p>© 2024 AdGen Master. Powered by Google Gemini 2.5 Flash & Pro.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
