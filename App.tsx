
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InputSection } from './components/InputSection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { LandingPageBuilder } from './components/LandingPageBuilder';
import { generateCampaign, generateLandingPage, getApiKey } from './services/geminiService';
import { GenerationState, HistoryItem, InputType, CampaignResult, LandingPageContent, TargetLanguage } from './types';
import { AlertTriangle, Clock, ChevronRight, Trash2, X, Calendar, Key, Lock, Save, Mic } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Live Assistant Component
const LiveAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [status, setStatus] = useState("Connecting...");
    const [logs, setLogs] = useState<string[]>([]);
    
    useEffect(() => {
        let active = true;
        let sessionPromise: Promise<any> | null = null;
        
        const startLive = async () => {
            const apiKey = getApiKey();
            if (!apiKey) {
                setStatus("Error: API Key Missing");
                setLogs(p => [...p, "Error: Please set a valid API Key in Settings."]);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setStatus("Connected. Say something!");
                
                // Helper functions
                function decode(base64: string) {
                    const binaryString = atob(base64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    return bytes;
                }
                
                function encode(bytes: Uint8Array) {
                    let binary = '';
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary);
                }

                async function decodeAudioData(data: Uint8Array, ctx: AudioContext) {
                    const dataInt16 = new Int16Array(data.buffer);
                    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                    const channelData = buffer.getChannelData(0);
                    for (let i = 0; i < dataInt16.length; i++) {
                        channelData[i] = dataInt16[i] / 32768.0;
                    }
                    return buffer;
                }

                sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            if (!active) return;
                            setLogs(p => [...p, "Session Opened"]);
                            const source = inputAudioContext.createMediaStreamSource(stream);
                            const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                            processor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                // Convert float32 to int16
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const base64 = encode(new Uint8Array(int16.buffer));
                                sessionPromise?.then(session => {
                                    session.sendRealtimeInput({
                                        media: {
                                            mimeType: 'audio/pcm;rate=16000',
                                            data: base64
                                        }
                                    });
                                });
                            };
                            source.connect(processor);
                            processor.connect(inputAudioContext.destination);
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                             if (!active) return;
                             if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
                                 const audioData = msg.serverContent.modelTurn.parts[0].inlineData.data;
                                 const buffer = await decodeAudioData(decode(audioData), outputAudioContext);
                                 
                                 nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                                 const source = outputAudioContext.createBufferSource();
                                 source.buffer = buffer;
                                 source.connect(outputAudioContext.destination);
                                 source.start(nextStartTime);
                                 nextStartTime += buffer.duration;
                                 sources.add(source);
                                 source.onended = () => sources.delete(source);
                             }
                             if (msg.serverContent?.interrupted) {
                                 sources.forEach(s => s.stop());
                                 sources.clear();
                                 nextStartTime = 0;
                                 setLogs(p => [...p, "Model Interrupted"]);
                             }
                        },
                        onclose: () => {
                            setStatus("Disconnected");
                            setLogs(p => [...p, "Session Closed"]);
                        },
                        onerror: (e: any) => {
                            console.error("Live API Error:", e);
                            let errorMsg = "Unknown Error";
                            if (e instanceof ErrorEvent) {
                                errorMsg = e.message || "Connection Failed (Check API Key/Network)";
                            } else if (e instanceof Error) {
                                errorMsg = e.message;
                            } else if (typeof e === 'object') {
                                errorMsg = JSON.stringify(e);
                            }
                            setLogs(p => [...p, "Error: " + errorMsg]);
                            setStatus("Connection Error");
                        }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        systemInstruction: "You are a helpful advertising creative assistant. Help brainstorm campaign ideas."
                    }
                });
                
            } catch (e: any) {
                setStatus("Error: " + e.message);
                setLogs(p => [...p, "Init Error: " + e.message]);
            }
        };
        
        startLive();
        
        return () => {
            active = false;
            // Cleanup logic would go here ideally (closing context, session)
        };
    }, []);
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-indigo-500 p-8 rounded-2xl max-w-md w-full text-center">
                <div className="mb-6 animate-pulse">
                    <div className="h-20 w-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                        <Mic className="h-10 w-10 text-white"/>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Live Brainstorm</h2>
                <p className="text-indigo-300 mb-6 font-mono text-sm">{status}</p>
                <div className="text-xs text-slate-500 text-left h-32 overflow-y-auto mb-6 bg-black/40 p-3 rounded border border-slate-800 font-mono">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
                <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-full transition-colors">End Session</button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'CAMPAIGN' | 'LANDING'>('CAMPAIGN');
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');

  // Load API Key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('adgen_api_key');
    if (storedKey) {
      setUserApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('adgen_api_key', userApiKey);
    setIsSettingsOpen(false);
  };

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
    setCurrentView('CAMPAIGN');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async (text: string, images: string[] | null, url: string | null, video: string | null, language: TargetLanguage) => {
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
    } else if (video) {
      type = InputType.VIDEO;
      summary = "Video Analysis";
    }

    try {
      // 1. Generate Ad Campaign
      const result = await generateCampaign(text, images, url, video, language);
      
      // 2. Automatically generate Landing Page based on Campaign result
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
        onToggleSettings={() => setIsSettingsOpen(true)}
        currentView={currentView}
        onSwitchView={setCurrentView}
      />

      {/* Live Assistant Button in Navbar area or floating */}
      <button 
        onClick={() => setIsLiveOpen(true)}
        className="fixed top-20 right-6 z-40 bg-indigo-600/90 hover:bg-indigo-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-md"
      >
        <Mic className="h-4 w-4 animate-pulse"/> Live Assistant
      </button>

      {isLiveOpen && <LiveAssistant onClose={() => setIsLiveOpen(false)} />}
      
      {/* Settings / API Key Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-white font-bold text-xl">
                        <Key className="h-5 w-5 text-indigo-400" />
                        <h2>API Settings</h2>
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-4 mb-6">
                    <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
                        <p className="text-sm text-indigo-200">
                            Enter your <strong>Google Gemini API Key</strong> for full functionality (Live API, Veo, Imagen 3).
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">API Key</label>
                        <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>
                <button onClick={handleSaveApiKey} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" /> Save Settings
                </button>
            </div>
        </div>
      )}

      {/* History Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-white/10 ${
          isHistoryOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-indigo-400" /><h2 className="text-lg font-bold text-white">History</h2></div>
            <button onClick={() => setIsHistoryOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.map((item) => (
                <div key={item.id} onClick={() => loadHistoryItem(item)} className="bg-slate-800/50 p-4 rounded-lg cursor-pointer hover:bg-slate-800 relative group">
                  <div className="flex justify-between mb-1">
                      <span className="text-[10px] bg-slate-700 px-2 rounded text-slate-300">{item.inputType}</span>
                      <Trash2 onClick={(e) => deleteHistoryItem(e, item.id)} className="h-3 w-3 text-slate-500 hover:text-red-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{item.result.adCopy.headline}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{item.inputSummary}</p>
                </div>
            ))}
          </div>
          {history.length > 0 && <div className="p-4"><button onClick={clearHistory} className="w-full text-red-400 text-sm">Clear History</button></div>}
        </div>
      </div>

      {isHistoryOpen && <div className="fixed inset-0 bg-black/50 z-[90]" onClick={() => setIsHistoryOpen(false)} />}
      
      {currentView === 'LANDING' ? (
        <LandingPageBuilder generatedContent={state.landingPage} />
      ) : (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-md">AdGen Master AI</h1>
            <p className="text-lg text-slate-100 max-w-2xl mx-auto drop-shadow-md font-medium">
              Generate Campaigns, Landing Pages, Images, and Videos with Gemini 2.5 & 3 Pro.
            </p>
          </div>

          <section className="mb-12">
            <InputSection onGenerate={handleGenerate} isLoading={state.isLoading} />
          </section>

          {state.error && (
            <div className="mb-8 p-4 bg-red-900/80 border border-red-800 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-300" />
              <p className="text-red-100">{state.error}</p>
            </div>
          )}

          {state.result && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Campaign Results</h2>
                {state.landingPage && (
                    <button onClick={() => setCurrentView('LANDING')} className="px-3 py-1 bg-indigo-600 rounded-full text-white text-sm font-medium">View Landing Page</button>
                )}
              </div>
              <ResultsDashboard key={JSON.stringify(state.result)} data={state.result} />
            </section>
          )}
        </main>
      )}

      {currentView === 'CAMPAIGN' && (
        <footer className="border-t border-white/10 bg-slate-900/60 backdrop-blur-md py-8 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-300 text-sm">
            <p>© 2024 AdGen Master. Powered by Google Gemini.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
