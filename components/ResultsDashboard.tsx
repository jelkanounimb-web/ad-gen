import React, { useState } from 'react';
import { CampaignResult } from '../types';
import { Target, MessageSquare, Image as ImageIcon, Video, Hash, Copy, Check, Layout, Loader2, Sparkles, Download, Share2, Play, Film, RefreshCw, Hexagon, Smartphone, Monitor, Trash2, Globe, Facebook, AlertTriangle, X } from 'lucide-react';
import { generateAdImage, generateAdVideo, generateBrandLogo } from '../services/geminiService';

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
  const [adLogo, setAdLogo] = useState<string | null>(null);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishStep, setPublishStep] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO' | 'LOGO'>('IMAGE');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');

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

  const handleGenerateImage = async () => {
    setGenerationError(null);
    try {
      await checkAndSelectKey();
      setIsGeneratingImage(true);
      const base64 = await generateAdImage(data.creative.imagePrompt, imageAspectRatio);
      setAdImage(base64);
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    setGenerationError(null);
    try {
      await checkAndSelectKey();
      setIsGeneratingVideo(true);
      // Use the video script as the base prompt, adding quality modifiers
      const videoUrl = await generateAdVideo(data.creative.videoScript, videoAspectRatio);
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
      const logoPrompt = `Logo for ${data.strategy.usp}. Style: ${data.strategy.visualStyle}, ${data.strategy.toneOfVoice}`;
      
      const logoBase64 = await generateBrandLogo(logoPrompt);
      setAdLogo(logoBase64);
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message);
    } finally {
      setIsGeneratingLogo(false);
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

  const handleResetVideo = () => {
    setAdVideo(null);
  };

  const handleResetImage = () => {
    setAdImage(null);
  };

  const handleDownloadAssets = async () => {
    if (isDownloading) return;
    
    let hasAssets = false;
    setIsDownloading(true);

    const downloadFile = (href: string, filename: string) => {
       const link = document.createElement('a');
       link.href = href;
       link.download = filename;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
    };

    if (adImage) {
      try {
        const mimeMatch = adImage.match(/data:([^;]*);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const ext = mimeType.split('/')[1] || 'png';
        downloadFile(adImage, `adgen-creative-${Date.now()}.${ext}`);
        hasAssets = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) { console.error(e); }
    }

    if (adLogo) {
       try {
        const mimeMatch = adLogo.match(/data:([^;]*);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const ext = mimeType.split('/')[1] || 'png';
        downloadFile(adLogo, `adgen-logo-${Date.now()}.${ext}`);
        hasAssets = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) { console.error(e); }
    }

    if (adVideo) {
      try {
        downloadFile(adVideo, `adgen-video-${Date.now()}.mp4`);
        hasAssets = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) { console.error("Error downloading video", e); }
    }

    setIsDownloading(false);

    if (!hasAssets) {
      alert("No assets generated yet. Please generate an image, logo, or video first.");
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    // Simulate Publishing Workflow
    setPublishStep('Connecting to Meta Ads Manager...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPublishStep('Uploading Creative Assets...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPublishStep('Syncing with Google Ads...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    setPublishStep('Finalizing Campaign...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsPublishing(false);
    setPublishSuccess(true);
    setPublishStep('');
    
    // Hide success message after 8 seconds
    setTimeout(() => setPublishSuccess(false), 8000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in relative">
      
      {/* Success Modal Overlay */}
      {publishSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-800 border border-green-500/50 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center transform scale-100 transition-all">
                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-500/10">
                    <Check className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Campaign Published!</h2>
                <p className="text-slate-300 mb-6">
                    Your ads are now live on <span className="text-blue-400 font-bold">Facebook Ads</span> and <span className="text-yellow-500 font-bold">Google Ads</span>.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 mb-6 text-left border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Status</span>
                        <span className="text-green-400 text-xs font-bold bg-green-900/30 px-2 py-1 rounded uppercase border border-green-800">Active</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Estimated Reach</span>
                        <span className="text-white text-sm font-mono">15k - 25k / day</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Targeting</span>
                        <span className="text-white text-sm truncate max-w-[150px]">{data.strategy.targetAudience}</span>
                    </div>
                </div>
                <button 
                    onClick={() => setPublishSuccess(false)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                >
                    Go to Ad Manager
                </button>
            </div>
        </div>
      )}

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
            <div className="flex items-center justify-between mb-1">
                <p className="text-slate-400 text-sm">Use this prompt to generate visuals.</p>
                <button 
                  onClick={() => {
                    setActiveTab('IMAGE');
                    document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                    if (!adImage) handleGenerateImage();
                  }}
                  className="text-xs flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 transition-colors"
                >
                  <Sparkles className="h-3 w-3" /> Generate
                </button>
            </div>
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
         <div className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between mb-1">
                <p className="text-slate-400 text-sm">AI-generated script for 15s ad.</p>
                <div className="flex items-center gap-2">
                   {adVideo && (
                     <button 
                       onClick={async () => {
                         setActiveTab('VIDEO');
                         document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                         setAdVideo(null);
                         await handleGenerateVideo();
                       }}
                       disabled={isGeneratingVideo}
                       className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded border border-slate-600 transition-colors"
                       title="Regenerate Video"
                     >
                       <RefreshCw className={`h-3 w-3 ${isGeneratingVideo ? 'animate-spin' : ''}`} />
                       <span className="hidden sm:inline">Regenerate</span>
                     </button>
                   )}
                   <button 
                      onClick={() => {
                        setActiveTab('VIDEO');
                        document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                        if (!adVideo) handleGenerateVideo();
                      }}
                      disabled={isGeneratingVideo}
                      className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                        adVideo 
                        ? 'bg-indigo-900/50 hover:bg-indigo-900/80 text-indigo-200 border-indigo-500/30'
                        : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {adVideo ? <Play className="h-3 w-3" /> : <Film className="h-3 w-3" />} 
                      {adVideo ? "View Video" : "Generate Video"}
                    </button>
                </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-lg border border-slate-700 text-slate-300 text-sm font-mono whitespace-pre-wrap relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <CopyButton text={data.creative.videoScript} />
                 </div>
                {data.creative.videoScript}
            </div>
         </div>
      </Card>

      {/* 6. Live Ad Preview */}
      <div id="live-preview" className="lg:col-span-3 mt-6 border-t border-slate-700 pt-8">
        <div className="flex flex-col items-center justify-center mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <Layout className="h-6 w-6 text-indigo-400" />
                Live Ad Preview
            </h2>
            
            {/* Centered Toggle Switch */}
            <div className="bg-slate-900 p-1.5 rounded-xl flex border border-slate-700 shadow-inner overflow-x-auto max-w-full">
               <button 
                  onClick={() => setActiveTab('IMAGE')}
                  className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
                  className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'VIDEO' 
                      ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
               >
                 <Film className="h-4 w-4" />
                 Video Ad (Veo)
               </button>
               <div className="w-px bg-slate-800 mx-1 my-2"></div>
               <button 
                  onClick={() => setActiveTab('LOGO')}
                  className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'LOGO' 
                      ? 'bg-pink-600 text-white shadow-md ring-1 ring-pink-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
               >
                 <Hexagon className="h-4 w-4" />
                 Brand Logo
               </button>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center items-start bg-slate-800/50 p-6 md:p-8 rounded-xl border border-slate-700 relative">
            
            {/* Error Banner */}
            {generationError && (
               <div className="absolute top-0 left-0 right-0 z-40 p-4">
                 <div className="bg-red-900/90 backdrop-blur-md border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-lg flex items-start justify-between max-w-2xl mx-auto">
                   <div className="flex items-center gap-3">
                     <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                     <p className="text-sm font-medium">{generationError}</p>
                   </div>
                   <button onClick={() => setGenerationError(null)} className="text-red-300 hover:text-white ml-4">
                     <X className="h-4 w-4" />
                   </button>
                 </div>
               </div>
            )}

            {/* Mockup Container - Facebook Style */}
            <div className="w-full max-w-sm mx-auto bg-white text-slate-900 rounded-lg overflow-hidden shadow-2xl font-sans ring-1 ring-black/5">
                {/* Header */}
                <div className="p-3 flex items-center gap-2 border-b border-gray-100">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                      {adLogo ? <img src={adLogo} className="w-full h-full object-cover" alt="Brand" /> : "A"}
                    </div>
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
                    
                    {/* Media Type Toggle */}
                    {(activeTab === 'IMAGE' || activeTab === 'VIDEO') && (
                      <div className="absolute top-3 left-3 z-30 opacity-100 transition-opacity duration-200">
                         <button
                            onClick={() => setActiveTab(activeTab === 'IMAGE' ? 'VIDEO' : 'IMAGE')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-indigo-600 text-white text-xs font-medium rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg"
                         >
                            {activeTab === 'IMAGE' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                            {activeTab === 'IMAGE' ? "View Video" : "View Image"}
                         </button>
                      </div>
                    )}
                    
                    {/* Overlay Buttons (Regenerate/Delete) */}
                    {((activeTab === 'IMAGE' && adImage) || (activeTab === 'VIDEO' && adVideo) || (activeTab === 'LOGO' && adLogo)) && (
                        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/media:opacity-100 transition-all duration-200 transform translate-y-2 group-hover/media:translate-y-0 flex gap-2">
                            {(activeTab === 'VIDEO' || activeTab === 'IMAGE') && (
                                <button 
                                    onClick={activeTab === 'VIDEO' ? handleResetVideo : handleResetImage}
                                    className="p-2 bg-black/60 hover:bg-red-600/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-105 border border-white/10"
                                    title="Reset"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                            <button 
                                onClick={handleRegenerate}
                                disabled={isGeneratingImage || isGeneratingVideo || isGeneratingLogo}
                                className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-105 border border-white/10"
                                title="Regenerate Asset"
                            >
                                <RefreshCw className={`h-4 w-4 ${isGeneratingImage || isGeneratingVideo || isGeneratingLogo ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}

                    {/* IMAGE MODE */}
                    {activeTab === 'IMAGE' && (
                       <>
                          {adImage ? (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <img src={adImage} alt="Generated Ad" className="w-full h-full object-contain animate-fade-in" />
                              </div>
                          ) : (
                              <div className="text-center p-6 text-gray-400 flex flex-col items-center w-full">
                                  <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                                  
                                  {!isGeneratingImage && (
                                      <div className="flex gap-2 mb-5 bg-slate-200 p-1 rounded-lg">
                                          <button 
                                            onClick={() => setImageAspectRatio('1:1')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${imageAspectRatio === '1:1' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                          >
                                            <ImageIcon className="h-3 w-3" /> Square
                                          </button>
                                          <button 
                                            onClick={() => setImageAspectRatio('9:16')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${imageAspectRatio === '9:16' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                          >
                                            <Smartphone className="h-3 w-3" /> 9:16
                                          </button>
                                          <button 
                                            onClick={() => setImageAspectRatio('16:9')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${imageAspectRatio === '16:9' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                          >
                                            <Monitor className="h-3 w-3" /> 16:9
                                          </button>
                                      </div>
                                  )}

                                  {!isGeneratingImage ? (
                                    <button 
                                      onClick={handleGenerateImage}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1 shadow-lg shadow-indigo-500/30"
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
                              <video src={adVideo} controls autoPlay muted loop className="w-full h-full object-contain bg-black animate-fade-in" />
                          ) : (
                              <div className="text-center p-6 text-gray-400 flex flex-col items-center w-full">
                                  <Film className="h-12 w-12 mb-2 opacity-20" />
                                  <p className="text-[10px] uppercase tracking-wide font-medium mb-4">Powered by Veo 3.1</p>
                                  
                                  {!isGeneratingVideo && (
                                      <div className="flex gap-2 mb-5 bg-slate-200 p-1 rounded-lg">
                                          <button 
                                            onClick={() => setVideoAspectRatio('9:16')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${videoAspectRatio === '9:16' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                          >
                                            <Smartphone className="h-3 w-3" /> 9:16
                                          </button>
                                          <button 
                                            onClick={() => setVideoAspectRatio('16:9')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${videoAspectRatio === '16:9' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                          >
                                            <Monitor className="h-3 w-3" /> 16:9
                                          </button>
                                      </div>
                                  )}

                                  {!isGeneratingVideo ? (
                                    <button 
                                      onClick={handleGenerateVideo}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:scale-105"
                                    >
                                      <Video className="h-4 w-4" /> Generate Video
                                    </button>
                                  ) : (
                                    <div className="flex flex-col items-center mt-2">
                                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500"/>
                                      <p className="text-xs mt-2 text-indigo-500 font-medium">Generating (~2m)...</p>
                                    </div>
                                  )}
                              </div>
                          )}
                       </>
                    )}

                    {/* LOGO MODE */}
                    {activeTab === 'LOGO' && (
                       <div className="w-full h-full bg-white flex items-center justify-center p-12">
                          {adLogo ? (
                              <img src={adLogo} alt="Generated Logo" className="w-full h-full object-contain animate-fade-in drop-shadow-xl" />
                          ) : (
                              <div className="text-center p-6 text-gray-400 flex flex-col items-center">
                                  <Hexagon className="h-12 w-12 mb-2 opacity-20" />
                                  <p className="text-[10px] uppercase tracking-wide font-medium mb-2">Powered by Imagen 3</p>
                                  {!isGeneratingLogo ? (
                                    <button 
                                      onClick={handleGenerateLogo}
                                      className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1 shadow-lg shadow-pink-500/30"
                                    >
                                      <Sparkles className="h-3 w-3" /> Generate Logo
                                    </button>
                                  ) : (
                                    <div className="flex flex-col items-center mt-2">
                                      <Loader2 className="h-6 w-6 animate-spin text-pink-500"/>
                                      <p className="text-xs mt-2 text-pink-500 font-medium">Designing...</p>
                                    </div>
                                  )}
                              </div>
                          )}
                       </div>
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
                       <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Logo</span>
                          {adLogo ? (
                             <span className="text-green-400 flex items-center gap-1"><Check className="h-3 w-3"/> Ready</span>
                          ) : (
                             <span className="text-amber-400 flex items-center gap-1 text-xs">Waiting</span>
                          )}
                       </div>
                    </div>
                    
                    <div className="mt-5 space-y-3">
                      <button 
                        onClick={handleDownloadAssets}
                        disabled={isDownloading}
                        className={`w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg transition-colors font-medium text-sm ${isDownloading ? 'opacity-75 cursor-wait' : ''}`}
                      >
                          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          {isDownloading ? 'Downloading...' : 'Download Assets'}
                      </button>
                      <button 
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className={`w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg transition-colors font-medium text-sm ${isPublishing ? 'opacity-75 cursor-wait' : ''}`}
                      >
                          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                          {isPublishing ? publishStep || 'Publish Campaign' : 'Publish Campaign'}
                      </button>
                    </div>
                </div>
                 <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-900/50">
                    <p className="text-xs text-indigo-300 text-center">
                       Powered by <strong>Gemini 3 Pro</strong>, <strong>Veo 3.1</strong> & <strong>Imagen 3</strong>.
                    </p>
                 </div>
            </div>
        </div>
      </div>

    </div>
  );
};