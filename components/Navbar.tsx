
import React from 'react';
import { Zap, Layers, History, LayoutTemplate, Menu, Settings } from 'lucide-react';

interface NavbarProps {
  onToggleHistory: () => void;
  onToggleSettings: () => void;
  currentView: 'CAMPAIGN' | 'LANDING';
  onSwitchView: (view: 'CAMPAIGN' | 'LANDING') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleHistory, onToggleSettings, currentView, onSwitchView }) => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onSwitchView('CAMPAIGN')}>
              <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 hidden xs:block">
                AdGen Master
              </span>
            </div>

            {/* Main Navigation - Scrollable on mobile */}
            <div className="flex items-center overflow-x-auto no-scrollbar gap-2 px-1 flex-1 mask-linear-fade md:mask-none md:flex-none">
              <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700 whitespace-nowrap">
                <button
                  onClick={() => onSwitchView('CAMPAIGN')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                    currentView === 'CAMPAIGN' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Campaign Gen
                </button>
                <button
                  onClick={() => onSwitchView('LANDING')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                    currentView === 'LANDING' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LayoutTemplate className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  LP Builder
                </button>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 pl-2">
            <button
                onClick={onToggleSettings}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-slate-800"
                title="Settings / API Key"
            >
                <Settings className="h-5 w-5" />
            </button>
            <button 
              onClick={onToggleHistory}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-2 md:px-3 py-1.5 rounded-md hover:bg-slate-800"
              title="Campaign History"
            >
              <History className="h-5 w-5" />
              <span className="hidden md:inline text-sm font-medium">History</span>
            </button>
            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-slate-700" />
          </div>
        </div>
      </div>
    </nav>
  );
};
