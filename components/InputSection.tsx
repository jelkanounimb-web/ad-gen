
import React, { useState, useRef } from 'react';
import { Upload, Link, Type, X, Zap, Plus, Globe, Mic, Video, StopCircle } from 'lucide-react';
import { InputType, TargetLanguage } from '../types';
import { transcribeAudio } from '../services/geminiService';

interface InputSectionProps {
  onGenerate: (text: string, images: string[] | null, url: string | null, video: string | null, language: TargetLanguage) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [activeTab, setActiveTab] = useState<InputType>(InputType.TEXT);
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [language, setLanguage] = useState<TargetLanguage>('English');
  
  // Images
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Video
  const [inputVideo, setInputVideo] = useState<string | null>(null);

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
             const result = reader.result as string;
             // Store full data url for preview and base64 extraction later
             setInputVideo(result);
         };
         reader.readAsDataURL(file);
     }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                setIsRecording(false);
                // Transcribe immediately to text input
                try {
                    const text = await transcribeAudio(base64);
                    setInputText(prev => prev + " " + text);
                    setActiveTab(InputType.TEXT); // Switch to text tab to show result
                } catch (e) {
                    alert("Transcription failed");
                }
            };
            reader.readAsDataURL(blob);
        };
        mediaRecorder.start();
        setIsRecording(true);
    } catch (e) {
        console.error("Mic error", e);
        alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
      mediaRecorderRef.current?.stop();
  };

  const removeImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    let videoBase64 = null;
    if (activeTab === InputType.VIDEO && inputVideo) {
        videoBase64 = inputVideo.split(',')[1];
    }

    onGenerate(
      inputText, 
      activeTab === InputType.IMAGE ? selectedImages : null, 
      activeTab === InputType.URL ? inputUrl : null,
      videoBase64,
      language
    );
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden transition-all duration-300">
      <div className="flex border-b border-slate-700 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab(InputType.TEXT)} className={`flex-1 min-w-[100px] py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === InputType.TEXT ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750 hover:text-white'}`}>
          <Type className="h-4 w-4" /> Text
        </button>
        <button onClick={() => setActiveTab(InputType.IMAGE)} className={`flex-1 min-w-[100px] py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === InputType.IMAGE ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750 hover:text-white'}`}>
          <Upload className="h-4 w-4" /> Images
        </button>
        <button onClick={() => setActiveTab(InputType.URL)} className={`flex-1 min-w-[100px] py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === InputType.URL ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750 hover:text-white'}`}>
          <Link className="h-4 w-4" /> URL
        </button>
        <button onClick={() => setActiveTab(InputType.VIDEO)} className={`flex-1 min-w-[100px] py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === InputType.VIDEO ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750 hover:text-white'}`}>
          <Video className="h-4 w-4" /> Video
        </button>
      </div>

      <div className="p-6">
        {activeTab === InputType.TEXT && (
          <div className="relative">
            <textarea
                className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder={language === 'Français' ? "Décrivez votre produit..." : "Describe your product..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                dir={language === 'العربية' || language === 'Darija (Morocco)' ? 'rtl' : 'ltr'}
            />
            <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute bottom-3 right-3 p-2 rounded-full shadow-lg transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                title="Record Audio"
            >
                {isRecording ? <StopCircle className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
            </button>
          </div>
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
              placeholder="Optional: Add extra context..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        )}

        {activeTab === InputType.IMAGE && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-900 aspect-square">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                {previewUrls.length < 4 && (
                    <div className="border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-slate-900/50 transition-all cursor-pointer relative aspect-square">
                        <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={previewUrls.length >= 4} />
                        <Plus className="h-8 w-8 text-slate-400 mb-2" />
                        <span className="text-slate-400 text-xs font-medium">Add Image</span>
                    </div>
                )}
            </div>
            <textarea
              className="w-full h-20 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Add specific instructions..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        )}

        {activeTab === InputType.VIDEO && (
            <div className="space-y-4">
                {!inputVideo ? (
                    <div className="border-2 border-dashed border-slate-600 rounded-lg h-40 flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-slate-900/50 transition-all cursor-pointer relative">
                        <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleVideoUpload} />
                        <Video className="h-8 w-8 text-slate-400 mb-2" />
                        <span className="text-slate-400 text-sm font-medium">Upload Video for Analysis (Gemini Pro)</span>
                    </div>
                ) : (
                    <div className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-900">
                        <video src={inputVideo} controls className="w-full max-h-60 object-contain" />
                        <button onClick={() => setInputVideo(null)} className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                 <textarea
                    className="w-full h-20 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Context for video analysis..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
            </div>
        )}

        <div className="mt-6 flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 w-full md:w-auto">
             <Globe className="h-4 w-4 text-slate-400" />
             <select value={language} onChange={(e) => setLanguage(e.target.value as TargetLanguage)} className="bg-transparent text-sm text-white font-medium outline-none border-none cursor-pointer w-full md:w-32">
                <option value="English">English</option>
                <option value="Français">Français</option>
                <option value="العربية">العربية</option>
                <option value="Darija (Morocco)">Darija</option>
             </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || (activeTab === InputType.TEXT && !inputText) || (activeTab === InputType.URL && !inputUrl) || (activeTab === InputType.IMAGE && selectedImages.length === 0) || (activeTab === InputType.VIDEO && !inputVideo)}
            className={`w-full md:w-auto px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'}`}
          >
            {isLoading ? 'Generating...' : <><Zap className="h-5 w-5" /> Generate Campaign</>}
          </button>
        </div>
      </div>
    </div>
  );
};
