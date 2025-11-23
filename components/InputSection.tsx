
import React, { useState, useCallback } from 'react';
import { Upload, Link, Type, X, Zap, Plus, Globe } from 'lucide-react';
import { InputType, TargetLanguage } from '../types';

interface InputSectionProps {
  onGenerate: (text: string, images: string[] | null, url: string | null, language: TargetLanguage) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [activeTab, setActiveTab] = useState<InputType>(InputType.TEXT);
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [language, setLanguage] = useState<TargetLanguage>('English');
  
  // Manage array of selected images
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 4 - selectedImages.length;
      if (remainingSlots <= 0) return;

      const filesArray = Array.from(files).slice(0, remainingSlots) as File[];
      
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          
          setPreviewUrls(prev => [...prev, result]);
          setSelectedImages(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (activeTab === InputType.URL && !inputUrl) return;
    if (activeTab === InputType.TEXT && !inputText) return;
    if (activeTab === InputType.IMAGE && selectedImages.length === 0) return;

    onGenerate(
      inputText, 
      activeTab === InputType.IMAGE ? selectedImages : null, 
      activeTab === InputType.URL ? inputUrl : null,
      language
    );
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden transition-all duration-300">
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab(InputType.TEXT)}
          className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            activeTab === InputType.TEXT ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750 hover:text-white'
          }`}
        >
          <Type className="h-4 w-4" />
          Product Description
        </button>
        <button
          onClick={() => setActiveTab(InputType.IMAGE)}
          className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            activeTab === InputType.IMAGE ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750 hover:text-white'
          }`}
        >
          <Upload className="h-4 w-4" />
          Product Images
        </button>
        <button
          onClick={() => setActiveTab(InputType.URL)}
          className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            activeTab === InputType.URL ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750 hover:text-white'
          }`}
        >
          <Link className="h-4 w-4" />
          Website URL
        </button>
      </div>

      <div className="p-6">
        {activeTab === InputType.TEXT && (
          <textarea
            className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            placeholder={
                language === 'Français' ? "Décrivez votre produit ou service en détail..." :
                language === 'العربية' ? "صف منتجك أو خدمتك بالتفصيل..." :
                "Describe your product or service in detail..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            dir={language === 'العربية' || language === 'Darija (Morocco)' ? 'rtl' : 'ltr'}
          />
        )}

        {activeTab === InputType.URL && (
          <div className="space-y-4">
             <input
              type="url"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://your-product-page.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
             <textarea
              className="w-full h-20 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Optional: Add extra context or specific requirements..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        )}

        {activeTab === InputType.IMAGE && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-900 group aspect-square">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button 
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}

                {previewUrls.length < 4 && (
                    <div className="border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-slate-900/50 transition-all cursor-pointer relative aspect-square">
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                            disabled={previewUrls.length >= 4}
                        />
                        <Plus className="h-8 w-8 text-slate-400 mb-2" />
                        <span className="text-slate-400 text-xs font-medium">Add Image</span>
                        <span className="text-slate-600 text-[10px]">{previewUrls.length}/4</span>
                    </div>
                )}
            </div>

            {previewUrls.length === 0 && (
                <div className="text-center text-slate-500 text-sm">
                    Upload up to 4 product images for better AI analysis.
                </div>
            )}

            <textarea
              className="w-full h-20 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Add specific instructions..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              dir={language === 'العربية' || language === 'Darija (Morocco)' ? 'rtl' : 'ltr'}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col md:flex-row items-center justify-end gap-4">
          
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 w-full md:w-auto">
             <Globe className="h-4 w-4 text-slate-400" />
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as TargetLanguage)}
                className="bg-transparent text-sm text-white font-medium outline-none border-none cursor-pointer w-full md:w-32"
             >
                <option value="English">English</option>
                <option value="Français">Français</option>
                <option value="العربية">العربية</option>
                <option value="Darija (Morocco)">Darija (Morocco)</option>
             </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
                isLoading || 
                (activeTab === InputType.TEXT && !inputText) || 
                (activeTab === InputType.URL && !inputUrl) || 
                (activeTab === InputType.IMAGE && selectedImages.length === 0)
            }
            className={`w-full md:w-auto px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              isLoading 
                ? 'bg-slate-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {language === 'Français' ? 'Génération...' : language === 'العربية' ? 'جاري التوليد...' : 'Generating...'}
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                {language === 'Français' ? 'Générer Campagne' : language === 'العربية' ? 'إنشاء الحملة' : 'Generate Campaign'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
