import React, { useState, useCallback } from 'react';
import { Upload, Link, Type, X, Zap } from 'lucide-react';
import { InputType } from '../types';

interface InputSectionProps {
  onGenerate: (text: string, image: string | null, url: string | null) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [activeTab, setActiveTab] = useState<InputType>(InputType.TEXT);
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        // Extract base64 data only (remove prefix)
        const base64 = result.split(',')[1];
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = () => {
    if (activeTab === InputType.URL && !inputUrl) return;
    if (activeTab === InputType.TEXT && !inputText) return;
    if (activeTab === InputType.IMAGE && !selectedImage) return;

    onGenerate(
      inputText, 
      activeTab === InputType.IMAGE ? selectedImage : null, 
      activeTab === InputType.URL ? inputUrl : null
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
          Product Image
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
            placeholder="Describe your product or service in detail. What is it? Who is it for? What problem does it solve?"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
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
            {!previewUrl ? (
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-slate-900/50 transition-all cursor-pointer relative">
                 <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                 />
                <Upload className="h-10 w-10 text-slate-400 mb-4" />
                <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                <p className="text-slate-500 text-sm mt-2">PNG, JPG up to 10MB</p>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-900 group">
                <img src={previewUrl} alt="Preview" className="w-full h-64 object-contain" />
                <button 
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <textarea
              className="w-full h-20 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Add specific instructions (e.g., 'Target Gen Z, make it humorous')"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isLoading || (activeTab === InputType.TEXT && !inputText) || (activeTab === InputType.URL && !inputUrl) || (activeTab === InputType.IMAGE && !selectedImage)}
            className={`px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all flex items-center gap-2 ${
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
                Analyzing & Generating...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Generate Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};