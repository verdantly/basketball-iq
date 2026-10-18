import React from 'react';
import { Camera, Bot, RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'war-room' | 'vision' | 'roster' | 'grid' | 'advisor';
  setActiveTab: (tab: 'war-room' | 'vision' | 'roster' | 'grid' | 'advisor') => void;
  onOpenVision: () => void;
  onResetDraft: () => void;
  currentPick: number;
  totalPicks: number;
  isUserTurn: boolean;
  userSlot: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenVision,
  onResetDraft,
  currentPick,
  totalPicks,
  isUserTurn,
  userSlot,
}) => {
  const round = Math.floor((currentPick - 1) / 12) + 1;
  const pickInRound = ((currentPick - 1) % 12) + 1;

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-8 max-w-7xl mx-auto">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/30">
            <span className="font-bold text-white text-base tracking-tighter">HQ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-white tracking-tight leading-none whitespace-nowrap">
              Hardwood<span className="text-violet-400">IQ</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Yahoo 9-Cat Draft War Room
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('war-room')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'war-room'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Draft War Room
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'vision'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            Board Vision
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'roster'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            My 9-Cat Build
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'grid'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Snake Board
          </button>
          <button
            onClick={() => setActiveTab('advisor')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'advisor'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            AI Co-GM
          </button>
        </nav>

        {/* Zone 3: Draft Status & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Draft Clock & Pick Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono-numbers">
            <span className="text-slate-400">Pick</span>
            <span className="font-bold text-white">{currentPick}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">R{round}.P{pickInRound}</span>
            {isUserTurn && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                ON CLOCK
              </span>
            )}
          </div>

          <button
            onClick={onOpenVision}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-violet-900/30 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Yahoo Board</span>
          </button>

          <button
            onClick={onResetDraft}
            title="Reset Draft State"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
