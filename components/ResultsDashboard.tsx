
import React, { useState, useEffect, useRef } from 'react';
import { CampaignResult, AdCopy, SocialPrompts, AdVariant } from '../types';
import { Target, MessageSquare, Image as ImageIcon, Video, Hash, Copy, Check, Layout, Loader2, Sparkles, Download, Share2, Play, Film, RefreshCw, Hexagon, Smartphone, Monitor, Trash2, Globe, Facebook, AlertTriangle, X, ChevronDown, FileJson, Instagram, Youtube, Music2, Grid, Layers, Zap, Edit2, Volume2, Mic, Send } from 'lucide-react';
import { generateAdImage, generateAdVideo, generateBrandLogo, regenerateAdCopy, generateSocialPrompts, generateImageVariations, generateAdVariations, generateSpeech, editAdImage, chatWithCampaign } from '../services/geminiService';
import JSZip from 'jszip';

interface ResultsDashboardProps {
  data: CampaignResult;
}

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, icon, children, className = "", action }) => (
  <div className={`bg-slate-800 rounded-xl border border-slate-700 p-4 md:p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="flex flex-wrap items-center justify-between mb-4 border-b border-slate-700 pb-3 gap-2">
      <div className="flex items-center gap-2">
        <div className="text-indigo-400">
          {icon}
        </div>
        <h3 className="text-base md:text-lg font-semibold text-white">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="flex-1">
      {children}
    </div>
  </div>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ data }) => {
  const [currentAdCopy, setCurrentAdCopy] = useState<AdCopy>(data.adCopy);
  const [adImage, setAdImage] = useState<string | null>(null);
  const [adVideo, setAdVideo] = useState<string | null>(null);
  const [adLogo, setAdLogo] = useState<string | null>(null);
  const [socialPrompts, setSocialPrompts] = useState<SocialPrompts | null>(null);
  const [imageVariations, setImageVariations] = useState<string[]>([]);
  const [adVariations, setAdVariations] = useState<AdVariant[] | null>(null);
  const [ttsAudio, setTtsAudio] = useState<string | null>(null);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isRegeneratingCopy, setIsRegeneratingCopy] = useState(false);
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isGeneratingAdVariations, setIsGeneratingAdVariations] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishStep, setPublishStep] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO' | 'LOGO'>('IMAGE');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  
  const [logoStylePreference, setLogoStylePreference] = useState('');
  const [videoCta, setVideoCta] = useState(data.adCopy.cta);
  const [editPrompt, setEditPrompt] = useState('');
  const [showEditInput, setShowEditInput] = useState(false);
  
  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentAdCopy(data.adCopy);
    setVideoCta(data.adCopy.cta);
    setSocialPrompts(null);
    setImageVariations([]);
    setAdVariations(null);
    setChatHistory([]); // Reset chat on new campaign
  }, [data]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const checkAndSelectKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await win.aistudio.openSelectKey();
        return true;
      }
    }
    return true;
  };

  const handleRegenerateCopy = async () => {
    setGenerationError(null);
    setIsRegeneratingCopy(true);
    try {
      const newCopy = await regenerateAdCopy(data.strategy, data.creative);
      setCurrentAdCopy(newCopy);
      setVideoCta(newCopy.cta);
    } catch (e: any) {
      console.error(e);
      setGenerationError("Failed to regenerate ad copy.");
    } finally {
      setIsRegeneratingCopy(false);
    }
  };

  const handleGenerateSocial = async () => {
    setGenerationError(null);
    setIsGeneratingSocial(true);
    try {
        const prompts = await generateSocialPrompts(data.strategy, data.creative);
        setSocialPrompts(prompts);
    } catch (e: any) {
        console.error(e);
        setGenerationError("Failed to generate social variants.");
    } finally {
        setIsGeneratingSocial(false);
    }
  };

  const handleGenerateAdVariations = async () => {
    setGenerationError(null);
    setIsGeneratingAdVariations(true);
    try {
        const variants = await generateAdVariations(data.strategy, currentAdCopy);
        setAdVariations(variants);
    } catch (e: any) {
        console.error(e);
        setGenerationError("Failed to generate ad variations.");
    } finally {
        setIsGeneratingAdVariations(false);
    }
  };

  const handleGenerateImage = async () => {
    setGenerationError(null);
    try {
      await checkAndSelectKey();
      setIsGeneratingImage(true);
      setImageVariations([]);
      const base64 = await generateAdImage(data.creative.imagePrompt, imageAspectRatio, imageSize);
      setAdImage(base64);
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditImage = async () => {
      if (!adImage || !editPrompt) return;
      setIsEditingImage(true);
      try {
          await checkAndSelectKey();
          const newImage = await editAdImage(adImage, editPrompt);
          setAdImage(newImage);
          setShowEditInput(false);
          setEditPrompt('');
      } catch (e: any) {
          setGenerationError(e.message);
      } finally {
          setIsEditingImage(false);
      }
  };

  const handleGenerateVariations = async () => {
    setGenerationError(null);
    try {
      await checkAndSelectKey();
      setIsGeneratingVariations(true);
      const variations = await generateImageVariations(data.creative.imagePrompt, imageAspectRatio);
      setImageVariations(variations);
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message);
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleGenerateVideo = async () => {
    setGenerationError(null);
    try {
      await checkAndSelectKey();
      setIsGeneratingVideo(true);
      // Pass adImage if we want image-to-video (animate image)
      const videoUrl = await generateAdVideo(data.creative.videoScript, videoAspectRatio, adImage || undefined);
      setAdVideo(videoUrl);
    } catch (e: any) {
       console.error(e);
       setGenerationError(e.message);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateLogo = async () => {
    setGenerationError(null);
    try {
      await checkAndSelectKey();
      setIsGeneratingLogo(true);
      let logoPrompt = `Professional logo design for: ${data.strategy.usp}. `;
      if (logoStylePreference.trim()) {
        logoPrompt = `MUST FOLLOW STYLE/COLOR: ${logoStylePreference}. ${logoPrompt}`;
      }
      logoPrompt += `Brand Personality & Style: ${data.strategy.visualStyle}, ${data.strategy.toneOfVoice}. `;
      logoPrompt += `Visual Context from Ad Campaign: "${data.creative.imagePrompt.slice(0, 150)}...". `;
      const logoBase64 = await generateBrandLogo(logoPrompt);
      setAdLogo(logoBase64);
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message);
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleGenerateSpeech = async () => {
      setIsGeneratingSpeech(true);
      try {
          const audio = await generateSpeech(data.creative.videoScript);
          setTtsAudio(audio);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingSpeech(false);
      }
  };

  const handleChat = async () => {
      if (!chatInput.trim()) return;
      const userMsg = chatInput;
      setChatInput('');
      const newHistory = [...chatHistory, { role: 'user', parts: [{ text: userMsg }] }];
      setChatHistory(newHistory);
      setIsChatting(true);
      
      try {
          // Initialize chat with context if empty
          let historyToSend = newHistory;
          if (newHistory.length === 1) {
              const context = `Context: Campaign for ${data.strategy.usp}. Audience: ${data.strategy.targetAudience}.`;
              historyToSend = [{role: 'user', parts: [{text: context}]}, ...newHistory];
          }
          
          const response = await chatWithCampaign(historyToSend, userMsg);
          setChatHistory([...newHistory, { role: 'model', parts: [{ text: response }] }]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsChatting(false);
      }
  };

  const handleRegenerate = async () => {
    if (activeTab === 'IMAGE') {
      setAdImage(null);
      await handleGenerateImage();
    } else if (activeTab === 'VIDEO') {
      setAdVideo(null);
      await handleGenerateVideo();
    } else if (activeTab === 'LOGO') {
      setAdLogo(null);
      await handleGenerateLogo();
    }
  };

  const handleResetVideo = () => { setAdVideo(null); };
  const handleResetImage = () => { setAdImage(null); setImageVariations([]); };
  const handleResetLogo = () => { setAdLogo(null); };

  const getCurrentData = () => {
    return { ...data, adCopy: { ...currentAdCopy, cta: videoCta } };
  };

  const handleExportJson = () => {
    const fullData = { ...getCurrentData(), adVariations: adVariations || undefined };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `adgen-campaign-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleDownloadVariations = () => {
    if (!adVariations) return;
    const content = adVariations.map((v, i) => `VARIATION ${i+1}: ${v.angle}\nTarget Platforms: ${v.platforms.join(', ')}\nHeadline: ${v.headline}\nPrimary Text: ${v.primaryText}\n----------------------------------`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ad-variations-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const handleDownloadAssets = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folderName = `adgen-campaign-${new Date().toISOString().split('T')[0]}`;
      const folder = zip.folder(folderName);
      if (!folder) throw new Error("Failed to create zip folder");

      if (data.keywords) folder.file("keywords.txt", `KEYWORDS\n${data.keywords.join('\n')}`);
      folder.file("campaign-data.json", JSON.stringify({ ...getCurrentData(), adVariations }, null, 2));

      if (adImage) folder.file(`ad-image.png`, adImage.split(',')[1], { base64: true });
      if (adLogo) folder.file(`brand-logo.png`, adLogo.split(',')[1], { base64: true });
      if (adVideo) {
          const res = await fetch(adVideo);
          folder.file("ad-video.mp4", await res.blob());
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}.zip`;
      link.click();
    } catch (error) {
      console.error(error);
      setGenerationError("Failed to zip.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStep('Connecting...');
    await new Promise(r => setTimeout(r, 1500));
    setPublishStep('Uploading...');
    await new Promise(r => setTimeout(r, 1500));
    setIsPublishing(false);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 5000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in relative">
      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-2xl transition-all hover:scale-105"
      >
        <MessageSquare className="h-6 w-6 text-white" />
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
          <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[500px] overflow-hidden">
              <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-400"/> Campaign Assistant</h3>
                  <button onClick={() => setIsChatOpen(false)}><X className="h-4 w-4 text-slate-400"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.length === 0 && <p className="text-slate-500 text-sm text-center mt-4">Ask me anything about your campaign strategy!</p>}
                  {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                              {msg.parts[0].text}
                          </div>
                      </div>
                  ))}
                  {isChatting && <div className="text-slate-500 text-xs italic">Thinking...</div>}
                  <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-slate-700 bg-slate-800 flex gap-2">
                  <input 
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask a question..."
                  />
                  <button onClick={handleChat} disabled={isChatting} className="bg-indigo-600 p-2 rounded text-white"><Send className="h-4 w-4"/></button>
              </div>
          </div>
      )}

      {/* Success Modal */}
      {publishSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-green-500/50 p-6 rounded-2xl shadow-2xl text-center">
                <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Published!</h2>
                <button onClick={() => setPublishSuccess(false)} className="mt-4 px-6 py-2 bg-slate-700 text-white rounded-lg">Close</button>
            </div>
        </div>
      )}

      {/* 1. Strategy Card */}
      <Card title="Strategy & Audience" icon={<Target className="h-5 w-5" />} className="lg:col-span-1">
        <div className="space-y-4">
          <div><h4 className="text-xs uppercase text-slate-500 font-bold">Target Audience</h4><p className="text-slate-200 text-sm">{data.strategy.targetAudience}</p></div>
          <div><h4 className="text-xs uppercase text-slate-500 font-bold">USP</h4><p className="text-slate-200 text-sm">{data.strategy.usp}</p></div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs border border-indigo-800 rounded">{data.strategy.toneOfVoice}</span>
            <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs border border-purple-800 rounded">{data.strategy.visualStyle}</span>
          </div>
        </div>
      </Card>

      {/* 2. Ad Copy */}
      <Card title="Ad Copy" icon={<MessageSquare className="h-5 w-5" />} className="lg:col-span-2" action={<button onClick={handleRegenerateCopy} className="text-xs flex gap-1 items-center text-slate-400 hover:text-white"><RefreshCw className={isRegeneratingCopy ? 'animate-spin h-3 w-3' : 'h-3 w-3'}/> Regen</button>}>
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700"><h4 className="text-xs text-slate-500">HEADLINE</h4><p className="text-xl font-bold text-white">{currentAdCopy.headline}</p></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-3 bg-slate-900 rounded-lg border border-slate-700"><h4 className="text-xs text-slate-500">HOOK</h4><p className="text-slate-300 italic text-sm">{currentAdCopy.hook}</p></div>
             <div className="p-3 bg-slate-900 rounded-lg border border-slate-700"><h4 className="text-xs text-slate-500">CTA</h4><button className="bg-blue-600 text-white w-full py-1 rounded text-sm">{currentAdCopy.cta}</button></div>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700"><h4 className="text-xs text-slate-500">BODY</h4><p className="text-slate-300 text-sm whitespace-pre-line">{currentAdCopy.body}</p></div>
        </div>
      </Card>

      {/* 3. Visuals */}
      <Card title="Creative Visuals" icon={<ImageIcon className="h-5 w-5" />} className="lg:col-span-2">
         <div className="space-y-4">
             <div className="flex gap-2">
                <select value={imageAspectRatio} onChange={(e) => setImageAspectRatio(e.target.value as any)} className="bg-slate-900 text-xs text-white border border-slate-700 rounded p-2">
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="4:3">4:3 Standard</option>
                    <option value="3:4">3:4 Portrait</option>
                </select>
                <select value={imageSize} onChange={(e) => setImageSize(e.target.value as any)} className="bg-slate-900 text-xs text-white border border-slate-700 rounded p-2">
                    <option value="1K">1K</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K</option>
                </select>
                <button onClick={() => { setActiveTab('IMAGE'); handleGenerateImage(); }} disabled={isGeneratingImage} className="bg-indigo-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1">
                    {isGeneratingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate
                </button>
             </div>
             {adImage && (
                <div className="flex justify-end">
                    <button onClick={handleGenerateVariations} disabled={isGeneratingVariations} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        {isGeneratingVariations ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />} Variations
                    </button>
                </div>
             )}
             <div className="p-3 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-green-400 max-h-32 overflow-y-auto">
                 {data.creative.imagePrompt}
             </div>
         </div>
      </Card>

      {/* Brand Identity Card - New Section */}
      <Card title="Brand Identity" icon={<Hexagon className="h-5 w-5" />} className="lg:col-span-1">
        <div className="space-y-4">
            <div>
                <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Logo Style / Colors</label>
                <input 
                    type="text" 
                    value={logoStylePreference}
                    onChange={(e) => setLogoStylePreference(e.target.value)}
                    placeholder="e.g. Minimalist, Blue, Tech"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"
                />
            </div>
            <button 
                onClick={() => { setActiveTab('LOGO'); handleGenerateLogo(); }}
                disabled={isGeneratingLogo}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 text-sm"
            >
                {isGeneratingLogo ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                Generate Logo (Imagen)
            </button>
            {adLogo && (
                <div className="bg-white/5 p-4 rounded-lg flex justify-center border border-white/10 relative group">
                    <img src={adLogo} alt="Generated Logo" className="h-24 w-24 object-contain" />
                    <button onClick={handleResetLogo} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3 w-3 text-white"/></button>
                </div>
            )}
        </div>
      </Card>

      {/* 4. Video Script */}
      <Card title="Video Script" icon={<Video className="h-5 w-5" />} className="lg:col-span-2">
         <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
                <button onClick={handleGenerateSpeech} disabled={isGeneratingSpeech} className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-slate-300">
                    {isGeneratingSpeech ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
                </button>
                {ttsAudio && <audio src={ttsAudio} controls className="h-8 w-40" />}
                <div className="flex-1"></div>
                 <select value={videoAspectRatio} onChange={(e) => setVideoAspectRatio(e.target.value as any)} className="bg-slate-900 text-xs text-white border border-slate-700 rounded p-2">
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                </select>
                <div className="flex items-center gap-1">
                    <input 
                        type="text" 
                        value={videoCta} 
                        onChange={(e) => setVideoCta(e.target.value)} 
                        placeholder="CTA Text" 
                        className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white w-24"
                    />
                </div>
                <button onClick={() => { setActiveTab('VIDEO'); handleGenerateVideo(); }} disabled={isGeneratingVideo} className="bg-indigo-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1">
                    {isGeneratingVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Film className="h-3 w-3" />} Generate (Veo)
                </button>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700 text-slate-300 text-sm font-mono whitespace-pre-wrap">
                {data.creative.videoScript}
            </div>
         </div>
      </Card>

      {/* 5. Dynamic Ad Variations (DCO) - NEW SECTION */}
      <Card
        title="Dynamic Ad Variations (DCO)"
        icon={<Layers className="h-5 w-5" />}
        className="lg:col-span-3"
        action={
          adVariations && (
            <button onClick={handleDownloadVariations} className="text-xs flex gap-1 items-center text-slate-400 hover:text-white border border-slate-700 px-2 py-1 rounded">
              <Download className="h-3 w-3" /> Download .txt
            </button>
          )
        }
      >
        {!adVariations ? (
           <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
               <p className="text-slate-400 text-sm max-w-lg">
                   Generate 5 distinct ad angles (Pain, Social Proof, FOMO, etc.) optimized for Meta Advantage+ and Google Performance Max algorithms.
               </p>
               <button
                   onClick={handleGenerateAdVariations}
                   disabled={isGeneratingAdVariations}
                   className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
               >
                   {isGeneratingAdVariations ? <Loader2 className="animate-spin h-4 w-4"/> : <Sparkles className="h-4 w-4"/>}
                   Generate 5 Variations
               </button>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {adVariations.map((variant, idx) => (
                   <div key={idx} className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-indigo-500/50 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                           <span className="bg-indigo-900/50 text-indigo-300 text-xs font-bold px-2 py-1 rounded border border-indigo-500/30 uppercase tracking-wider">{variant.angle}</span>
                           <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                               {variant.platforms.map((p, i) => (
                                   <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{p}</span>
                               ))}
                           </div>
                       </div>
                       <div className="space-y-3">
                           <div>
                               <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Headline</p>
                               <p className="text-white text-sm font-semibold leading-tight">{variant.headline}</p>
                           </div>
                           <div>
                               <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Primary Text</p>
                               <p className="text-slate-300 text-xs leading-relaxed">{variant.primaryText}</p>
                           </div>
                            <div>
                               <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Target Platforms</p>
                               <div className="flex flex-wrap gap-1">
                                   {variant.platforms.map((p, i) => (
                                       <span key={i} className="text-[10px] text-slate-400">{p}{i < variant.platforms.length - 1 ? ', ' : ''}</span>
                                   ))}
                               </div>
                           </div>
                       </div>
                   </div>
               ))}
           </div>
        )}
      </Card>

      {/* 6. Live Preview */}
      <div id="live-preview" className="lg:col-span-3 mt-6 border-t border-slate-700 pt-8">
         <div className="flex justify-center gap-4 mb-6">
             <button onClick={() => setActiveTab('IMAGE')} className={`px-4 py-2 rounded font-bold ${activeTab === 'IMAGE' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Image</button>
             <button onClick={() => setActiveTab('VIDEO')} className={`px-4 py-2 rounded font-bold ${activeTab === 'VIDEO' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Video</button>
             <button onClick={() => setActiveTab('LOGO')} className={`px-4 py-2 rounded font-bold ${activeTab === 'LOGO' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>Logo</button>
         </div>

         <div className="flex justify-center">
             <div className="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-2xl ring-1 ring-black/10">
                 {/* Header */}
                 <div className="p-3 flex items-center gap-2 border-b">
                     <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                         {adLogo ? <img src={adLogo} className="w-full h-full object-cover" /> : "B"}
                     </div>
                     <div><p className="text-sm font-bold text-black">AdGen Brand</p><p className="text-xs text-gray-500">Sponsored</p></div>
                 </div>
                 {/* Content */}
                 <div className="p-3 text-sm text-black">{currentAdCopy.body}</div>
                 
                 {/* Media Area */}
                 <div className="aspect-square bg-slate-100 relative flex items-center justify-center group">
                     {activeTab === 'IMAGE' && (
                         adImage ? (
                             <>
                                <img src={adImage} className="w-full h-full object-contain" />
                                <button onClick={() => setShowEditInput(true)} className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-4 w-4"/></button>
                                {showEditInput && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                                        <div className="w-full bg-slate-800 p-4 rounded-lg">
                                            <p className="text-white text-sm mb-2">Edit Image (Nano Banana)</p>
                                            <input value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="e.g. Add a retro filter" className="w-full p-2 rounded mb-2 text-black"/>
                                            <div className="flex gap-2">
                                                <button onClick={handleEditImage} disabled={isEditingImage} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs flex-1">{isEditingImage ? 'Editing...' : 'Apply'}</button>
                                                <button onClick={() => setShowEditInput(false)} className="bg-slate-600 text-white px-3 py-1 rounded text-xs">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                             </>
                         ) : <div className="text-gray-400 flex flex-col items-center"><ImageIcon className="h-10 w-10 mb-2"/>Image not generated</div>
                     )}
                     {activeTab === 'VIDEO' && (
                         adVideo ? <video src={adVideo} controls autoPlay muted loop className="w-full h-full object-contain bg-black"/> : 
                         <div className="text-gray-400 flex flex-col items-center">
                            <Film className="h-10 w-10 mb-2"/>
                            <p>Video not generated</p>
                            {adImage && <button onClick={handleGenerateVideo} className="mt-2 text-indigo-600 text-xs font-bold">Animate Image with Veo</button>}
                         </div>
                     )}
                     {activeTab === 'LOGO' && (
                         adLogo ? <img src={adLogo} className="w-2/3 h-2/3 object-contain"/> : 
                         <div className="text-gray-400 flex flex-col items-center">
                             <Hexagon className="h-10 w-10 mb-2"/>
                             <button onClick={handleGenerateLogo} disabled={isGeneratingLogo} className="text-pink-600 text-xs font-bold">{isGeneratingLogo ? 'Designing...' : 'Generate Logo'}</button>
                         </div>
                     )}
                 </div>

                 {/* CTA */}
                 <div className="bg-slate-50 p-3 flex justify-between items-center">
                     <p className="text-xs font-bold text-slate-800">{currentAdCopy.headline}</p>
                     <button className="bg-slate-200 text-slate-800 px-3 py-1 rounded text-xs font-bold border border-slate-300">{videoCta}</button>
                 </div>
             </div>
         </div>
      </div>
      
      {/* Variations Grid */}
      {imageVariations.length > 0 && (
          <div className="lg:col-span-3 mt-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Layers className="h-4 w-4"/> Image Variations</h3>
              <div className="grid grid-cols-3 gap-4">
                  {imageVariations.map((src, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative group cursor-pointer" onClick={() => { setAdImage(src); setActiveTab('IMAGE'); document.getElementById('live-preview')?.scrollIntoView({behavior:'smooth'}); }}>
                          <img src={src} className="w-full h-full object-cover hover:opacity-80 transition-opacity"/>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                              <span className="text-white text-xs font-bold border border-white px-2 py-1 rounded">Select</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Social Prompts */}
      {socialPrompts && (
          <div className="lg:col-span-3 mt-6">
              <Card title="Social Media Adaptations" icon={<Share2 className="h-5 w-5"/>} action={<button onClick={handleGenerateSocial} className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><RefreshCw className={isGeneratingSocial ? 'animate-spin h-3 w-3' : 'h-3 w-3'}/> Regenerate</button>}>
                  <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                          <h4 className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-2"><Instagram className="h-4 w-4"/> Instagram Story</h4>
                          <p className="text-slate-300 text-xs whitespace-pre-wrap">{socialPrompts.instagramStory}</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                          <h4 className="text-pink-400 font-bold text-sm mb-2 flex items-center gap-2"><Music2 className="h-4 w-4"/> TikTok</h4>
                          <p className="text-slate-300 text-xs whitespace-pre-wrap">{socialPrompts.tikTok}</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                          <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2"><Youtube className="h-4 w-4"/> YouTube Short</h4>
                          <p className="text-slate-300 text-xs whitespace-pre-wrap">{socialPrompts.youTubeShort}</p>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {/* Downloads */}
      <div className="lg:col-span-3 flex justify-center mt-8 pb-12">
          <div className="flex flex-col items-center gap-4 w-full">
            <button onClick={handleDownloadAssets} disabled={isDownloading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 min-w-[200px] justify-center">
                {isDownloading ? <Loader2 className="animate-spin"/> : <Download/>} Download All Assets
            </button>
            <div className="flex gap-4">
                <button onClick={handleExportJson} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
                    <FileJson className="h-4 w-4"/> Export JSON
                </button>
                 <button onClick={handlePublish} disabled={isPublishing} className="text-slate-400 hover:text-green-400 text-sm flex items-center gap-1">
                    {isPublishing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Globe className="h-4 w-4"/>} {isPublishing ? publishStep : 'Publish (Simulation)'}
                </button>
            </div>
          </div>
      </div>

    </div>
  );
};
