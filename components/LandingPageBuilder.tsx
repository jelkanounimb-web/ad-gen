
import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Type, Image as ImageIcon, CheckCircle2, AlertTriangle, 
  MessageSquare, HelpCircle, CreditCard, Monitor, Smartphone, 
  Sparkles, Wand2, Play, Settings,
  Palette, Share2, Layers, Eye, Edit3, Globe, GripVertical, Download,
  ChevronUp, ChevronDown, Plus, Trash2
} from 'lucide-react';
import { LandingPageContent, TargetLanguage } from '../types';

// --- Types & Interfaces ---

interface SectionConfig {
  hero: { headline: string; subheadline: string; cta: string; videoKeyword: string };
  trust: { title: string; logos: string[] };
  problem: { title: string; items: { title: string; desc: string }[] };
  solution: { title: string; items: { title: string; desc: string }[] };
  testimonials: { title: string; items: { name: string; role: string; text: string }[] };
  pricing: { title: string; price: string; period: string; features: string[]; cta: string };
  faq: { title: string; items: { question: string; answer: string }[] };
}

type SectionKey = keyof SectionConfig;

interface PageConfig {
  theme: 'DARK' | 'LIGHT';
  accentColor: string;
  content: SectionConfig;
}

// --- Mock AI Logic Engine ---

const MOCK_AI_TEMPLATES = {
  trustLogos: ["Nebula", "Vertex", "Quantum", "Echo", "Sphere"],
  painPoints: [
    { title: "Wasting Time", desc: "Stop spending hours on manual tasks that should be automated." },
    { title: "Poor Results", desc: "Tired of strategies that don't deliver the ROI you deserve?" },
    { title: "Complexity", desc: "Overwhelmed by complicated tools that require a PhD to use." }
  ],
  benefits: [
    { title: "Instant Speed", desc: "Get results in seconds, not days. Built for speed." },
    { title: "AI Precision", desc: "Leverage machine learning to eliminate human error." },
    { title: "Scale Effortlessly", desc: "Grow without breaking your existing workflow." }
  ],
  testimonials: [
    { name: "Alex R.", role: "Founder", text: "I was skeptical at first, but this solution completely transformed our business." },
    { name: "Sarah J.", role: "Product Lead", text: "The best investment we made this year. Simply incredible results." },
    { name: "Mike T.", role: "Developer", text: "Finally, a tool that actually does what it promises. Highly recommended." }
  ]
};

const generateMockContent = (description: string, language: TargetLanguage = 'English'): SectionConfig => {
  const keywords = description.split(' ');
  const subject = description.length > 5 ? description : "Your Product";
  const shortSubject = keywords.slice(0, 3).join(' ');

  // Simple heuristic for video background
  const videoKeyword = keywords.find(w => w.length > 5) || "technology";

  // Basic Localization for Mock Content (Ideally this would be an API call for perfect translation)
  const isFrench = language === 'Français';
  const isArabic = language === 'العربية' || language === 'Darija (Morocco)';

  if (isFrench) {
      return {
        hero: {
          headline: `La Solution Ultime pour ${shortSubject}`,
          subheadline: `Arrêtez de lutter avec ${shortSubject}. Libérez tout le potentiel de votre flux de travail grâce à notre plateforme IA conçue pour les résultats.`,
          cta: "Commencer Gratuitement",
          videoKeyword: videoKeyword
        },
        trust: { title: "Ils nous font confiance", logos: MOCK_AI_TEMPLATES.trustLogos },
        problem: { title: "Est-ce que cela vous arrive ?", items: [
            { title: "Perte de Temps", desc: "Arrêtez de passer des heures sur des tâches manuelles." },
            { title: "Faibles Résultats", desc: "Fatigué des stratégies qui ne rapportent pas ?" }
        ]},
        solution: { title: "Tout ce dont vous avez besoin", items: [
            { title: "Vitesse Instantanée", desc: "Des résultats en quelques secondes, pas en jours." },
            { title: "Précision IA", desc: "Tirez parti du machine learning." }
        ]},
        testimonials: { title: "Aimé par les Innovateurs", items: [
            { name: "Pierre D.", role: "Fondateur", text: "J'étais sceptique au début, mais cette solution a transformé notre business." },
            { name: "Sophie M.", role: "Directrice", text: "Le meilleur investissement de l'année." }
        ]},
        pricing: { title: "Tarification Simple", price: "29€", period: "/mois", features: ["Accès Illimité", "Fonctionnalités IA", "Support Prioritaire"], cta: "Essayer" },
        faq: { title: "Questions Fréquentes", items: [{ question: "Y a-t-il un essai gratuit ?", answer: "Oui, commencez avec 14 jours gratuits." }] }
      };
  }

  if (isArabic) {
      return {
        hero: {
          headline: `الحل الأمثل لـ ${shortSubject}`,
          subheadline: `توقف عن المعاناة مع ${shortSubject}. أطلق العنان لإمكاناتك الكاملة مع منصتنا المدعومة بالذكاء الاصطناعي.`,
          cta: "ابدأ مجاناً",
          videoKeyword: videoKeyword
        },
        trust: { title: "شركات تثق بنا", logos: MOCK_AI_TEMPLATES.trustLogos },
        problem: { title: "هل تواجه هذه المشاكل؟", items: [
            { title: "إضاعة الوقت", desc: "توقف عن قضاء ساعات في المهام اليدوية." },
            { title: "نتائج ضعيفة", desc: "تعبت من الاستراتيجيات التي لا تحقق عائداً؟" }
        ]},
        solution: { title: "كل ما تحتاجه للنجاح", items: [
            { title: "سرعة فورية", desc: "احصل على نتائج في ثوانٍ." },
            { title: "دقة الذكاء الاصطناعي", desc: "استفد من التعلم الآلي للقضاء على الأخطاء." }
        ]},
        testimonials: { title: "آراء العملاء", items: [
            { name: "أحمد م.", role: "مؤسس", text: "كنت متشككًا في البداية، لكن هذا الحل غيّر عملنا تمامًا." },
            { name: "سارة ع.", role: "مديرة منتج", text: "أفضل استثمار قمنا به هذا العام." }
        ]},
        pricing: { title: "باقات بسيطة", price: "29$", period: "/شهر", features: ["وصول غير محدود", "ميزات الذكاء الاصطناعي", "دعم ذو أولوية"], cta: "اشترك الآن" },
        faq: { title: "أسئلة شائعة", items: [{ question: "هل توجد فترة تجريبية؟", answer: "نعم، ابدأ بتجربة مجانية لمدة 14 يومًا." }] }
      };
  }

  // Default English
  return {
    hero: {
      headline: `The Ultimate Solution to ${shortSubject}`,
      subheadline: `Stop struggling with ${shortSubject}. Unlock the full potential of your workflow with our AI-driven platform designed for results.`,
      cta: "Get Started Free",
      videoKeyword: videoKeyword
    },
    trust: {
      title: "Trusted by forward-thinking companies",
      logos: MOCK_AI_TEMPLATES.trustLogos
    },
    problem: {
      title: "Is this happening to you?",
      items: MOCK_AI_TEMPLATES.painPoints
    },
    solution: {
      title: "Everything you need to succeed",
      items: MOCK_AI_TEMPLATES.benefits
    },
    testimonials: {
      title: "Loved by Innovators",
      items: MOCK_AI_TEMPLATES.testimonials
    },
    pricing: {
      title: "Simple Pricing",
      price: "$29",
      period: "/mo",
      features: ["Unlimited Access", "AI Features", "Priority Support", "Analytics Dashboard"],
      cta: "Start Trial"
    },
    faq: {
      title: "Freqently Asked Questions",
      items: [
        { question: "Is there a free trial?", answer: "Yes, start with our 14-day free trial." },
        { question: "Can I cancel anytime?", answer: "Absolutely. No hidden fees or lock-in contracts." }
      ]
    }
  };
};

// --- Components ---

const AccordionItem: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode 
}> = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="border border-white/10 rounded-lg bg-slate-900/50 mb-3 overflow-hidden transition-all">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${isOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
          {icon}
        </div>
        <span className="font-semibold text-slate-200 text-sm">{title}</span>
      </div>
      {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
    </button>
    {isOpen && <div className="p-4 border-t border-white/10 bg-black/20 space-y-4">{children}</div>}
  </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; multiline?: boolean }> = ({ label, value, onChange, multiline }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
    {multiline ? (
      <textarea 
        className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input 
        type="text"
        className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

// --- Main Builder Component ---

interface LandingPageBuilderProps {
  generatedContent?: LandingPageContent | null;
}

export const LandingPageBuilder: React.FC<LandingPageBuilderProps> = ({ generatedContent }) => {
  const [magicInput, setMagicInput] = useState("");
  const [language, setLanguage] = useState<TargetLanguage>('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'MAGIC' | 'EDIT' | 'STRUCTURE'>('MAGIC');
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [openSection, setOpenSection] = useState<string | null>('hero');
  
  // Mobile View State: 'EDITOR' shows controls, 'PREVIEW' shows the page
  const [mobileView, setMobileView] = useState<'EDITOR' | 'PREVIEW'>('EDITOR');

  const [config, setConfig] = useState<PageConfig>({
    theme: 'DARK',
    accentColor: '#6366f1', // Indigo 500
    content: {
      hero: {
        headline: "Your Value Proposition Goes Here",
        subheadline: "Explain the main benefit of your product in a clear, concise way. Convince the user to click below.",
        cta: "Get Started",
        videoKeyword: "technology"
      },
      trust: { title: "Trusted by", logos: ["Logo 1", "Logo 2", "Logo 3"] },
      problem: { title: "The Problem", items: [{title: "Pain Point 1", desc: "Description"}, {title: "Pain Point 2", desc: "Description"}] },
      solution: { title: "The Solution", items: [{title: "Benefit 1", desc: "Description"}, {title: "Benefit 2", desc: "Description"}] },
      testimonials: { title: "Testimonials", items: [{name: "User", role: "Role", text: "Feedback"}] },
      pricing: { title: "Pricing", price: "$49", period: "/mo", features: ["Feature A", "Feature B"], cta: "Buy Now" },
      faq: { title: "FAQ", items: [{question: "Question?", answer: "Answer."}] }
    }
  });

  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>([
    'hero', 'trust', 'problem', 'solution', 'testimonials', 'pricing', 'faq'
  ]);

  // Drag and Drop Logic
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    // Create deep copy
    const _sectionOrder = [...sectionOrder];
    // Remove and save the dragged item content
    const draggedItemContent = _sectionOrder.splice(dragItem.current, 1)[0];
    // Switch the position
    _sectionOrder.splice(dragOverItem.current, 0, draggedItemContent);
    // Reset references
    dragItem.current = null;
    dragOverItem.current = null;
    // Update state
    setSectionOrder(_sectionOrder);
  };

  // Hydrate from real AI if available
  useEffect(() => {
    if (generatedContent) {
      // Try to derive a meaningful keyword from the headline for the video background
      const derivedKeyword = generatedContent.hero.headline.split(' ').sort((a,b) => b.length - a.length)[0] || 'business';
      
      // Map the generic LandingPageContent to our specific UI config
      setConfig(prev => ({
        ...prev,
        content: {
          ...prev.content,
          hero: { 
            ...prev.content.hero, 
            headline: generatedContent.hero.headline, 
            subheadline: generatedContent.hero.subheadline, 
            cta: generatedContent.hero.cta, 
            videoKeyword: derivedKeyword
          },
          solution: { ...prev.content.solution, items: generatedContent.solution.items },
          problem: { ...prev.content.problem, items: generatedContent.problem.items },
          testimonials: { ...prev.content.testimonials, items: generatedContent.socialProof.testimonials },
          pricing: { ...prev.content.pricing, ...generatedContent.pricing }
        }
      }));
      setActiveTab('EDIT');
    }
  }, [generatedContent]);

  const handleMagicGenerate = () => {
    if (!magicInput.trim()) return;
    setIsGenerating(true);
    
    // Simulate AI thinking time
    setTimeout(() => {
      const generated = generateMockContent(magicInput, language);
      setConfig(prev => ({ ...prev, content: generated }));
      setIsGenerating(false);
      setActiveTab('EDIT'); // Switch to edit view to show results
      if (window.innerWidth < 1024) {
          setMobileView('PREVIEW'); // Auto switch to preview on mobile
      }
    }, 1200);
  };

  const updateContent = (section: keyof SectionConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: { ...prev.content[section], [field]: value }
      }
    }));
  };

  const updateTestimonial = (index: number, field: keyof typeof config.content.testimonials.items[0], value: string) => {
    setConfig(prev => {
        const newItems = [...prev.content.testimonials.items];
        newItems[index] = { ...newItems[index], [field]: value };
        return {
            ...prev,
            content: {
                ...prev.content,
                testimonials: {
                    ...prev.content.testimonials,
                    items: newItems
                }
            }
        };
    });
  };

  const addTestimonial = () => {
    setConfig(prev => ({
        ...prev,
        content: {
            ...prev.content,
            testimonials: {
                ...prev.content.testimonials,
                items: [...prev.content.testimonials.items, { name: "New User", role: "Customer", text: "This product is amazing!" }]
            }
        }
    }));
  };

  const removeTestimonial = (index: number) => {
    setConfig(prev => {
        const newItems = prev.content.testimonials.items.filter((_, i) => i !== index);
        return {
            ...prev,
            content: {
                ...prev.content,
                testimonials: {
                    ...prev.content.testimonials,
                    items: newItems
                }
            }
        };
    });
  };

  const isRTL = language === 'العربية' || language === 'Darija (Morocco)';

  // Helper to get Icon for section
  const getSectionIcon = (key: SectionKey) => {
    switch(key) {
        case 'hero': return <Type className="h-4 w-4" />;
        case 'trust': return <CheckCircle2 className="h-4 w-4" />;
        case 'problem': return <AlertTriangle className="h-4 w-4" />;
        case 'solution': return <Sparkles className="h-4 w-4" />;
        case 'testimonials': return <MessageSquare className="h-4 w-4" />;
        case 'pricing': return <CreditCard className="h-4 w-4" />;
        case 'faq': return <HelpCircle className="h-4 w-4" />;
        default: return <Layout className="h-4 w-4" />;
    }
  };

  const getSectionLabel = (key: SectionKey) => {
      switch(key) {
          case 'hero': return 'Hero Section';
          case 'trust': return 'Trust Bar';
          case 'problem': return 'Problem / Pain';
          case 'solution': return 'Features & Solution';
          case 'testimonials': return 'Testimonials';
          case 'pricing': return 'Pricing';
          case 'faq': return 'FAQ';
          default: return key;
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      
      {/* --- LEFT SIDEBAR (Controls) --- */}
      {/* On Mobile: Only show if mobileView is EDITOR */}
      <div className={`
        lg:w-[400px] w-full flex flex-col border-r border-white/10 bg-slate-900/95 backdrop-blur-xl z-20 flex-shrink-0 transition-all absolute inset-0 lg:static
        ${mobileView === 'EDITOR' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Sidebar Header */}
        <div className="p-4 lg:p-5 border-b border-white/10">
          <h2 className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            <Layout className="h-5 w-5 text-indigo-400" />
            AI Page Builder
          </h2>
          <div className="flex bg-slate-800 p-1 rounded-lg mt-4 border border-white/5">
            <button 
              onClick={() => setActiveTab('MAGIC')}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'MAGIC' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Wand2 className="h-3 w-3" /> Magic
            </button>
            <button 
              onClick={() => setActiveTab('EDIT')}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'EDIT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Settings className="h-3 w-3" /> Editor
            </button>
            <button 
              onClick={() => setActiveTab('STRUCTURE')}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'STRUCTURE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="h-3 w-3" /> Structure
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5 custom-scrollbar pb-24 lg:pb-5">
          
          {activeTab === 'MAGIC' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 shadow-inner">
                <label className="block text-sm font-semibold text-indigo-200 mb-2">Describe your product</label>
                <textarea
                  className="w-full bg-slate-950/80 border border-indigo-500/30 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner"
                  rows={5}
                  placeholder={isRTL ? "صِف منتجك..." : "e.g. A mobile app that helps people learn..."}
                  value={magicInput}
                  onChange={(e) => setMagicInput(e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                
                {/* Language Selector in Magic Input */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Target Language
                  </label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as TargetLanguage)}
                    className="w-full bg-slate-950/80 border border-indigo-500/30 rounded-lg p-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                      <option value="English">English</option>
                      <option value="Français">Français</option>
                      <option value="العربية">العربية</option>
                      <option value="Darija (Morocco)">Darija (Morocco)</option>
                  </select>
                </div>

                <button
                  onClick={handleMagicGenerate}
                  disabled={isGenerating || !magicInput}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin" /> {isRTL ? 'جاري التوليد...' : 'Generating...'}</span>
                  ) : (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" /> {isRTL ? 'إنشاء الصفحة' : 'Generate Page'}</span>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-500 space-y-2 px-2">
                <p className="font-bold text-slate-400 uppercase tracking-wide">How it works</p>
                <p>1. Enter a product description.</p>
                <p>2. Our AI engine builds the copy, structure, and selects visuals.</p>
                <p>3. Edit manually to refine the result.</p>
              </div>
            </div>
          )}

          {activeTab === 'EDIT' && (
            <div className="space-y-2 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
              {sectionOrder.map((key) => {
                  switch(key) {
                      case 'hero':
                        return (
                            <AccordionItem key={key} title="Hero Section" icon={<Type />} isOpen={openSection === 'hero'} onToggle={() => setOpenSection(openSection === 'hero' ? null : 'hero')}>
                                <InputField label="Headline" value={config.content.hero.headline} onChange={(v) => updateContent('hero', 'headline', v)} multiline />
                                <InputField label="Subheadline" value={config.content.hero.subheadline} onChange={(v) => updateContent('hero', 'subheadline', v)} multiline />
                                <InputField label="CTA Button" value={config.content.hero.cta} onChange={(v) => updateContent('hero', 'cta', v)} />
                                <InputField label="Background Video Keyword" value={config.content.hero.videoKeyword} onChange={(v) => updateContent('hero', 'videoKeyword', v)} />
                            </AccordionItem>
                        );
                      case 'trust':
                        return (
                             <AccordionItem key={key} title="Trust Bar" icon={<CheckCircle2 />} isOpen={openSection === 'trust'} onToggle={() => setOpenSection(openSection === 'trust' ? null : 'trust')}>
                                <InputField label="Section Title" value={config.content.trust.title} onChange={(v) => updateContent('trust', 'title', v)} />
                                <div className="text-xs text-slate-500 italic mt-2">Logos are managed automatically in mock mode.</div>
                            </AccordionItem>
                        );
                      case 'problem':
                        return (
                            <AccordionItem key={key} title="Problem / Pain" icon={<AlertTriangle />} isOpen={openSection === 'problem'} onToggle={() => setOpenSection(openSection === 'problem' ? null : 'problem')}>
                                <InputField label="Section Title" value={config.content.problem.title} onChange={(v) => updateContent('problem', 'title', v)} />
                            </AccordionItem>
                        );
                      case 'solution':
                        return (
                             <AccordionItem key={key} title="Features & Benefits" icon={<Sparkles />} isOpen={openSection === 'solution'} onToggle={() => setOpenSection(openSection === 'solution' ? null : 'solution')}>
                                <InputField label="Section Title" value={config.content.solution.title} onChange={(v) => updateContent('solution', 'title', v)} />
                            </AccordionItem>
                        );
                      case 'testimonials':
                        return (
                            <AccordionItem key={key} title="Social Proof" icon={<MessageSquare />} isOpen={openSection === 'testimonials'} onToggle={() => setOpenSection(openSection === 'testimonials' ? null : 'testimonials')}>
                                <InputField label="Section Title" value={config.content.testimonials.title} onChange={(v) => updateContent('testimonials', 'title', v)} />
                                <div className="space-y-4 mt-4">
                                    {config.content.testimonials.items.map((item, index) => (
                                        <div key={index} className="bg-slate-950/50 p-3 rounded-lg border border-white/5 relative group">
                                            <button 
                                                onClick={() => removeTestimonial(index)}
                                                className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <InputField label="Name" value={item.name} onChange={(v) => updateTestimonial(index, 'name', v)} />
                                                <InputField label="Role" value={item.role} onChange={(v) => updateTestimonial(index, 'role', v)} />
                                            </div>
                                            <InputField label="Quote" value={item.text} onChange={(v) => updateTestimonial(index, 'text', v)} multiline />
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={addTestimonial}
                                    className="w-full mt-2 py-2 border border-dashed border-slate-600 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-3 w-3" /> Add Testimonial
                                </button>
                            </AccordionItem>
                        );
                      case 'pricing':
                        return (
                            <AccordionItem key={key} title="Pricing" icon={<CreditCard />} isOpen={openSection === 'pricing'} onToggle={() => setOpenSection(openSection === 'pricing' ? null : 'pricing')}>
                                <div className="grid grid-cols-2 gap-2">
                                <InputField label="Price" value={config.content.pricing.price} onChange={(v) => updateContent('pricing', 'price', v)} />
                                <InputField label="Period" value={config.content.pricing.period} onChange={(v) => updateContent('pricing', 'period', v)} />
                                </div>
                                <InputField label="CTA Button" value={config.content.pricing.cta} onChange={(v) => updateContent('pricing', 'cta', v)} />
                            </AccordionItem>
                        );
                      case 'faq':
                        return (
                             <AccordionItem key={key} title="FAQ" icon={<HelpCircle />} isOpen={openSection === 'faq'} onToggle={() => setOpenSection(openSection === 'faq' ? null : 'faq')}>
                                <InputField label="Section Title" value={config.content.faq.title} onChange={(v) => updateContent('faq', 'title', v)} />
                            </AccordionItem>
                        );
                      default: return null;
                  }
              })}
            </div>
          )}

          {activeTab === 'STRUCTURE' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300">
                    <p>Drag and drop items to reorder the sections on your landing page.</p>
                </div>
                <div className="space-y-2">
                    {sectionOrder.map((key, index) => (
                        <div 
                            key={key}
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-move hover:border-indigo-500 hover:bg-slate-800/80 transition-colors group"
                        >
                            <GripVertical className="h-5 w-5 text-slate-500 group-hover:text-indigo-400" />
                            <div className={`p-2 rounded-md bg-slate-900 text-slate-400`}>
                                {getSectionIcon(key)}
                            </div>
                            <span className="font-semibold text-slate-300 text-sm">{getSectionLabel(key)}</span>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT PREVIEW (70% Desktop / 100% Mobile) --- */}
      <div className={`
        flex-1 bg-black relative flex flex-col transition-all lg:static absolute inset-0
        ${mobileView === 'PREVIEW' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Preview Toolbar */}
        <div className="h-14 bg-slate-900 border-b border-white/10 flex items-center justify-between px-4 lg:px-6 z-10 shrink-0">
          <div className="flex items-center gap-2">
             {/* Hidden on Mobile as we handle resizing differently */}
            <div className="hidden lg:flex items-center gap-2">
              <button 
                onClick={() => setPreviewDevice('DESKTOP')}
                className={`p-2 rounded-md transition-colors ${previewDevice === 'DESKTOP' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}
              >
                <Monitor className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setPreviewDevice('MOBILE')}
                className={`p-2 rounded-md transition-colors ${previewDevice === 'MOBILE' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}
              >
                <Smartphone className="h-5 w-5" />
              </button>
            </div>
            {/* Mobile Title */}
             <span className="lg:hidden text-sm font-bold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-400" /> Live Preview
             </span>
          </div>
          <div className="flex items-center gap-3">
             <button className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors">
               <Share2 className="h-3.5 w-3.5" /> Share
             </button>
             <button className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full transition-colors shadow-lg shadow-indigo-500/20">
               <Download className="h-3.5 w-3.5" /> Export
             </button>
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 lg:p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-950 flex justify-center pb-24 lg:pb-8">
          <div 
            className={`transition-all duration-500 ease-in-out bg-slate-950 shadow-2xl relative ${
              previewDevice === 'MOBILE' 
                ? 'w-full h-full lg:w-[375px] lg:h-[812px] lg:rounded-3xl lg:border-[8px] lg:border-slate-800 overflow-y-auto overflow-x-hidden' 
                : 'w-full max-w-6xl rounded-none lg:rounded-xl border-x-0 lg:border border-white/5 min-h-screen'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* --- LANDING PAGE CONTENT START --- */}
            
            {sectionOrder.map(key => {
                switch(key) {
                    case 'hero':
                        return (
                            <section key="hero" className="relative pt-20 pb-20 md:pt-24 md:pb-32 px-6 overflow-hidden">
                                {/* Background Gradients */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none" />

                                <div className="max-w-4xl mx-auto text-center relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
                                        <Sparkles className="h-3 w-3" /> AI Powered Beta
                                    </div>
                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                                        {config.content.hero.headline}
                                    </h1>
                                    <p className="text-base md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                        {config.content.hero.subheadline}
                                    </p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                                        <button className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                        {config.content.hero.cta}
                                        </button>
                                        <button className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold hover:bg-white/10 transition-colors backdrop-blur-md">
                                        {language === 'Français' ? 'Voir Demo' : language === 'العربية' ? 'شاهد العرض' : 'Watch Demo'}
                                        </button>
                                    </div>

                                    {/* AI VIDEO SIMULATION */}
                                    <div className="relative w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer bg-slate-900 mt-12">
                                        <img 
                                            src={`https://source.unsplash.com/1600x900/?${encodeURIComponent(config.content.hero.videoKeyword || 'technology')}`} 
                                            alt="AI Video Background" 
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 scale-105 group-hover:scale-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-90" />
                                        
                                        {/* Center Play Button */}
                                        <div className="absolute inset-0 flex items-center justify-center z-20">
                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_40px_rgba(99,102,241,0.5)] group-hover:bg-white/20">
                                                <Play className="h-8 w-8 md:h-10 md:w-10 text-white fill-white ml-1.5 drop-shadow-md" />
                                            </div>
                                        </div>

                                        {/* Top Left Badge */}
                                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 z-20 shadow-lg">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wide">AI Video Generated</span>
                                        </div>
                                        
                                        {/* Bottom Controls */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-gradient-to-t from-black/80 to-transparent" dir="ltr">
                                            <Play className="h-5 w-5 text-white fill-white flex-shrink-0" />
                                            <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                                <div className="h-full w-[35%] bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full relative">
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm" />
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-white/90 font-medium">00:12 / 00:45</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    case 'trust':
                        return (
                            <section key="trust" className="py-10 border-y border-white/5 bg-white/[0.02]">
                                <div className="max-w-6xl mx-auto px-6 text-center">
                                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-widest mb-8">{config.content.trust.title}</p>
                                    <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                                        {config.content.trust.logos.map((logo, i) => (
                                        <h3 key={i} className="text-xl md:text-2xl font-black text-white">{logo}</h3>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );
                    case 'problem':
                        return (
                            <section key="problem" className="py-16 md:py-24 px-6 relative">
                                <div className="max-w-6xl mx-auto">
                                    <div className="text-center mb-12 md:mb-16">
                                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">{config.content.problem.title}</h2>
                                        <div className="h-1 w-20 bg-red-500 mx-auto rounded-full" />
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        {config.content.problem.items.map((item, i) => (
                                            <div key={i} className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-1">
                                            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-6 text-red-400">
                                                <AlertTriangle className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );
                    case 'solution':
                        return (
                            <section key="solution" className="py-16 md:py-24 px-6 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-white/5">
                                <div className="max-w-6xl mx-auto">
                                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 md:mb-16 gap-8 text-center md:text-left">
                                        <h2 className="text-3xl md:text-5xl font-bold text-white max-w-lg">{config.content.solution.title}</h2>
                                        <button className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-bold">
                                            {language === 'Français' ? 'Explorer' : language === 'العربية' ? 'اكتشف المزيد' : 'Explore All Features'}
                                        </button>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {config.content.solution.items.map((item, i) => (
                                            <div key={i} className="p-6 md:p-8 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 flex flex-col md:flex-row gap-6 hover:border-indigo-500/30 transition-colors">
                                            <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                                                <CheckCircle2 className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                                <p className="text-slate-400 text-sm md:text-base">{item.desc}</p>
                                            </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );
                    case 'testimonials':
                        return (
                             <section key="testimonials" className="py-16 md:py-24 px-6 border-t border-white/5">
                                <div className="max-w-6xl mx-auto">
                                <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-12 md:mb-16">{config.content.testimonials.title}</h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {config.content.testimonials.items.map((t, i) => (
                                        <div key={i} className="bg-slate-900 p-8 rounded-2xl border border-white/5 relative">
                                            <div className="text-4xl text-indigo-500 absolute top-4 left-6 opacity-30">"</div>
                                            <p className="text-slate-300 italic mb-6 relative z-10 leading-relaxed text-sm md:text-base">{t.text}</p>
                                            <div className="flex items-center gap-3 mt-auto">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{t.name}</p>
                                                <p className="text-slate-500 text-xs">{t.role}</p>
                                            </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                </div>
                            </section>
                        );
                    case 'pricing':
                        return (
                            <section key="pricing" className="py-16 md:py-24 px-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-indigo-600/5" />
                                <div className="max-w-md mx-auto relative z-10">
                                <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-8 md:p-10 rounded-3xl text-center shadow-2xl">
                                    <h2 className="text-2xl font-bold text-white mb-2">{config.content.pricing.title}</h2>
                                    <div className="my-6 flex items-baseline justify-center gap-1">
                                        <span className="text-5xl font-bold text-white">{config.content.pricing.price}</span>
                                        <span className="text-slate-500">{config.content.pricing.period}</span>
                                    </div>
                                    <ul className="space-y-4 mb-8 text-left">
                                        {config.content.pricing.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-300 text-sm md:text-base">
                                            <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                                                <CheckCircle2 className="h-3 w-3" />
                                            </div>
                                            {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="w-full py-4 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] transition-all transform hover:-translate-y-1 border border-transparent">
                                        {config.content.pricing.cta}
                                    </button>
                                </div>
                                </div>
                            </section>
                        );
                    case 'faq':
                        return (
                            <section key="faq" className="py-16 md:py-24 px-6 border-t border-white/5 bg-slate-950/50">
                                <div className="max-w-3xl mx-auto">
                                    <h2 className="text-3xl font-bold text-center text-white mb-10">{config.content.faq.title}</h2>
                                    <div className="space-y-4">
                                        {config.content.faq.items.map((item, i) => (
                                            <div key={i} className="border border-white/5 rounded-lg bg-white/[0.02] p-6">
                                                <h3 className="text-lg font-bold text-white mb-2">{item.question}</h3>
                                                <p className="text-slate-400 leading-relaxed">{item.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );
                    default: return null;
                }
            })}

             {/* FOOTER */}
             <footer className="py-12 px-6 border-t border-white/5 bg-slate-950 text-center text-slate-500 text-sm">
                <p>&copy; 2024 AI Page Builder. All rights reserved.</p>
             </footer>

            {/* --- LANDING PAGE CONTENT END --- */}
          </div>
        </div>
      </div>

      {/* --- MOBILE TOGGLE BAR (Fixed Bottom) --- */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex bg-slate-800/90 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-2xl ring-1 ring-black/20">
         <button 
           onClick={() => setMobileView('EDITOR')}
           className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
             mobileView === 'EDITOR' 
             ? 'bg-indigo-600 text-white shadow-lg' 
             : 'text-slate-400 hover:text-white'
           }`}
         >
           <Edit3 className="h-4 w-4" /> Edit
         </button>
         <button 
           onClick={() => setMobileView('PREVIEW')}
           className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
             mobileView === 'PREVIEW' 
             ? 'bg-fuchsia-600 text-white shadow-lg' 
             : 'text-slate-400 hover:text-white'
           }`}
         >
           <Eye className="h-4 w-4" /> Preview
         </button>
      </div>

    </div>
  );
};
