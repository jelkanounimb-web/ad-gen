import React, { useState, useEffect } from 'react';
import { CampaignResult, AdCopy, SocialPrompts, AdVariant } from '../types';
import { Target, MessageSquare, Image as ImageIcon, Video, Hash, Copy, Check, Layout, Loader2, Sparkles, Download, Share2, Play, Film, RefreshCw, Hexagon, Smartphone, Monitor, Trash2, Globe, Facebook, AlertTriangle, X, ChevronDown, FileJson, Instagram, Youtube, Music2, Grid, Layers, Zap, Edit2 } from 'lucide-react';
import { generateAdImage, generateAdVideo, generateBrandLogo, regenerateAdCopy, generateSocialPrompts, generateImageVariations, generateAdVariations } from '../services/geminiService';
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
  // Local state for Ad Copy to allow regeneration
  const [currentAdCopy, setCurrentAdCopy] = useState<AdCopy>(data.adCopy);

  const [adImage, setAdImage] = useState<string | null>(null);
  const [adVideo, setAdVideo] = useState<string | null>(null);
  const [adLogo, setAdLogo] = useState<string | null>(null);
  const [socialPrompts, setSocialPrompts] = useState<SocialPrompts | null>(null);
  const [imageVariations, setImageVariations] = useState<string[]>([]);
  const [adVariations, setAdVariations] = useState<AdVariant[] | null>(null);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isRegeneratingCopy, setIsRegeneratingCopy] = useState(false);
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isGeneratingAdVariations, setIsGeneratingAdVariations] = useState(false);
  
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishStep, setPublishStep] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO' | 'LOGO'>('IMAGE');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  
  const [logoStylePreference, setLogoStylePreference] = useState('');
  
  // New state for customizable Video CTA
  const [videoCta, setVideoCta] = useState(data.adCopy.cta);

  // Reset local ad copy when data prop changes (e.g. loading from history)
  useEffect(() => {
    setCurrentAdCopy(data.adCopy);
    setVideoCta(data.adCopy.cta);
    setSocialPrompts(null);
    setImageVariations([]);
    setAdVariations(null);
  }, [data]);

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
      setVideoCta(newCopy.cta); // Update video CTA too if copy regenerates
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
      setImageVariations([]); // Clear old variations on new main generation
      const base64 = await generateAdImage(data.creative.imagePrompt, imageAspectRatio);
      setAdImage(base64);
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message);
    } finally {
      setIsGeneratingImage(false);
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
      // Use the video script as the base prompt, adding quality modifiers
      // Pass the selected aspect ratio from state
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
      
      // Construct a structured prompt
      let logoPrompt = `Professional logo design for: ${data.strategy.usp}. `;
      
      // Prioritize user preference if provided
      if (logoStylePreference.trim()) {
        logoPrompt = `MUST FOLLOW STYLE/COLOR: ${logoStylePreference}. ${logoPrompt}`;
      }

      logoPrompt += `Brand Personality & Style: ${data.strategy.visualStyle}, ${data.strategy.toneOfVoice}. `;
      
      // Integrate creative assets as requested
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
    setImageVariations([]);
  };

  const handleResetLogo = () => {
    setAdLogo(null);
  };

  const getCurrentData = () => {
    return {
      ...data,
      adCopy: {
          ...currentAdCopy,
          cta: videoCta // Ensure export includes customized CTA if updated
      }
    };
  };

  const handleExportJson = () => {
    const dataToExport = getCurrentData();
    const fullData = {
        ...dataToExport,
        adVariations: adVariations || undefined,
    };
    const jsonString = JSON.stringify(fullData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Use ISO date string for cleaner filename
    link.download = `adgen-campaign-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadVariations = () => {
    if (!adVariations) return;
    const content = adVariations.map((v, i) => 
        `VARIATION ${i+1}: ${v.angle}\n` +
        `Platforms: ${v.platforms.join(', ')}\n` +
        `Headline: ${v.headline}\n` +
        `Body: ${v.primaryText}\n` +
        `----------------------------------`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ad-variations-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAssets = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    const dataToExport = getCurrentData();

    try {
      const zip = new JSZip();
      const folderName = `adgen-campaign-${new Date().toISOString().split('T')[0]}`;
      const folder = zip.folder(folderName);
      
      if (!folder) throw new Error("Failed to create zip folder");

      // 1. Keywords
      if (data.keywords && data.keywords.length > 0) {
        const keywordsContent = `CAMPAIGN KEYWORDS\n-----------------\n\n${data.keywords.map(k => `- ${k}`).join('\n')}`;
        folder.file("keywords.txt", keywordsContent);
      }

      // 2. Campaign Data (JSON)
      const fullData = { ...dataToExport, adVariations };
      folder.file("campaign-data.json", JSON.stringify(fullData, null, 2));

      // 3. Social Prompts (Text)
      if (socialPrompts) {
        const socialContent = `SOCIAL MEDIA ADAPTATIONS\n------------------------\n\nINSTAGRAM STORY:\n${socialPrompts.instagramStory}\n\nTIKTOK:\n${socialPrompts.tikTok}\n\nYOUTUBE SHORT:\n${socialPrompts.youTubeShort}`;
        folder.file("social-prompts.txt", socialContent);
      }

      // 3b. Ad Variations (Text)
      if (adVariations) {
        const variantsContent = adVariations.map((v, i) => 
            `VARIATION ${i+1}: ${v.angle}\n` +
            `Platforms: ${v.platforms.join(', ')}\n` +
            `Headline: ${v.headline}\n` +
            `Body: ${v.primaryText}\n` +
            `----------------------------------`
        ).join('\n\n');
        folder.file("ad-variations.txt", variantsContent);
      }

      // 4. Image
      if (adImage) {
        // adImage is base64 data uri
        const base64Data = adImage.split(',')[1];
        const mimeMatch = adImage.match(/data:([^;]*);/);
        const ext = mimeMatch ? (mimeMatch[1].split('/')[1] || 'png') : 'png';
        folder.file(`ad-image.${ext}`, base64Data, { base64: true });
      }

      // 4b. Variations
      if (imageVariations.length > 0) {
        imageVariations.forEach((varImg, idx) => {
           const base64Data = varImg.split(',')[1];
           const mimeMatch = varImg.match(/data:([^;]*);/);
           const ext = mimeMatch ? (mimeMatch[1].split('/')[1] || 'jpeg') : 'jpeg';
           folder.file(`variation-${idx+1}.${ext}`, base64Data, { base64: true });
        });
      }

      // 5. Logo
      if (adLogo) {
         const base64Data = adLogo.split(',')[1];
         const mimeMatch = adLogo.match(/data:([^;]*);/);
         const ext = mimeMatch ? (mimeMatch[1].split('/')[1] || 'png') : 'png';
         folder.file(`brand-logo.${ext}`, base64Data, { base64: true });
      }

      // 6. Video
      if (adVideo) {
        // adVideo is a blob URL from URL.createObjectURL
        try {
            const response = await fetch(adVideo);
            const blob = await response.blob();
            folder.file("ad-video.mp4", blob);
        } catch (e) {
            console.error("Failed to fetch video blob", e);
        }
      }

      // Generate Zip
      const content = await zip.generateAsync({ type: "blob" });
      
      // Trigger Download
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Download failed:", error);
      setGenerationError("Failed to create zip file.");
    } finally {
      setIsDownloading(false);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in relative">
      
      {/* Success Modal Overlay */}
      {publishSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-800 border border-green-500/50 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center transform scale-100 transition-all">
                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-500/10">
                    <Check className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Campaign Published!</h2>
                <p className="text-slate-300 mb-6 text-sm md:text-base">
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
            <h4 className="text-xs md:text-sm uppercase tracking-wider text-slate-500 font-semibold mb-1">Target Audience</h4>
            <p className="text-slate-200 text-sm leading-relaxed">{data.strategy.targetAudience}</p>
          </div>
          <div>
            <h4 className="text-xs md:text-sm uppercase tracking-wider text-slate-500 font-semibold mb-1">USP</h4>
            <p className="text-slate-200 text-sm leading-relaxed">{data.strategy.usp}</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
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
      <Card 
        title="Ad Copy" 
        icon={<MessageSquare className="h-5 w-5" />} 
        className="lg:col-span-2"
        action={
          <button 
            onClick={handleRegenerateCopy}
            disabled={isRegeneratingCopy}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600/50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRegeneratingCopy ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        }
      >
        <div className={`space-y-4 transition-opacity duration-300 ${isRegeneratingCopy ? 'opacity-50' : 'opacity-100'}`}>
          <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={currentAdCopy.headline} />
            </div>
            <h4 className="text-xs text-slate-500 mb-1">HEADLINE</h4>
            <p className="text-lg md:text-xl font-bold text-white">{currentAdCopy.headline}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CopyButton text={currentAdCopy.hook} />
               </div>
              <h4 className="text-xs text-slate-500 mb-1">HOOK</h4>
              <p className="text-slate-300 italic text-sm">"{currentAdCopy.hook}"</p>
            </div>
             <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700 flex flex-col justify-center">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CopyButton text={currentAdCopy.cta} />
               </div>
              <h4 className="text-xs text-slate-500 mb-1">CTA</h4>
              <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold w-full text-center hover:bg-blue-700 transition-colors text-sm">
                {currentAdCopy.cta}
              </button>
            </div>
          </div>

          <div className="group relative p-3 bg-slate-900 rounded-lg border border-slate-700">
             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <CopyButton text={currentAdCopy.body} />
             </div>
            <h4 className="text-xs text-slate-500 mb-1">BODY TEXT</h4>
            <p className="text-slate-300 text-sm whitespace-pre-line">{currentAdCopy.body}</p>
          </div>
        </div>
      </Card>

      {/* 2.5 Dynamic Ad Variations (DCO) */}
      <Card 
        title="Dynamic Ad Variations (DCO)" 
        icon={<Layers className="h-5 w-5" />} 
        className="lg:col-span-3"
        action={
            adVariations ? (
                <button
                    onClick={handleDownloadVariations}
                    className="flex items-center gap-1.5 text-xs font-medium bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600/50 transition-colors"
                >
                    <Download className="h-3.5 w-3.5" />
                    Save .txt
                </button>
            ) : undefined
        }
      >
        {!adVariations ? (
             <div className="text-center py-6 flex flex-col items-center">
                 <p className="text-slate-400 text-sm mb-4 max-w-2xl">
                     Algorithms like Meta Advantage+ and Google PMax require multiple creative angles to work effectively. 
                     Generate 5 distinct angles: <strong className="text-indigo-400">Pain Point</strong>, <strong className="text-emerald-400">UGC</strong>, <strong className="text-blue-400">Educational</strong>, <strong className="text-pink-400">Contrarian</strong>, and <strong className="text-yellow-400">FOMO</strong>.
                 </p>
                 <button 
                    onClick={handleGenerateAdVariations}
                    disabled={isGeneratingAdVariations}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-emerald-900/20 border border-emerald-500/20"
                 >
                    {isGeneratingAdVariations ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {isGeneratingAdVariations ? "Generating 5 Angles..." : "Generate 5 Optimized Angles"}
                 </button>
             </div>
         ) : (
            <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-700 pb-2 mb-2 gap-2">
                    <p className="text-xs text-slate-400">Optimized for Flexible Ad Formats (Meta Advantage+, PMax)</p>
                    <button 
                        onClick={handleGenerateAdVariations}
                        disabled={isGeneratingAdVariations}
                        className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                    >
                        <RefreshCw className={`h-3 w-3 ${isGeneratingAdVariations ? 'animate-spin' : ''}`} /> Regenerate
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {adVariations.map((variant, idx) => (
                        <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700 hover:border-indigo-500 transition-colors flex flex-col h-full relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={`${variant.headline}\n\n${variant.primaryText}`} />
                            </div>
                            <div className="mb-3">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                                    idx === 0 ? 'bg-indigo-900/20 text-indigo-400 border-indigo-500/20' :
                                    idx === 1 ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' :
                                    idx === 2 ? 'bg-blue-900/20 text-blue-400 border-blue-500/20' :
                                    idx === 3 ? 'bg-pink-900/20 text-pink-400 border-pink-500/20' :
                                    'bg-yellow-900/20 text-yellow-400 border-yellow-500/20'
                                }`}>
                                    {variant.angle}
                                </span>
                            </div>
                            
                            <div className="mb-2">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1 block">Headline</span>
                                <h5 className="font-bold text-white text-sm leading-tight">{variant.headline}</h5>
                            </div>
                            
                            <div className="flex-1 mb-3">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1 block">Primary Text</span>
                                <p className="text-xs text-slate-300 whitespace-pre-line">{variant.primaryText}</p>
                            </div>

                            <div className="mt-auto pt-3 border-t border-slate-800">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1 block">Target Platforms</span>
                                <div className="flex flex-wrap gap-1">
                                    {variant.platforms.map((p, i) => (
                                        <span key={i} className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         )}
      </Card>

      {/* 3. Visual Prompt Card */}
      <Card title="Creative Visuals" icon={<ImageIcon className="h-5 w-5" />} className="lg:col-span-2">
         <div className="space-y-2 h-full flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-slate-400 text-sm">Use this prompt to generate visuals.</p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group">
                        <select
                            value={imageAspectRatio}
                            onChange={(e) => setImageAspectRatio(e.target.value as '1:1' | '16:9' | '9:16')}
                            className="appearance-none bg-slate-900 text-xs font-medium text-slate-300 border border-slate-700 rounded-md pl-3 pr-8 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-slate-800 transition-colors"
                            disabled={isGeneratingImage}
                        >
                            <option value="1:1">Square (1:1)</option>
                            <option value="16:9">Landscape (16:9)</option>
                            <option value="9:16">Portrait (9:16)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
                           <ChevronDown className="h-3 w-3" />
                        </div>
                    </div>

                    {adImage && (
                        <button 
                            onClick={() => {
                                setActiveTab('IMAGE');
                                document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                                handleGenerateVariations();
                            }}
                            disabled={isGeneratingVariations}
                            className="text-xs font-medium flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600/50 transition-colors"
                            title="Generate 3 Variations"
                        >
                            <Grid className={`h-3.5 w-3.5 ${isGeneratingVariations ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Variations</span>
                        </button>
                    )}

                    <button 
                      onClick={() => {
                        setActiveTab('IMAGE');
                        document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                        setAdImage(null); // Clear previous image to force generation
                        handleGenerateImage();
                      }}
                      className="text-xs font-medium flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-md border border-indigo-500/20 transition-all hover:border-indigo-500/40"
                      disabled={isGeneratingImage}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Generate
                    </button>
                </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm text-green-400 overflow-y-auto flex-1 max-h-48 relative group">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CopyButton text={data.creative.imagePrompt} />
               </div>
               {data.creative.imagePrompt}
            </div>
         </div>
      </Card>

      {/* 4. Brand Identity Card */}
      <Card title="Brand Identity" icon={<Hexagon className="h-5 w-5" />} className="lg:col-span-1">
        <div className="flex flex-col h-full justify-between gap-4">
            <div>
                <p className="text-slate-400 text-sm mb-4">
                    Generate a unique brand logo using Imagen 3 based on your campaign strategy.
                </p>
                <div className="space-y-2 mb-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Style Preference</label>
                    <input
                        type="text"
                        value={logoStylePreference}
                        onChange={(e) => setLogoStylePreference(e.target.value)}
                        placeholder="e.g. Minimalist, Geometric, Blue..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none placeholder:text-slate-600"
                    />
                </div>
            </div>
            <div className="flex items-center gap-3">
                 {adLogo && (
                    <div className="h-10 w-10 bg-white rounded-md p-1 border border-slate-600 shadow-sm flex-shrink-0">
                        <img src={adLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                )}
                <button 
                    onClick={() => {
                        setActiveTab('LOGO');
                        document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                        if (adLogo) setAdLogo(null);
                        handleGenerateLogo();
                    }}
                    disabled={isGeneratingLogo}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all shadow-lg ${
                        adLogo 
                        ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-none'
                        : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-900/20'
                    }`}
                >
                    {isGeneratingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGeneratingLogo ? "Generating..." : adLogo ? "Regenerate" : "Generate Logo"}
                </button>
            </div>
        </div>
      </Card>

      {/* 5. Keywords Card */}
      <Card title="Keywords" icon={<Hash className="h-5 w-5" />} className="lg:col-span-1">
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((kw, idx) => (
            <span key={idx} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-md text-xs hover:bg-slate-600 transition-colors cursor-default">
              #{kw}
            </span>
          ))}
        </div>
      </Card>

      {/* 6. Video Script Card */}
      <Card title="Video Script (15s)" icon={<Video className="h-5 w-5" />} className="lg:col-span-2">
         <div className="space-y-2 h-full flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-slate-400 text-sm">AI-generated script for 15s ad.</p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group">
                       <select
                            value={videoAspectRatio}
                            onChange={(e) => setVideoAspectRatio(e.target.value as '16:9' | '9:16')}
                            className="appearance-none bg-slate-900 text-xs font-medium text-slate-300 border border-slate-700 rounded-md pl-3 pr-8 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-slate-800 transition-colors"
                            disabled={isGeneratingVideo}
                        >
                            <option value="16:9">Landscape (16:9)</option>
                            <option value="9:16">Portrait (9:16)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
                           <ChevronDown className="h-3 w-3" />
                        </div>
                   </div>

                   {adVideo && (
                     <button 
                       onClick={async () => {
                         setActiveTab('VIDEO');
                         document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                         setAdVideo(null);
                         await handleGenerateVideo();
                       }}
                       disabled={isGeneratingVideo}
                       className="text-xs font-medium flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600/50 transition-colors"
                       title="Regenerate Video"
                     >
                       <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingVideo ? 'animate-spin' : ''}`} />
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
                      className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all ${
                        adVideo 
                        ? 'bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border-indigo-500/30'
                        : 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/40'
                      }`}
                    >
                      {adVideo ? <Play className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />} 
                      {adVideo ? "View Video" : "Generate Video"}
                    </button>
                </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-lg border border-slate-700 text-slate-300 text-sm font-mono whitespace-pre-wrap relative group flex-1">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <CopyButton text={data.creative.videoScript} />
                 </div>
                {data.creative.videoScript}
            </div>
            {/* Customizable Video CTA */}
            <div className="mt-4 pt-3 border-t border-slate-700">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <Edit2 className="h-3 w-3" /> Customize Video CTA Button
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={videoCta}
                        onChange={(e) => setVideoCta(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Watch Now"
                    />
                </div>
            </div>
         </div>
      </Card>

      {/* 7. Social Media Adaptations (NEW) */}
      <Card 
        title="Social Media Adaptations" 
        icon={<Share2 className="h-5 w-5" />} 
        className="lg:col-span-3"
        action={
          socialPrompts ? (
            <button 
              onClick={handleGenerateSocial}
              disabled={isGeneratingSocial}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600/50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingSocial ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          ) : undefined
        }
      >
         {!socialPrompts ? (
             <div className="text-center py-6 flex flex-col items-center">
                 <p className="text-slate-400 text-sm mb-4 max-w-lg">
                     Generate tailored creative directions for Instagram Stories, TikTok, and YouTube Shorts based on your campaign assets.
                 </p>
                 <button 
                    onClick={handleGenerateSocial}
                    disabled={isGeneratingSocial}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-purple-900/20"
                 >
                    {isGeneratingSocial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGeneratingSocial ? "Adapting Content..." : "Generate Social Variants"}
                 </button>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                 {/* Instagram */}
                 <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 flex flex-col h-full">
                     <div className="flex items-center gap-2 mb-3 text-pink-400 font-semibold border-b border-slate-800 pb-2">
                         <Instagram className="h-4 w-4" />
                         <span>Instagram Story</span>
                     </div>
                     <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                         {socialPrompts.instagramStory}
                     </div>
                     <div className="flex justify-end mt-3 pt-2 border-t border-slate-800">
                         <CopyButton text={socialPrompts.instagramStory} />
                     </div>
                 </div>

                 {/* TikTok */}
                 <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 flex flex-col h-full">
                     <div className="flex items-center gap-2 mb-3 text-cyan-400 font-semibold border-b border-slate-800 pb-2">
                         <Music2 className="h-4 w-4" />
                         <span>TikTok</span>
                     </div>
                     <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                         {socialPrompts.tikTok}
                     </div>
                     <div className="flex justify-end mt-3 pt-2 border-t border-slate-800">
                         <CopyButton text={socialPrompts.tikTok} />
                     </div>
                 </div>

                 {/* YouTube */}
                 <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 flex flex-col h-full">
                     <div className="flex items-center gap-2 mb-3 text-red-500 font-semibold border-b border-slate-800 pb-2">
                         <Youtube className="h-4 w-4" />
                         <span>YouTube Short</span>
                     </div>
                     <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                         {socialPrompts.youTubeShort}
                     </div>
                     <div className="flex justify-end mt-3 pt-2 border-t border-slate-800">
                         <CopyButton text={socialPrompts.youTubeShort} />
                     </div>
                 </div>
             </div>
         )}
      </Card>

      {/* 8. Live Ad Preview */}
      <div id="live-preview" className="lg:col-span-3 mt-6 border-t border-slate-700 pt-8">
        <div className="flex flex-col items-center justify-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <Layout className="h-6 w-6 text-indigo-400" />
                Live Ad Preview
            </h2>
            
            {/* Centered Toggle Switch */}
            <div className="bg-slate-900 p-1.5 rounded-xl flex border border-slate-700 shadow-inner overflow-x-auto max-w-full">
               <button 
                  onClick={() => setActiveTab('IMAGE')}
                  className={`px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
                  className={`px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
                  className={`px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
        
        <div className="flex flex-col md:flex-row gap-8 justify-center items-start bg-slate-800/50 p-4 md:p-8 rounded-xl border border-slate-700 relative">
            
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

            {/* Mockup Column */}
            <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
                {/* Mockup Container - Facebook Style */}
                <div className="w-full bg-white text-slate-900 rounded-lg overflow-hidden shadow-2xl font-sans ring-1 ring-black/5 relative">
                    
                    {/* View Toggle Button inside the preview */}
                    {(activeTab === 'IMAGE' || activeTab === 'VIDEO') && (
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab(activeTab === 'IMAGE' ? 'VIDEO' : 'IMAGE')}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-full backdrop-blur-md border border-white/10 shadow-xl transition-all hover:scale-105"
                        >
                            {activeTab === 'IMAGE' ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                            <span>{activeTab === 'IMAGE' ? "Switch to Video" : "Switch to Image"}</span>
                        </button>
                    </div>
                    )}

                    {/* Header */}
                    <div className="p-3 flex items-center gap-2 border-b border-gray-100 bg-white relative z-10">
                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                        {adLogo ? <img src={adLogo} className="w-full h-full object-cover" alt="Brand" /> : "A"}
                        </div>
                        <div>
                            <p className="font-semibold text-sm leading-tight">AdGen Master</p>
                            <p className="text-xs text-gray-500">Sponsored • <span className="hover:underline cursor-pointer">Learn More</span></p>
                        </div>
                    </div>
                    {/* Body */}
                    <div className="p-3 pb-2 bg-white relative z-10">
                        <p className="text-sm text-gray-800 whitespace-pre-line leading-snug">{currentAdCopy.body}</p>
                    </div>
                    
                    {/* Creative Area */}
                    <div className="w-full aspect-square bg-slate-100 relative flex items-center justify-center overflow-hidden group/media">
                        
                        {/* Overlay Buttons (Regenerate/Delete) */}
                        {((activeTab === 'IMAGE' && adImage) || (activeTab === 'VIDEO' && adVideo) || (activeTab === 'LOGO' && adLogo)) && (
                            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/media:opacity-100 transition-all duration-200 transform translate-y-2 group-hover/media:translate-y-0 flex gap-2">
                                <button 
                                    onClick={() => {
                                        if (activeTab === 'VIDEO') handleResetVideo();
                                        else if (activeTab === 'IMAGE') handleResetImage();
                                        else if (activeTab === 'LOGO') handleResetLogo();
                                    }}
                                    className="p-2 bg-black/60 hover:bg-red-600/80 backdrop-blur-sm text-white rounded-full shadow-lg transition-all hover:scale-105 border border-white/10"
                                    title="Reset"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                
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
                                                <ImageIcon className="h-3 w-3" /> Sq
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
                                <div className="text-center p-6 text-gray-400 flex flex-col items-center w-full">
                                    <Hexagon className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-[10px] uppercase tracking-wide font-medium mb-2">Powered by Imagen 3</p>
                                    
                                    {!isGeneratingLogo ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-xs text-slate-400">Configure in Brand Identity card</p>
                                            <button 
                                                onClick={() => document.querySelector('.bg-slate-800 [title="Brand Identity"]')?.scrollIntoView({behavior: 'smooth', block: 'center'})}
                                                className="text-pink-600 hover:text-pink-500 text-xs font-bold underline"
                                            >
                                                Go to Config
                                            </button>
                                        </div>
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

                    {/* Footer / CTA Bar */}
                    {(activeTab === 'IMAGE' || activeTab === 'VIDEO') && (
                        <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between relative z-10">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-xs font-bold text-slate-800 truncate">{currentAdCopy.headline}</p>
                                <p className="text-[10px] text-slate-500 truncate">{data.strategy.usp}</p>
                            </div>
                            <button className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-md font-bold text-xs transition-colors border border-slate-300">
                                {activeTab === 'VIDEO' ? videoCta : currentAdCopy.cta}
                            </button>
                        </div>
                    )}
                </div>

                {/* VARIATIONS PANEL (Only in IMAGE mode and when main image is present) */}
                {activeTab === 'IMAGE' && adImage && (
                  <div className="w-full bg-slate-800 rounded-lg p-3 border border-slate-700 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                              <Grid className="h-3 w-3" /> Variations (Imagen)
                          </h4>
                          {!isGeneratingVariations && (
                            <button 
                                onClick={handleGenerateVariations}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 px-2 py-1 rounded transition-colors"
                            >
                                Generate 3 Variations
                            </button>
                          )}
                      </div>

                      {isGeneratingVariations ? (
                          <div className="h-16 flex items-center justify-center gap-2 text-indigo-400">
                             <Loader2 className="h-4 w-4 animate-spin" />
                             <span className="text-xs">Creating variations...</span>
                          </div>
                      ) : imageVariations.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                              {imageVariations.map((varImg, idx) => (
                                  <div 
                                    key={idx} 
                                    className="aspect-square bg-slate-900 rounded-md overflow-hidden border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all hover:scale-105 group relative"
                                    onClick={() => setAdImage(varImg)}
                                  >
                                      <img src={varImg} alt={`Var ${idx+1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <p className="text-[10px] text-white font-bold">Select</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="h-16 flex items-center justify-center text-slate-600 text-xs border border-dashed border-slate-700 rounded">
                              No variations yet
                          </div>
                      )}
                  </div>
                )}
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
                              {isDownloading ? 'Bundling Zip...' : 'Download All Assets (ZIP)'}
                          </button>
                          
                          <button 
                            onClick={handleExportJson}
                            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg transition-colors font-medium text-sm"
                          >
                              <FileJson className="h-4 w-4" />
                              Export Data (JSON)
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
      );
    };