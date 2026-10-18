import React from 'react';
import { Player, CATEGORIES } from '../types/fantasy';
import { X, CheckCircle, Plus, Scale, ShieldAlert, Award, Star } from 'lucide-react';

interface PlayerDetailModalProps {
  player: Player | null;
  onClose: () => void;
  onDraftPlayer: (player: Player) => void;
  onMarkTaken: (player: Player) => void;
  onToggleCompare: (player: Player) => void;
  isDraftedByUser: boolean;
  isDraftedByOther: boolean;
  isCompared: boolean;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  onClose,
  onDraftPlayer,
  onMarkTaken,
  onToggleCompare,
  isDraftedByUser,
  isDraftedByOther,
  isCompared,
}) => {
  if (!player) return null;

  const zMap: Record<string, number> = {
    pts: player.zScores.zPts,
    reb: player.zScores.zReb,
    ast: player.zScores.zAst,
    tpm: player.zScores.zTpm,
    stl: player.zScores.zStl,
    blk: player.zScores.zBlk,
    fgPct: player.zScores.zFg,
    ftPct: player.zScores.zFt,
    to: player.zScores.zTo,
  };

  const getZScoreBadge = (z: number) => {
    if (z >= 2.0) return 'text-emerald-400 font-extrabold';
    if (z >= 0.5) return 'text-emerald-300 font-bold';
    if (z >= -0.5) return 'text-slate-300';
    if (z >= -1.5) return 'text-rose-300 font-medium';
    return 'text-rose-500 font-bold';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0B0F17] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              {player.positions[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {player.name}
                </h2>
                {player.tier === 1 && (
                  <span className="text-amber-400 flex items-center text-xs gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    Tier 1
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {player.team} · Yahoo Positions: <strong className="text-white">{player.positions.join(' / ')}</strong> · Yahoo ADP #{player.yahooAdp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Scouting Note */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider block mb-1">
              9-Category Scouting Profile
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {player.scoutingNote}
            </p>
            {player.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {player.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 9 Categories Grid with Z-scores */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Category Projections & Standard Z-Scores
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const z = zMap[cat.key] ?? 0;
                const rawVal = player.stats[cat.key];

                return (
                  <div
                    key={cat.key}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold">{cat.shortLabel}</span>
                      <span className={`font-mono-numbers text-xs ${getZScoreBadge(z)}`}>
                        {z > 0 ? `+${z}` : z}z
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono-numbers">
                      {rawVal}{cat.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Injury & Durability Footprint */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">Injury Risk:</span>
              <span className={`font-bold uppercase text-[11px] ${
                player.injuryRisk === 'low' ? 'text-emerald-400' : player.injuryRisk === 'moderate' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {player.injuryRisk}
              </span>
            </div>
            <span className="text-slate-400">
              Projected Games: <strong className="text-white font-mono-numbers">{player.gamesPlayed}</strong>
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F17] flex items-center justify-between gap-3">
          <button
            onClick={() => onToggleCompare(player)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isCompared
                ? 'bg-amber-600/30 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isCompared ? 'In Compare Drawer' : 'Add to Compare'}</span>
          </button>

          <div className="flex items-center gap-2">
            {!isDraftedByUser && !isDraftedByOther ? (
              <>
                <button
                  onClick={() => {
                    onMarkTaken(player);
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Mark Taken
                </button>
                <button
                  onClick={() => {
                    onDraftPlayer(player);
                    onClose();
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft to My Roster</span>
                </button>
              </>
            ) : isDraftedByUser ? (
              <span className="text-xs font-bold text-violet-400 px-3 py-1.5 bg-violet-950/60 border border-violet-800 rounded-lg">
                On Your Roster
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                Drafted by Another Team
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
