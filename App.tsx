import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { InputSection } from './components/InputSection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { generateCampaign } from './services/geminiService';
import { GenerationState } from './types';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const handleGenerate = async (text: string, image: string | null, url: string | null) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await generateCampaign(text, image, url);
      setState({
        isLoading: false,
        error: null,
        result: result,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "An unexpected error occurred.",
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Create High-Converting Ads in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Seconds</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Input a product description, upload an image, or paste a URL. 
            AdGen Master's AI will architect your entire campaign strategy, copy, and creative assets.
          </p>
        </div>

        <section className="mb-12">
          <InputSection onGenerate={handleGenerate} isLoading={state.isLoading} />
        </section>

        {state.error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold">Generation Failed</h3>
              <p className="text-red-300 text-sm">{state.error}</p>
            </div>
          </div>
        )}

        {state.result && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Campaign Blueprint</h2>
              <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-800 text-sm font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Generated Successfully
              </span>
            </div>
            <ResultsDashboard data={state.result} />
          </section>
        )}
        
        {!state.result && !state.isLoading && !state.error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Skeleton previews to fill empty space */}
             <div className="h-40 bg-slate-900/50 rounded-xl border border-slate-800/50 border-dashed flex items-center justify-center">
                <p className="text-slate-600 font-medium">Strategy Module</p>
             </div>
             <div className="h-40 bg-slate-900/50 rounded-xl border border-slate-800/50 border-dashed flex items-center justify-center">
                <p className="text-slate-600 font-medium">Copywriting Module</p>
             </div>
             <div className="h-40 bg-slate-900/50 rounded-xl border border-slate-800/50 border-dashed flex items-center justify-center">
                <p className="text-slate-600 font-medium">Creative Vision Module</p>
             </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 AdGen Master. Powered by Google Gemini 2.5 Flash & Pro.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;