import React from 'react';
import { CategoryKey, CATEGORIES, PuntState } from '../types/fantasy';
import { Target, Zap, ShieldAlert, Check } from 'lucide-react';

interface PuntBarProps {
  punts: PuntState;
  onTogglePunt: (key: CategoryKey) => void;
  onApplyPreset: (preset: 'balanced' | 'punt-ft' | 'punt-fg' | 'punt-ast' | 'punt-blk') => void;
}

export const PuntBar: React.FC<PuntBarProps> = ({ punts, onTogglePunt, onApplyPreset }) => {
  const activePuntCount = Object.values(punts).filter(Boolean).length;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-3.5 mb-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-slate-200 tracking-tight">
            9-Category Punt Engine
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-[11px] text-slate-400">
            {activePuntCount === 0
              ? 'Balanced Build (All 9 Categories Active)'
              : `Punting ${activePuntCount} ${activePuntCount === 1 ? 'Category' : 'Categories'} (Z-Scores Re-calibrated)`}
          </span>
        </div>

        {/* Strategy Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[11px] text-slate-500 font-medium mr-1 whitespace-nowrap">Presets:</span>
          <button
            onClick={() => onApplyPreset('balanced')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
              activePuntCount === 0
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Balanced
          </button>
          <button
            onClick={() => onApplyPreset('punt-ft')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
              punts.ftPct && punts.tpm && !punts.ast
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Punt FT% + 3PM
          </button>
          <button
            onClick={() => onApplyPreset('punt-fg')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
              punts.fgPct && punts.to
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Punt FG% + TO
          </button>
          <button
            onClick={() => onApplyPreset('punt-ast')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
              punts.ast && !punts.ftPct
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Punt AST
          </button>
          <button
            onClick={() => onApplyPreset('punt-blk')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
              punts.blk
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Punt BLK
          </button>
        </div>
      </div>

      {/* 9 Category Toggles */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
        {CATEGORIES.map(cat => {
          const isPunted = !!punts[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => onTogglePunt(cat.key)}
              title={`${cat.description} - Click to ${isPunted ? 'un-punt' : 'punt'}`}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                isPunted
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-inner'
                  : 'bg-slate-900/90 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className={`text-xs font-bold font-mono-numbers ${isPunted ? 'line-through text-amber-400' : 'text-slate-200'}`}>
                  {cat.shortLabel}
                </span>
              </div>
              <span className={`text-[10px] uppercase font-semibold tracking-wider ${isPunted ? 'text-amber-400 font-extrabold' : 'text-slate-500'}`}>
                {isPunted ? 'PUNTED' : 'ACTIVE'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
