import React, { useState } from 'react';
import { CampaignResult } from '../types';
import { Target, MessageSquare, Image as ImageIcon, Video, Hash, Copy, Check, Layout, Loader2, Sparkles, Download, Share2, Play, Film, RefreshCw } from 'lucide-react';
import { generateAdImage, generateAdVideo } from '../services/geminiService';

interface ResultsDashboardProps {
  data: CampaignResult;
}

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = "" }) => (
  <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-3">
      <div className="text-indigo-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
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
    <button 
      onClick={handleCopy} 
      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ data }) => {
  const [adImage, setAdImage] = useState<string | null>(null);
  const [adVideo, setAdVideo] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  const checkAndSelectKey = async () => {
    // Cast window to any to bypass potential type conflicts with global declarations
    const win = window as any;
    if (win.aistudio) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await win.aistudio.openSelectKey();
        return true; // Assume success or user interaction
      }
    }
    return true;
  };

  const handleGenerateImage = async () => {
    try {
      await checkAndSelectKey();
      setIsGeneratingImage(true);
      const base64 = await generateAdImage(data.creative.imagePrompt);
      setAdImage(base64);
    } catch (e: any) {
      console.error(e);
      const win = window as any;
      if (e.message?.includes("Requested entity was not found")) {
         if (win.aistudio) await win.aistudio.openSelectKey();
      }
      alert("Could not generate image. If using Pro models, ensure you have selected a valid API key.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      await checkAndSelectKey();
      setIsGeneratingVideo(true);
      const videoUrl = await generateAdVideo(data.creative.imagePrompt + ", high quality, 4k advertising style");
      setAdVideo(videoUrl);
    } catch (e: any) {
       console.error(e);
       const win = window as any;
       if (e.message?.includes("Requested entity was not found")) {
         if (win.aistudio) await win.aistudio.openSelectKey();
       }
       alert("Could not generate video. Please ensure you have selected a valid paid API key for Veo.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleRegenerate = async () => {
    if (activeTab === 'IMAGE') {
      setAdImage(null);
      await handleGenerateImage();
    } else {
      setAdVideo(null);
      await handleGenerateVideo();
    }
  };

  const handleDownloadAssets = () => {
    let hasAssets = false;

    if (adImage) {
      try {
        // Try to determine extension from data URI
        const mimeMatch = adImage.match(/data:([^;]*);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const ext = mimeType.split('/')[1] || 'png';

        const link = document.createElement('a');
        link.href = adImage;
        link.download = `adgen-creative-${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        hasAssets = true;
      } catch (e) {
        console.error("Error downloading image", e);
      }
    }

    if (adVideo) {
      try {
        const link = document.createElement('a');
        link.href = adVideo;
        link.download = `adgen-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        hasAssets = true;
      } catch (e) {
        console.error("Error downloading video", e);
      }
    }

    if (!hasAssets) {
      alert("No assets generated yet. Please generate an image or video first using the preview section.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* 1. Strategy Card */}
      <Card title="Strategy & Audience" icon={<Target className="h-5 w-5" />} className="lg:col-span-1">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-1">Target Audience</h4>
            <p className="text-slate-200 text-sm leading-relaxed">{data.strategy.targetAudience}</p>
          </div>
          <div>
            <h4 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-1">USP</h4>
            <p className="text-slate-200 text-sm leading-relaxed">{data.strategy.usp}</p>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 rounded-md bg-indigo-900/50 text-indigo-300 text-xs font-medium border border-indigo-800">
              {data.strategy.toneOfVoice}
            </span>
            <span className="px-2 py-1 rounded-md bg-purple-900/50 text-purple-300 text-xs font-medium border border-purple-800">
              {data.strategy.visualStyle}
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Ad Copy Card */}
      <Card title="Ad Copy" icon={<MessageSquare className="h-5 w-5" />} className="lg:col-span-2">
        <div className="space-y-4">
          <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={data.adCopy.headline} />
            </div>
            <h4 className="text-xs text-slate-500 mb-1">HEADLINE</h4>
            <p className="text-xl font-bold text-white">{data.adCopy.headline}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CopyButton text={data.adCopy.hook} />
               </div>
              <h4 className="text-xs text-slate-500 mb-1">HOOK</h4>
              <p className="text-slate-300 italic">"{data.adCopy.hook}"</p>
            </div>
             <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700 flex flex-col justify-center">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CopyButton text={data.adCopy.cta} />
               </div>
              <h4 className="text-xs text-slate-500 mb-1">CTA</h4>
              <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold w-full text-center hover:bg-blue-700 transition-colors text-sm">
                {data.adCopy.cta}
              </button>
            </div>
          </div>

          <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700">
             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <CopyButton text={data.adCopy.body} />
             </div>
            <h4 className="text-xs text-slate-500 mb-1">BODY TEXT</h4>
            <p className="text-slate-300 text-sm whitespace-pre-line">{data.adCopy.body}</p>
          </div>
        </div>
      </Card>

      {/* 3. Visual Prompt Card */}
      <Card title="Creative Visuals" icon={<ImageIcon className="h-5 w-5" />} className="lg:col-span-2">
         <div className="space-y-2 h-full flex flex-col">
            <p className="text-slate-400 text-sm mb-2">Use this prompt in Veo, DALL-E 3, or Gemini Image generation.</p>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm text-green-400 overflow-y-auto flex-1 max-h-48 relative group">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CopyButton text={data.creative.imagePrompt} />
               </div>
               {data.creative.imagePrompt}
            </div>
         </div>
      </Card>

      {/* 4. Keywords Card */}
      <Card title="Keywords" icon={<Hash className="h-5 w-5" />} className="lg:col-span-1">
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((kw, idx) => (
            <span key={idx} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-md text-xs hover:bg-slate-600 transition-colors cursor-default">
              #{kw}
            </span>
          ))}
        </div>
      </Card>

      {/* 5. Video Script Card */}
      <Card title="Video Script (15s)" icon={<Video className="h-5 w-5" />} className="lg:col-span-3">
         <div className="bg-slate-900 p-5 rounded-lg border border-slate-700 text-slate-300 text-sm font-mono whitespace-pre-wrap relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <CopyButton text={data.creative.videoScript} />
             </div>
            {data.creative.videoScript}
         </div>
      </Card>

      {/* 6. Live Ad Preview (New) */}
      <div className="lg:col-span-3 mt-6 border-t border-slate-700 pt-8">
        <div className="flex flex-col items-center justify-center mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <Layout className="h-6 w-6 text-indigo-400" />
                Live Ad Preview
            </h2>
            
            {/* Centered Toggle Switch */}
            <div className="bg-slate-900 p-1.5 rounded-xl flex border border-slate-700 shadow-inner">
               <button 
                  onClick={() => setActiveTab('IMAGE')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'IMAGE' 
                      ? 'bg-slate-700 text-white shadow-md ring-1 ring-slate-600' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
               >
                 <ImageIcon className="h-4 w-4" />
                 Static Image
               </button>
               <div className="w-px bg-slate-800 mx-1 my-2"></div>
               <button 
                  onClick={() => setActiveTab('VIDEO')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'VIDEO' 
                      ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
               >
                 <Film className="h-4 w-4" />
                 Video Ad (Veo)
               </button>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center items-start bg-slate-800/50 p-6 md:p-8 rounded-xl border border-slate-700">
            {/* Mockup Container - Facebook Style */}
            <div className="w-full max-w-sm mx-auto bg-white text-slate-900 rounded-lg overflow-hidden shadow-2xl font-sans ring-1 ring-black/5">
                {/* Header */}
                <div className="p-3 flex items-center gap-2 border-b border-gray-100">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">A</div>
                    <div>
                        <p className="font-semibold text-sm leading-tight">AdGen Master</p>
                        <p className="text-xs text-gray-500">Sponsored • <span className="hover:underline cursor-pointer">Learn More</span></p>
                    </div>
                </div>
                {/* Body */}
                <div className="p-3 pb-2">
                    <p className="text-sm text-gray-800 whitespace-pre-line leading-snug">{data.adCopy.body}</p>
                </div>
                
                {/* Creative Area */}
                <div className="w-full aspect-square bg-slate-100 relative flex items-center justify-center overflow-hidden group/media">
                    
                    {/* Regenerate Button Overlay */}
                    {((activeTab === 'IMAGE' && adImage) || (activeTab === 'VIDEO' && adVideo)) && (
                        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/media:opacity-100 transition-all duration-200 transform translate-y-2 group-hover/media:translate-y-0">
                            <button 
                                onClick={handleRegenerate}
                                disabled={isGeneratingImage || isGeneratingVideo}
                                className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-105 border border-white/10"
                                title="Regenerate Asset"
                            >
                                <RefreshCw className={`h-4 w-4 ${isGeneratingImage || isGeneratingVideo ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}

                    {/* IMAGE MODE */}
                    {activeTab === 'IMAGE' && (
                       <>
                          {adImage ? (
                              <img src={adImage} alt="Generated Ad" className="w-full h-full object-cover animate-fade-in" />
                          ) : (
                              <div className="text-center p-6 text-gray-400 flex flex-col items-center">
                                  <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                                  {!isGeneratingImage ? (
                                    <button 
                                      onClick={handleGenerateImage}
                                      className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1 shadow-lg shadow-indigo-500/30"
                                    >
                                      <Sparkles className="h-3 w-3" /> Generate (Pro)
                                    </button>
                                  ) : (
                                    <div className="flex flex-col items-center mt-2">
                                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500"/>
                                      <p className="text-xs mt-2 text-indigo-500 font-medium">Rendering...</p>
                                    </div>
                                  )}
                              </div>
                          )}
                       </>
                    )}

                    {/* VIDEO MODE */}
                    {activeTab === 'VIDEO' && (
                       <>
                          {adVideo ? (
                              <video src={adVideo} controls autoPlay muted loop className="w-full h-full object-cover animate-fade-in" />
                          ) : (
                              <div className="text-center p-6 text-gray-400 flex flex-col items-center">
                                  <Film className="h-12 w-12 mb-2 opacity-20" />
                                  <p className="text-[10px] uppercase tracking-wide font-medium mb-2">Powered by Veo 3.1</p>
                                  {!isGeneratingVideo ? (
                                    <button 
                                      onClick={handleGenerateVideo}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1 shadow-lg shadow-indigo-500/30"
                                    >
                                      <Video className="h-3 w-3" /> Generate Video
                                    </button>
                                  ) : (
                                    <div className="flex flex-col items-center mt-2">
                                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500"/>
                                      <p className="text-xs mt-2 text-indigo-500 font-medium">Generating (Takes ~1m)...</p>
                                    </div>
                                  )}
                              </div>
                          )}
                       </>
                    )}
                </div>

                {/* Footer / CTA Area */}
                <div className="bg-gray-50 p-3 flex items-center justify-between border-t border-gray-100">
                     <div className="flex-1 pr-4 overflow-hidden">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider truncate">YOURSITE.COM</p>
                        <p className="font-bold text-sm leading-tight truncate">{data.adCopy.headline}</p>
                     </div>
                     <button className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded transition-colors uppercase whitespace-nowrap">
                        {data.adCopy.cta}
                     </button>
                </div>
            </div>

            {/* Action Side Panel */}
            <div className="w-full md:w-64 flex flex-col gap-4 animate-fade-in delay-150">
                <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-lg">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-400" /> 
                      Campaign Status
                    </h3>
                    
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Copy</span>
                          <span className="text-green-400 flex items-center gap-1"><Check className="h-3 w-3"/> Ready</span>
                       </div>
                       <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Visual</span>
                          {adImage ? (
                             <span className="text-green-400 flex items-center gap-1"><Check className="h-3 w-3"/> Ready</span>
                          ) : (
                             <span className="text-amber-400 flex items-center gap-1 text-xs">Waiting</span>
                          )}
                       </div>
                       <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Video</span>
                          {adVideo ? (
                             <span className="text-green-400 flex items-center gap-1"><Check className="h-3 w-3"/> Ready</span>
                          ) : (
                             <span className="text-amber-400 flex items-center gap-1 text-xs">Waiting</span>
                          )}
                       </div>
                    </div>
                    
                    <div className="mt-5 space-y-3">
                      <button 
                        onClick={handleDownloadAssets}
                        className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg transition-colors font-medium text-sm"
                      >
                          <Download className="h-4 w-4" /> Download Assets
                      </button>
                      <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg transition-colors font-medium text-sm">
                          <Share2 className="h-4 w-4" /> Publish Campaign
                      </button>
                    </div>
                </div>
                 <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-900/50">
                    <p className="text-xs text-indigo-300 text-center">
                       Using <strong>Gemini 3 Pro</strong> & <strong>Veo 3.1</strong> for high-fidelity assets.
                    </p>
                 </div>
            </div>
        </div>
      </div>

    </div>
  );
};